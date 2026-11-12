// English Adda · objective games: pick a round's items, re-score the answers, Word Vault reviews.
// Content (with answers) lives in api/_lib/english/*.js and stays on the server; a round's items are sent with
// their answers so the page can give instant feedback, but points and levels come only from the scoring here.
import { createHash } from 'node:crypto';
import { WORDS } from './english/words.js';
import { TRAPS } from './english/fakes.js';
import { JUMBLE } from './english/jumble.js';
import { SPOTFIX } from './english/spotfix.js';
import { GROUPS } from './english/groups.js';

// games playable in this release (the page has the same list: built: true in public/english/english.js)
export const BUILT = ['groups', 'realfake', 'jumble', 'spotfix'];
export const SKILL = { groups: 'voc', realfake: 'voc', vault: 'voc', jumble: 'gra', spotfix: 'gra' };
export const ROUND_N = { realfake: 20, jumble: 8, spotfix: 8, groups: 1 };
const EPOCH = Date.UTC(2026, 10, 1);   // Word Groups puzzle #1 = 2026-11-01

const WORD = new Map(WORDS.map(x => [x.w, x]));
const FAKE = new Map(TRAPS.map(x => [x.f, x]));
const JB = new Map(JUMBLE.map(x => [x.id, x]));
const SF = new Map(SPOTFIX.map(x => [x.id, x]));
const GR = new Map(GROUPS.map(x => [x.id, x]));
export const wordInfo = w => WORD.get(w) || null;

