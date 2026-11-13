// English Adda · objective games: pick a round's items, re-score the answers, Word Vault reviews.
// Content (with answers) lives in api/_lib/english/*.js and stays on the server; a round's items are sent with
// their answers so the page can give instant feedback, but points and levels come only from the scoring here.
import { createHash } from 'node:crypto';
import { WORDS } from './english/words.js';
import { TRAPS } from './english/fakes.js';
import { JUMBLE } from './english/jumble.js';
import { SPOTFIX } from './english/spotfix.js';
import { GROUPS } from './english/groups.js';
import { PAIRS } from './english/pairs.js';
import { MUNCH } from './english/munch.js';
import { NOTES } from './english/notes.js';
import { ECHO } from './english/echo.js';
import { VOICE, clipName } from './english-check.js';

// games playable in this release (the page has the same list: built: true in public/english/english.js)
// Word Groups ('groups') was taken out of play in Nov 2026 (owner: hard and boring). Its content and scoring are kept below.
// Nov 2026: Munch (writing), Pigeon Post (reading) and Echo (listening) added, so every skill has a game.
export const BUILT = ['realfake', 'pairup', 'flick', 'express', 'munch', 'post', 'echo'];
export const SKILL = { groups: 'voc', realfake: 'voc', vault: 'voc', pairup: 'voc', flick: 'gra', express: 'gra', munch: 'wri', post: 'rea', echo: 'lis' };
export const ROUND_N = { realfake: 20, pairup: 20, flick: 20, express: 8, groups: 1, munch: 12, post: 8, echo: 10 };
// "run" games: one fast action, a score with a streak multiplier, Chill (no clock) and Rush (a clock per item)
export const RUN = ['flick', 'express', 'pairup', 'realfake', 'munch', 'post', 'echo'];
const RF_LIM = 6000;          // Real or Fake, Rush clock for one egg
const EPOCH = Date.UTC(2026, 10, 1);   // Word Groups puzzle #1 = 2026-11-01

const WORD = new Map(WORDS.map(x => [x.w, x]));
const FAKE = new Map(TRAPS.map(x => [x.f, x]));
const JB = new Map(JUMBLE.map(x => [x.id, x]));
const SF = new Map(SPOTFIX.map(x => [x.id, x]));
const GR = new Map(GROUPS.map(x => [x.id, x]));
const PR = new Map(PAIRS.map(x => [x.id, x]));
const MU = new Map(MUNCH.map(x => [x.id, x]));
const NO = new Map(NOTES.map(x => [x.id, x]));
const EC = new Map(ECHO.map(x => [x.id, x]));
export const wordInfo = w => WORD.get(w) || null;
// short text of an item for the admin report (content health): what the student saw, plus the right answer where it helps
export function itemLabel(game, id) {
  id = String(id);
  if (game === 'realfake') {
    if (id.startsWith('w:')) return { text: id.slice(2), right: 'Real word', lv: (WORD.get(id.slice(2)) || {}).lv };
    const f = FAKE.get(id.slice(2)); return { text: id.slice(2), right: f ? 'Fake (' + (f.k === 'spell' ? 'right spelling: ' : 'right form: ') + f.r + ')' : 'Fake', lv: f && f.lv };
  }
  if (game === 'flick') { const m = /^(.+):([gb])$/.exec(id), it = m && SF.get(m[1]); if (!it) return null;
    const ans = it.ans == null ? null : it.fixes[it.ans];
    return { text: it.s.replace(/\s*\/\s*/g, ' ').replace(/\[([^\]]*)\]/, (x, w) => m[2] === 'g' && ans ? ans : w), right: m[2] === 'g' ? 'Right sentence (Hop)' : 'Wrong: fix “' + (ans || '') + '”', lv: it.lv }; }
  const strip = t => String(t || '').replace(/\s*\/\s*/g, ' ').replace(/\[([^\]|]*)(\|[^\]]*)?\]/g, '[$1]');
  if (game === 'express') { const it = JB.get(id); return it && { text: strip(it.s), right: '', lv: it.lv }; }
  if (game === 'pairup') { const it = PR.get(id); return it && { text: it.a + ' → ' + it.b, right: it.b, lv: it.lv, kind: it.k }; }
  if (game === 'munch') { const it = MU.get(id); return it && { text: strip(it.s), right: 'extra word in [ ]', lv: it.lv }; }
  if (game === 'post') { const it = NO.get(id); return it && { text: it.q, right: it.a, lv: it.lv }; }
  if (game === 'echo') { const it = EC.get(id); return it && { text: it.s.replace(/\[([^\]|]*)[^\]]*\]/g, '[$1]'), right: 'first word in [ ]', lv: it.lv }; }
  if (game === 'groups') { const it = GR.get(id); return it && { text: 'Word Groups ' + id, right: '', lv: it.tier }; }
  return { text: id, right: '' };
}

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
// Express: about half the coaches are already on the train, so the sentence makes sense at a glance. The first coach is
// always one of them; the rest are picked by the item's id, so the same sentence always shows the same coaches.
export function expressFixed(it) {
  const n = jumbleOrders(it)[0].length, k = Math.max(1, Math.floor(n / 2));
  const rest = shuffle(Array.from({ length: n - 1 }, (_, i) => i + 1), rng('fix:' + it.id)).slice(0, k - 1);
  return [0, ...rest].sort((a, b) => a - b);
}
// the right orders that agree with the coaches already on the train
const expressOrders = (it, fixed) => { const o = jumbleOrders(it); return o.filter(x => fixed.every(i => x[i] === o[0][i])); };
// Rush clock for one train: 5 s + 2.5 s per empty place
const expressLim = gaps => 5000 + 2500 * gaps;

// ---------- flick helpers ----------
// A Spot & Fix sentence becomes one card: 'b' = the sentence with its mistake, 'g' = the fixed (or already right) sentence.
// pre + mid + post is the sentence; mid is the word that is wrong (b) or was fixed (g), so the page can mark it.
export function flickCard(it, v) {
  const raw = split(it.s), err = raw.findIndex(c => c.includes('['));
  const parts = raw.map(c => c.replace(/[[\]]/g, ''));
  const base = { lv: it.lv, why: it.why, ctx: it.ctx };
  // parts = the sentence as phrases (one stepping stone each); err = which phrase holds the mistake (-1: none)
  if (err < 0) return v === 'g' ? { ...base, id: it.id + ':g', good: true, pre: parts.join(' '), mid: '', post: '', parts, err: -1 } : null;
  if (v !== 'g' && v !== 'b') return null;
  const bad = (raw[err].match(/\[([^\]]*)\]/) || [])[1], fix = it.fixes[it.ans];
  const at = parts[err].indexOf(bad);
  const pre = [...parts.slice(0, err), parts[err].slice(0, at)].join(' '), post = [parts[err].slice(at + bad.length), ...parts.slice(err + 1)].join(' ');
  const fixPart = parts[err].replace(bad, fix);
  return { ...base, id: it.id + ':' + v, good: v === 'g', pre, mid: v === 'g' ? fix : bad, post, bad, fix,
           parts: v === 'g' ? parts.map((c, i) => i === err ? fixPart : c) : parts, err, fixPart };
}
const words = c => (c.pre + c.mid + c.post).trim().split(/\s+/).length;
// Rush clock for one card: time to read it once and decide
const flickLim = c => Math.max(6500, Math.min(11000, 5000 + 350 * words(c)));   // read it once, decide, and tap a stone

// ---------- pair up helpers ----------
// Two pairs must never share a round if a student could mix them up: they share a tile text, or they are the same kind
// and share a `set`. (Tiles pair only within a kind, so pairs of different kinds cannot be mixed up.)
const setsOf = x => [].concat(x.set || []);
export const pairClash = (x, y) => [x.a, x.b].some(t => t === y.a || t === y.b) || (x.k === y.k && setsOf(x).some(t => setsOf(y).includes(t)));
const PAIR_LIM = 7000;        // Rush clock for one dive