export function rng(seed) {
  let h = createHash('sha1').update(String(seed)).digest().readUInt32LE(0);
  return () => { h |= 0; h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clampLv = l => Math.max(1, Math.min(8, l));

// ---------- picking ----------
// About 70% at the student's level, 20% one below (confidence), 10% one above (stretch).
// Struggling (under 50% over the last 20 at this level): half the round comes from one level below, quietly.
// Unseen items first; seen ones only when a level runs out.
function mix(n, L, low) {
  const below = Math.round(n * (low ? 0.5 : 0.2)), above = low ? 0 : Math.round(n * 0.1);
  return [[clampLv(L - 1), below], [clampLv(L + 1), above], [L, n - below - above]];
}
function pickFrom(pool, idOf, n, L, low, seen, rnd) {
  const byLv = {}; for (const x of pool) (byLv[x.lv] = byLv[x.lv] || []).push(x);
  const out = [], used = new Set();
  const take = (lv, k) => {
    const all = shuffle((byLv[lv] || []).filter(x => !used.has(idOf(x))), rnd);
    const fresh = all.filter(x => !seen.has(idOf(x))), old = all.filter(x => seen.has(idOf(x)));
    const got = [...fresh, ...old].slice(0, k);
    got.forEach(x => { used.add(idOf(x)); out.push(x); });
    return k - got.length;
  };
  let short = 0;
  for (const [lv, k] of mix(n, L, low)) short += take(lv, k);
  // a level ran out: fill from the nearest levels
  for (let d = 0; short > 0 && d < 8; d++) for (const lv of [L - d, L + d]) if (short > 0 && lv >= 1 && lv <= 8) short = take(lv, short);
  return shuffle(out, rnd);
}

export function puzzleFor(tier, day, n) {
  const list = GROUPS.filter(p => p.tier === tier);
  if (!list.length) return null;
  const k = n ? n - 1 : Math.floor((Date.parse(day + 'T00:00:00Z') - EPOCH) / 86400000);
  const i = ((k % list.length) + list.length) % list.length;
  return { p: list[i], n: n || k + 1 };
}
export const tierOf = voc => voc >= 7 ? 3 : voc >= 4 ? 2 : 1;
// tiers 1-2 show the four group names as clues; tier 3 hides them behind a hint button
export const showNames = tier => tier < 3;

// ---------- jumble helpers ----------
const END = /[.?!]$/;   // only the last mark: "3 p.m.?" keeps "3 p.m." and ends with "?"
const split = s => s.split(' / ').map(c => c.trim());
// how a chunk is shown: no sentence-final mark; the sentence-initial capital is dropped (unless it's "I" or cap: true)
function norm(chunk, first, keepCap, last) {
  let c = last ? chunk.replace(END, '') : chunk;
  if (first && !keepCap && !/^I\b/.test(c)) c = c.charAt(0).toLowerCase() + c.slice(1);
  return c;
}
export function jumbleOrders(it) {
  const main = split(it.s).map((c, i, a) => norm(c, i === 0, it.cap, i === a.length - 1));
  // an alternative order may start with a chunk that sits mid-sentence in the main order (e.g. a name): keep its real case
  const alts = (it.alt || []).map(s => split(s).map((c, i, a) => { const n = norm(c, false, false, i === a.length - 1); return i === 0 && main.includes(n) ? n : norm(c, i === 0, false, i === a.length - 1); }));
  return [main, ...alts];
}
// the extra wrong chunk is shown in lower case like the others, so a capital letter never gives it away
export const distractor = it => it.x ? norm(it.x, true, false, false) : null;
const endMark = s => (s.match(END) || ['.'])[0];

// ---------- what the page gets for a round ----------
export function buildRound(game, L, low, seen, seed, opt = {}) {
  const rnd = rng(seed);
  if (game === 'realfake') {
    // fakes are misspellings (recieve) and wrong word forms (unhonest), picked near the student's level like real words
    const n = ROUND_N.realfake, nf = 8;
    const real = pickFrom(WORDS, x => 'w:' + x.w, n - nf, L, low, seen, rnd);
    const fakes = pickFrom(TRAPS, x => 'f:' + x.f, nf, L, low, seen, rnd);
    const items = shuffle([...real.map(x => ({ id: 'w:' + x.w, w: x.w, real: true, m: x.m, ex: x.ex, lv: x.lv })), ...fakes.map(x => ({ id: 'f:' + x.f, w: x.f, real: false, k: x.k, r: x.r, lv: x.lv }))], rnd);
    // no more than 3 fakes in a row
    for (let t = 0; t < 20; t++) { let run = 0, bad = -1; items.forEach((x, i) => { run = x.real ? 0 : run + 1; if (run > 3 && bad < 0) bad = i; }); if (bad < 0) break; const j = items.findIndex(x => x.real); [items[bad], items[j]] = [items[j], items[bad]]; }
    return { items };
  }
  if (game === 'jumble') {
    return { items: pickFrom(JUMBLE, x => x.id, ROUND_N.jumble, L, low, seen, rnd).map(it => {
      const orders = jumbleOrders(it);
      const x = distractor(it);
      const chunks = shuffle([...orders[0], ...(x ? [x] : [])], rnd);
      return { id: it.id, lv: it.lv, chunks, n: orders[0].length, end: endMark(it.s), orders, x, hint: it.hint, why: it.why };
    }) };
  }
  if (game === 'spotfix') {
    return { items: pickFrom(SPOTFIX, x => x.id, ROUND_N.spotfix, L, low, seen, rnd).map(it => {
      const raw = split(it.s), err = raw.findIndex(c => c.includes('['));
      const bad = err < 0 ? null : (raw[err].match(/\[([^\]]*)\]/) || [])[1];
      return { id: it.id, lv: it.lv, parts: raw.map(c => c.replace(/[[\]]/g, '')), err: err < 0 ? null : err, bad, fixes: it.fixes, ans: it.ans, hint: it.hint, why: it.why, ctx: it.ctx };
    }) };
  }
  if (game === 'groups') {
    const pz = puzzleFor(opt.tier || tierOf(L), opt.day, opt.n);
    if (!pz) return { items: [] };
    return { items: [{ id: pz.p.id, n: pz.n, tier: pz.p.tier, names: showNames(pz.p.tier), words: shuffle(pz.p.groups.flatMap(g => g.words), rnd), groups: pz.p.groups }] };
  }
  return { items: [] };
}

// ---------- scoring (the copy that counts) ----------
// Each answer is the student's FIRST attempt at the item. Returns { ok, lv, skill, ans } per item, or null if the item isn't real.
export function scoreItem(game, id, a, L) {
  if (game === 'realfake') {
    const real = id.startsWith('w:') ? WORD.get(id.slice(2)) : null, fake = id.startsWith('f:') ? FAKE.get(id.slice(2)) : null;
    if (!real && !fake) return null;
    const said = a === true ? true : a === false ? false : null;
    return { ok: said === !!real, lv: real ? real.lv : fake.lv, ans: said == null ? '' : said ? 'real' : 'fake' };
  }
  if (game === 'jumble') {
    const it = JB.get(id); if (!it) return null;
    const got = Array.isArray(a) ? a.map(String).join(' | ') : '';
    return { ok: jumbleOrders(it).some(o => o.join(' | ') === got), lv: it.lv, ans: got.slice(0, 300) };
  }
  if (game === 'spotfix') {
    const it = SF.get(id); if (!it) return null;
    const raw = split(it.s), err = raw.findIndex(c => c.includes('['));
    const p = a && Number.isInteger(a.p) ? a.p : null, f = a && Number.isInteger(a.f) ? a.f : null;
    const ok = err < 0 ? p === -1 : p === err && f === it.ans;
    return { ok, lv: it.lv, ans: JSON.stringify({ p, f }) };
  }
  if (game === 'groups') {
    const pz = GR.get(id); if (!pz) return null;
    // replay the guesses: 4 mistakes allowed
    const left = pz.groups.map(g => new Set(g.words)); let solved = 0, miss = 0;
    for (const gs of (Array.isArray(a) ? a : []).slice(0, 12)) {
      if (miss >= 4 || !Array.isArray(gs) || gs.length !== 4) break;
      const k = left.findIndex(s => s && gs.every(w => s.has(w)));
      if (k >= 0) { left[k] = null; solved++; } else miss++;
    }
    return { ok: solved === 4, lv: null, solved, miss, ans: JSON.stringify(a).slice(0, 600) };
  }
  return null;
}

// Adda points for one round: 10 for finishing + up to 10 for accuracy (Word Groups: +10 clean solve, +5 with mistakes). Max 25.
export function roundPoints(game, scored) {
  if (game === 'groups') { const g = scored[0]; return g && g.ok ? 10 + (g.miss === 0 ? 10 : 5) : 10; }
  const n = scored.length, k = scored.filter(x => x.ok).length;
  return Math.min(25, 10 + Math.round(10 * (n ? k / n : 0)));
}

// ---------- Word Vault ----------
export const BOX_DAYS = [1, 3, 7, 14, 30];
// one review question per due word, formats rotate: meaning -> word, word -> meaning, fill the gap
export function vaultQuiz(words, seed) {
  const rnd = rng(seed), F = ['m2w', 'w2m', 'gap'];
  return words.map((v, i) => {
    const it = WORD.get(v.word); if (!it) return null;
    let fmt = F[(v.box + i) % 3];
    const gapText = it.ex.replace(new RegExp('\\b' + it.w + '\\b'), '_____');
    if (fmt === 'gap' && gapText === it.ex) fmt = 'm2w';
    // wrong options: similar level, never a word marked as too close in meaning (avoid: [...] on either word)
    const clash = x => (it.avoid || []).includes(x.w) || (x.avoid || []).includes(it.w);
    const near = shuffle(WORDS.filter(x => x.w !== it.w && Math.abs(x.lv - it.lv) <= 1 && !clash(x)), rnd).slice(0, 3);
    const opts = shuffle([it, ...near], rnd);
    const ans = opts.indexOf(it);
    if (fmt === 'w2m') return { w: it.w, fmt, q: it.w, o: opts.map(x => x.m), ans, m: it.m, ex: it.ex };
    if (fmt === 'gap') return { w: it.w, fmt, q: gapText, o: opts.map(x => x.w), ans, m: it.m, ex: it.ex };
    return { w: it.w, fmt, q: it.m, o: opts.map(x => x.w), ans, m: it.m, ex: it.ex };
  }).filter(Boolean);
}