// ---------- munch helpers ----------
// A Munch sentence is a row of leaves, one word each. Exactly one word is extra (in [brackets] in the content):
// the goat eats it and the sentence still says the same thing. x = the index of the extra word.
export function munchItem(it) {
  const toks = it.s.split(' '), x = toks.findIndex(t => /^\[[^\]\s]+\][.,?!]?$/.test(t) || /^\[[^\]\s]+\]$/.test(t));
  const words = toks.map(t => t.replace(/[[\]]/g, ''));
  return { words, x, fix: words.filter((_, i) => i !== x).join(' ') };
}
// Rush clock for one sentence: read it once and tap
const munchLim = n => Math.max(6000, Math.min(12000, 4000 + 450 * n));

// ---------- pigeon post helpers ----------
const wordCount = s => String(s).trim().split(/\s+/).length;
// Rush clock for one note: a slow-but-steady reader (about 130 words a minute) plus time to choose
export const postLim = it => Math.round(Math.min(45000, 6000 + 460 * wordCount(it.text)));

// ---------- echo helpers ----------
// A sentence with gaps: [right|wrong|wrong]. The clip is the whole sentence with the right words, recorded once
// by scripts/english-voice.py (secret: the browser gets only the file name). Faster speech at higher levels.
export const ECHO_SPEED = [0.85, 0.85, 0.9, 0.95, 1.0, 1.0, 1.05, 1.1];
export function echoParse(it) {
  const parts = [], gaps = []; let last = 0, m;
  const re = /\[([^\]]+)\]/g;
  while ((m = re.exec(it.s))) {
    if (m.index > last) parts.push({ t: it.s.slice(last, m.index) });
    const o = m[1].split('|').map(x => x.trim());
    parts.push({ g: gaps.length }); gaps.push({ a: o[0], o });
    last = re.lastIndex;
  }
  if (last < it.s.length) parts.push({ t: it.s.slice(last) });
  return { parts, gaps, text: it.s.replace(/\[([^\]|]+)[^\]]*\]/g, '$1') };
}
export const echoSpeed = it => ECHO_SPEED[it.lv - 1] || 1;
export const echoClip = it => clipName(VOICE, echoSpeed(it), echoParse(it).text);
// Rush clock for one sentence, counted from the end of the sound: 4 s + 2.5 s per gap
const echoLim = gaps => 4000 + 2500 * gaps;

// ---------- what the page gets for a round ----------
export function buildRound(game, L, low, seen, seed, opt = {}) {
  const rnd = rng(seed);
  if (game === 'realfake') {
    // fakes are misspellings (recieve) and wrong word forms (unhonest), picked near the student's level like real words
    const n = ROUND_N.realfake, nf = 8;
    const real = pickFrom(WORDS, x => 'w:' + x.w, n - nf, L, low, seen, rnd);
    const fakes = pickFrom(TRAPS, x => 'f:' + x.f, nf, L, low, seen, rnd);
    const items = shuffle([...real.map(x => ({ id: 'w:' + x.w, w: x.w, real: true, m: x.m, ex: x.ex, lv: x.lv, lim: RF_LIM })), ...fakes.map(x => ({ id: 'f:' + x.f, w: x.f, real: false, k: x.k, r: x.r, lv: x.lv, lim: RF_LIM }))], rnd);
    // no more than 3 fakes in a row
    for (let t = 0; t < 20; t++) { let run = 0, bad = -1; items.forEach((x, i) => { run = x.real ? 0 : run + 1; if (run > 3 && bad < 0) bad = i; }); if (bad < 0) break; const j = items.findIndex(x => x.real); [items[bad], items[j]] = [items[j], items[bad]]; }
    return { items };
  }
  if (game === 'express') {
    return { items: pickFrom(JUMBLE, x => x.id, ROUND_N.express, L, low, seen, rnd).map(it => {
      const fixed = expressFixed(it), orders = expressOrders(it, fixed), n = orders[0].length;
      const x = distractor(it);
      // the yard holds only the coaches that are not on the train yet (plus the one that doesn't belong, at level 4+)
      const chunks = shuffle([...orders[0].filter((c, i) => !fixed.includes(i)), ...(x ? [x] : [])], rnd);
      return { id: it.id, lv: it.lv, chunks, n, fixed, end: endMark(it.s), orders, x, hint: it.hint, why: it.why, lim: expressLim(n - fixed.length) };
    }) };
  }
  if (game === 'flick') {
    // "seen" holds card ids (s1-01:b); an item counts as seen once either of its cards was played
    const seenBase = new Set([...seen].map(id => id.replace(/:[gb]$/, '')));
    const picked = pickFrom(SPOTFIX, x => x.id, ROUND_N.flick, L, low, seenBase, rnd);
    // about half the cards are wrong: sentences with no error are always right, so most error sentences show their mistake
    const withErr = picked.filter(x => x.fixes), want = Math.min(withErr.length, Math.round(picked.length / 2));
    const asBad = new Set(shuffle(withErr.slice(), rnd).sort((a, b) => seen.has(a.id + ':b') - seen.has(b.id + ':b')).slice(0, want).map(x => x.id));
    const items = picked.map(it => { const c = flickCard(it, asBad.has(it.id) ? 'b' : 'g'); return { ...c, lim: flickLim(c) }; });
    // no more than 3 of the same kind in a row
    for (let t = 0; t < 40; t++) {
      let run = 0, at = -1; items.forEach((x, i) => { run = i && x.good === items[i - 1].good ? run + 1 : 1; if (run > 3 && at < 0) at = i; });
      if (at < 0) break;
      const j = items.findIndex((x, k) => x.good !== items[at].good && (k < at - 3 || k > at)); if (j < 0) break;
      [items[at], items[j]] = [items[j], items[at]];
    }
    return { items };
  }
  if (game === 'pairup') {
    // the usual level mix first; then drop any pair that could be mixed up with one already chosen,
    // and fill the gaps from the nearest levels (unseen first)
    const n = ROUND_N.pairup, out = [];
    const add = list => { for (const x of list) { if (out.length >= n) break; if (!out.includes(x) && !out.some(y => pairClash(x, y))) out.push(x); } };
    add(pickFrom(PAIRS, x => x.id, n, L, low, seen, rnd));
    for (let d = 0; d < 8 && out.length < n; d++) {
      const near = shuffle(PAIRS.filter(x => Math.abs(x.lv - L) === d), rnd);
      add([...near.filter(x => !seen.has(x.id)), ...near.filter(x => seen.has(x.id))]);
    }
    // Dive: the right word plus three wrong ones. Wrong words come from pairs of the same kind near this level that
    // cannot be mixed up with this pair (no shared set, no shared tile).
    const opts = x => {
      const o = [];
      for (const y of shuffle(PAIRS.filter(y => y !== x && y.k === x.k && Math.abs(y.lv - x.lv) <= 2 && !pairClash(x, y)), rnd)) { if (o.length >= 3) break; if (y.b !== x.b && !o.includes(y.b)) o.push(y.b); }
      return shuffle([x.b, ...o], rnd);
    };
    return { items: shuffle(out, rnd).map(x => ({ id: x.id, lv: x.lv, k: x.k, a: x.a, b: x.b, opts: opts(x), lim: PAIR_LIM })) };
  }
  if (game === 'munch') {
    return { items: pickFrom(MUNCH, x => x.id, ROUND_N.munch, L, low, seen, rnd).map(it => {
      const m = munchItem(it);
      return { id: it.id, lv: it.lv, words: m.words, x: m.x, fix: m.fix, why: it.why, ctx: it.ctx, lim: munchLim(m.words.length) };
    }) };
  }
  if (game === 'post') {
    return { items: pickFrom(NOTES, x => x.id, ROUND_N.post, L, low, seen, rnd).map(it => ({
      id: it.id, lv: it.lv, kind: it.kind, from: it.from, text: it.text, q: it.q, a: it.a, opts: shuffle([it.a, ...it.o], rnd), why: it.why, lim: postLim(it)
    })) };
  }
  if (game === 'echo') {
    return { items: pickFrom(ECHO, x => x.id, ROUND_N.echo, L, low, seen, rnd).map(it => {
      const e = echoParse(it);
      return { id: it.id, lv: it.lv, parts: e.parts, gaps: e.gaps.map(g => ({ a: g.a, o: shuffle(g.o.slice(), rnd) })), clip: echoClip(it), why: it.why, lim: echoLim(e.gaps.length) };
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
    return { ok: said === !!real, lv: real ? real.lv : fake.lv, lim: RF_LIM, ans: said == null ? '' : said ? 'real' : 'fake' };
  }
  if (game === 'express') {
    // a = every coach the student tapped, in order, wrong taps included. The empty places fill from left to right.
    // Replay the taps: a tap counts if the train so far still matches one of the right orders.
    // Right first time = every empty place filled with no wrong tap.
    const it = JB.get(id); if (!it) return null;
    const fixed = expressFixed(it), orders = expressOrders(it, fixed), n = orders[0].length;
    const gaps = Array.from({ length: n }, (_, i) => i).filter(i => !fixed.includes(i));
    const taps = (Array.isArray(a) ? a : []).slice(0, 40).map(String);
    let placed = [], wrong = 0;
    for (const t of taps) {
      if (placed.length >= gaps.length) break;
      const next = [...placed, t];
      if (orders.some(o => next.every((c, j) => o[gaps[j]] === c))) placed = next; else wrong++;
    }
    const done = placed.length === gaps.length;
    return { ok: done && wrong === 0, done, wrong, lv: it.lv, lim: expressLim(gaps.length), ans: taps.join(' | ').slice(0, 300) };
  }
  if (game === 'flick') {
    // a = true (Hop: the sentence is right), { p: stone } (Wait, then the stone tapped as wrong) or null (ran out of time).
    // A wrong sentence is right first time only if the student waited AND tapped the stone with the mistake.
    const m = /^(.+):([gb])$/.exec(id), it = m && SF.get(m[1]), c = it && flickCard(it, m[2]);
    if (!c) return null;
    const p = a && Number.isInteger(a.p) ? a.p : null;
    return { ok: c.good ? a === true : p === c.err, lv: it.lv, lim: flickLim(c), ans: a === true ? 'hop' : p == null ? '' : 'wait:' + p };
  }
  if (game === 'pairup') {
    // a = the word on the fish the student tapped (null: ran out of time)
    const it = PR.get(id); if (!it) return null;
    return { ok: a === it.b, lv: it.lv, lim: PAIR_LIM, ans: typeof a === 'string' ? a.slice(0, 60) : '' };
  }
  if (game === 'munch') {
    // a = the index of the word the student fed to the goat (null: ran out of time)
    const it = MU.get(id); if (!it) return null;
    const m = munchItem(it), k = Number.isInteger(a) ? a : null;
    return { ok: k === m.x, lv: it.lv, lim: munchLim(m.words.length), ans: k == null ? '' : m.words[k] || '' };
  }
  if (game === 'post') {
    // a = the answer on the roof the student tapped
    const it = NO.get(id); if (!it) return null;
    return { ok: a === it.a, lv: it.lv, lim: postLim(it), ans: typeof a === 'string' ? a.slice(0, 60) : '' };
  }
  if (game === 'echo') {
    // a = the first word tapped for each gap, in order. Right first time = every gap right on the first tap.
    const it = EC.get(id); if (!it) return null;
    const g = echoParse(it).gaps, picks = (Array.isArray(a) ? a : []).slice(0, g.length).map(x => typeof x === 'string' ? x.slice(0, 30) : '');
    return { ok: g.every((x, i) => picks[i] === x.a), lv: it.lv, lim: echoLim(g.length), ans: picks.join(' | ') };
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

// Run score (Flick, Express): 100 per right answer x the streak multiplier (x2 after 3 in a row, x3 after 6 ... up to x5).
// Rush adds up to 50 per answer for speed. Express: a train finished after a wrong tap still earns 40.
// The page shows the same sum live (runGain in english.js); the number that is saved is this one.
export const streakMult = streak => Math.min(5, 1 + Math.floor((streak - 1) / 3));
export function runScore(scored, mode) {
  let streak = 0, best = 0, score = 0;
  for (const x of scored) {
    if (x.ok) {
      streak++; best = Math.max(best, streak);
      score += 100 * streakMult(streak) + (mode === 'rush' && x.ms != null && x.lim ? Math.round(50 * Math.max(0, 1 - x.ms / x.lim)) : 0);
    } else { streak = 0; if (x.done) score += 40; }
  }
  return { score, streak: best };
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
