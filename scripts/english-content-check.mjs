// English Adda · automatic checks on the game content in api/_lib/english/ (Build Spec §9.4 step 2).
// Run: node scripts/english-content-check.mjs     Exit code 1 if anything is wrong.
// Word frequency bands and fake-word frequency checks need Python wordfreq and run separately (see the headers of words.js and fakes.js).
import { WORDS } from '../api/_lib/english/words.js';
import { TRAPS } from '../api/_lib/english/fakes.js';
import { JUMBLE } from '../api/_lib/english/jumble.js';
import { SPOTFIX } from '../api/_lib/english/spotfix.js';
import { GROUPS } from '../api/_lib/english/groups.js';
import { PAIRS } from '../api/_lib/english/pairs.js';
import { MUNCH } from '../api/_lib/english/munch.js';
import { NOTES } from '../api/_lib/english/notes.js';
import { ECHO } from '../api/_lib/english/echo.js';
import { existsSync } from 'node:fs';
import { jumbleOrders, distractor, expressFixed, flickCard, pairClash, buildRound, scoreItem, munchItem, echoParse, echoClip } from '../api/_lib/english-games.js';
import { RF } from '../api/_lib/english-check.js';

const bad = [];
const err = (id, msg) => bad.push(id + ': ' + msg);
const dupes = (list, key, name) => { const seen = new Set(); for (const x of list) { const k = key(x); if (seen.has(k)) err(name, 'duplicate ' + k); seen.add(k); } };
const BANNED = /\b(damn|hell|sex|kill|drunk|caste|hindu|muslim|christian|sikh|bjp|congress)\b/i;
const lvOk = x => Number.isInteger(x.lv) && x.lv >= 1 && x.lv <= 8;
const STRAIGHT = /['"]/;   // student-facing text uses curly quotes

// ---- words ----
dupes(WORDS, x => x.w, 'WORDS'); dupes(TRAPS, x => x.f, 'TRAPS');
const checkWords = new Set(RF.map(x => x.w));
for (const x of WORDS) {
  const id = 'word ' + x.w;
  if (!lvOk(x)) err(id, 'bad lv');
  if (!/^[a-z]+$/.test(x.w)) err(id, 'word must be lowercase letters');
  if (checkWords.has(x.w)) err(id, 'also in the level check');
  if (TRAPS.some(t => t.f === x.w)) err(id, 'also a fake');
  if (!x.m || x.m.split(/\s+/).length > 12) err(id, 'meaning missing or over 12 words');
  if (x.m && new RegExp('\\b' + x.w.slice(0, Math.max(4, x.w.length - 2)), 'i').test(x.m)) err(id, 'meaning uses the word');
  const hits = (x.ex || '').match(new RegExp('\\b' + x.w + '\\b', 'g')) || [];
  if (hits.length !== 1) err(id, 'example must contain the word exactly once (has ' + hits.length + ')');
  if (STRAIGHT.test(x.m + x.ex)) err(id, 'straight quote');
  if (BANNED.test(x.ex)) err(id, 'banned word in example');
  for (const a of x.avoid || []) if (!WORDS.some(y => y.w === a)) err(id, 'avoid names a word that is not in WORDS: ' + a);
}
const fakePer = {};
for (const t of TRAPS) {
  const id = 'fake ' + t.f;
  if (!/^[a-z]{4,14}$/.test(t.f)) err(id, 'bad shape');
  if (!lvOk(t)) err(id, 'bad lv');
  if (!['spell', 'form'].includes(t.k)) err(id, 'k must be spell or form');
  if (!t.r || STRAIGHT.test(t.r) || t.r === t.f) err(id, 'r missing, straight quote or same as f');
  if (checkWords.has(t.f)) err(id, 'is a word in the level check');
  fakePer[t.lv] = (fakePer[t.lv] || 0) + 1;
}
for (let L = 1; L <= 8; L++) if ((fakePer[L] || 0) < 8) err('TRAPS lv ' + L, 'only ' + (fakePer[L] || 0) + ' fakes (need 8+)');
const per = {}; WORDS.forEach(x => per[x.lv] = (per[x.lv] || 0) + 1);

// ---- jumble ----
dupes(JUMBLE, x => x.id, 'JUMBLE'); dupes(JUMBLE, x => x.s.replace(/ \/ /g, ' ').toLowerCase(), 'JUMBLE sentence');
const CH = { 1: [4, 4], 2: [4, 5], 3: [5, 5], 4: [5, 6], 5: [6, 6], 6: [6, 7], 7: [7, 8], 8: [8, 9] };
for (const x of JUMBLE) {
  const id = x.id;
  if (!lvOk(x)) { err(id, 'bad lv'); continue; }
  if (!new RegExp('^j' + x.lv + '-\\d\\d$').test(id)) err(id, 'id does not match lv');
  const orders = jumbleOrders(x), n = orders[0].length;
  if (n < CH[x.lv][0] - 1 || n > CH[x.lv][1] + 1) err(id, n + ' chunks is outside the level range ' + CH[x.lv].join('-'));
  const key = o => o.slice().sort().join('|');
  orders.forEach((o, k) => { if (k && key(o) !== key(orders[0])) err(id, 'alt order ' + k + ' uses different chunks: ' + o.join(' / ')); });
  if (new Set(orders.map(o => o.join('|'))).size !== orders.length) err(id, 'alt repeats an order');
  if (new Set(orders[0]).size !== n) err(id, 'duplicate chunk text');
  if (x.lv >= 4 && !x.x) err(id, 'needs a distractor at lv 4+');
  if (x.lv < 4 && x.x) err(id, 'no distractor below lv 4');
  if (x.x && orders[0].includes(distractor(x))) err(id, 'distractor equals a real chunk');
  if (orders[0].some(c => c.split(/\s+/).length > 4)) err(id, 'chunk over 4 words');
  if (!x.hint || !x.why) err(id, 'missing hint or why');
  if (STRAIGHT.test(x.s + x.hint + x.why + (x.x || '') + (x.alt || []).join(''))) err(id, 'straight quote');
  if (BANNED.test(x.s)) err(id, 'banned word');
  // scoring round-trip: the canonical order scores right, a reversed order wrong
  // Express: some coaches are already on the train; the student taps the rest, left to right
  const fx = expressFixed(x), fill = orders[0].filter((c, i) => !fx.includes(i));
  if (fx[0] !== 0 || !fill.length || fx.length + fill.length !== n) err(id, 'bad set of coaches already on the train');
  if (!scoreItem('express', id, fill, x.lv).ok) err(id, 'canonical order does not score as right');
  const stray = x.x ? distractor(x) : fill[fill.length - 1];
  if (fill.length > 1 && scoreItem('express', id, [stray, ...fill], x.lv).ok) err(id, 'a wrong first tap still scores as right first time');
  if (fill.length > 1 && scoreItem('express', id, fill.slice().reverse(), x.lv).ok) err(id, 'reversed order scores right');
}

// ---- spot & fix ----
dupes(SPOTFIX, x => x.id, 'SPOTFIX'); dupes(SPOTFIX, x => x.s.replace(/[[\]]/g, '').replace(/ \/ /g, ' ').toLowerCase(), 'SPOTFIX sentence');
const sfPer = {};
for (const x of SPOTFIX) {
  const id = x.id;
  if (!lvOk(x)) { err(id, 'bad lv'); continue; }
  const parts = x.s.split(' / '), br = parts.filter(p => p.includes('['));
  (sfPer[x.lv] = sfPer[x.lv] || { n: 0, none: 0 }).n++;
  if (parts.length < 3 || parts.length > 7) err(id, parts.length + ' parts (3-7)');
  if (x.fixes == null) {
    sfPer[x.lv].none++;
    if (br.length || x.ans != null) err(id, 'no-error item has a bracket or an answer');
    if (!scoreItem('flick', id + ':g', true, x.lv).ok) err(id, 'swiping Right does not score as right');
    if (scoreItem('flick', id + ':b', { p: 0 }, x.lv)) err(id, 'a no-error item must not have a wrong card');
  } else {
    if (br.length !== 1 || (x.s.match(/\[/g) || []).length !== 1) err(id, 'needs exactly one bracketed part');
    if (!Array.isArray(x.fixes) || x.fixes.length !== 3 || new Set(x.fixes).size !== 3) err(id, 'needs 3 different fixes');
    if (![0, 1, 2].includes(x.ans)) err(id, 'ans must be 0-2');
    const inside = (x.s.match(/\[([^\]]+)\]/) || [])[1];
    if (inside && x.fixes && x.fixes.includes(inside)) err(id, 'a fix equals the error text');
    const k = parts.findIndex(p => p.includes('['));
    // Flick cards: the wrong card shows the sentence as written, the right card shows it with the fix in place
    const plain = x.s.replace(/ \/ /g, ' '), bad = flickCard(x, 'b'), good = flickCard(x, 'g');
    if (bad.pre + bad.mid + bad.post !== plain.replace(/[[\]]/g, '')) err(id, 'wrong card does not rebuild the sentence');
    if (good.pre + good.mid + good.post !== plain.replace(/\[[^\]]*\]/, x.fixes[x.ans])) err(id, 'right card does not rebuild the fixed sentence');
    if (parts[k].replace(/[[\]]/g, '').indexOf(inside) !== parts[k].indexOf('[')) err(id, 'the error text appears earlier in the same part');
    if (!x.fixes[x.ans]) err(id, 'empty fix');
    if (!scoreItem('flick', id + ':b', { p: bad.err }, x.lv).ok || scoreItem('flick', id + ':b', true, x.lv).ok || scoreItem('flick', id + ':b', { p: (bad.err + 1) % parts.length }, x.lv).ok) err(id, 'wrong card scores badly');
    if (bad.parts.length !== parts.length || bad.err !== k || good.parts[k] !== bad.fixPart) err(id, 'stones do not match the sentence');
    if (!scoreItem('flick', id + ':g', true, x.lv).ok || scoreItem('flick', id + ':g', { p: 0 }, x.lv).ok) err(id, 'right card scores badly');
  }
  if (!['chat', 'formal'].includes(x.ctx)) err(id, 'ctx must be chat or formal');
  if (!x.hint || !x.why) err(id, 'missing hint or why');
  if (STRAIGHT.test(x.s + x.hint + x.why + (x.fixes || []).join(''))) err(id, 'straight quote');
  if (BANNED.test(x.s)) err(id, 'banned word');
}
for (const [lv, c] of Object.entries(sfPer)) { const r = c.none / c.n; if (r < 0.2 || r > 0.4) err('SPOTFIX lv ' + lv, Math.round(r * 100) + '% have no error (want about 30%)'); }

// ---- word groups ----
dupes(GROUPS, x => x.id, 'GROUPS');
for (const p of GROUPS) {
  const id = p.id, w = (p.groups || []).flatMap(g => g.words || []);
  if (![1, 2, 3].includes(p.tier) || !id.startsWith('g' + p.tier + '-')) err(id, 'bad tier or id');
  if (p.groups.length !== 4 || p.groups.some(g => !g.words || g.words.length !== 4)) err(id, 'needs 4 groups of 4');
  if (new Set(w).size !== 16) err(id, 'words are not 16 unique');
  if (w.some(x => !/^[a-z]+$/.test(x))) err(id, 'words must be single lowercase words');
  if (p.groups.some(g => !g.name || !g.why)) err(id, 'group missing name or why');
  if (p.groups.some(g => STRAIGHT.test(g.name + g.why))) err(id, 'straight quote');
  const all = p.groups.map(g => g.words);
  if (!scoreItem('groups', id, all, 1).ok) err(id, 'solving all four groups does not score as solved');
}
const tiers = {}; GROUPS.forEach(p => tiers[p.tier] = (tiers[p.tier] || 0) + 1);

// ---- pair up ----
dupes(PAIRS, x => x.id, 'PAIRS'); dupes(PAIRS, x => x.a + ' = ' + x.b, 'PAIRS pair');
const prPer = {};
// words that say nothing about meaning, so two tiles sharing them cannot be mixed up
const SMALL = new Set(['very', 'with', 'from', 'your', 'about', 'into', 'every', 'three', 'cannot', 'yourself', 'done', 'able', 'over', 'upon', 'down', 'time']);
const toks = x => new Set((x.a + ' ' + x.b).toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 4 && !SMALL.has(w)));
for (const x of PAIRS) {
  const id = x.id;
  if (!lvOk(x)) { err(id, 'bad lv'); continue; }
  prPer[x.lv] = (prPer[x.lv] || 0) + 1;
  if (!new RegExp('^p' + x.lv + '-\\d\\d$').test(id)) err(id, 'id does not match lv');
  if (!['pic', 'opp', 'mean', 'go'].includes(x.k)) err(id, 'bad kind');
  if (!x.a || !x.b || x.a === x.b) err(id, 'needs two different tiles');
  if (x.a.length > 16 || x.b.length > 22) err(id, 'tile text too long');
  if (x.k === 'pic' ? /[a-z]/i.test(x.a) : !/^[a-z ]+$/.test(x.a)) err(id, 'left tile: a picture for pic, lower-case words otherwise');
  if (!/^[a-z -]+$/.test(x.b)) err(id, 'right tile must be lower-case words');
  if (x.k === 'pic' && x.lv > 2) err(id, 'pictures only at levels 1-2');
  if (x.k === 'go' && x.lv < 5) err(id, '"go together" pairs start at level 5');
  if (BANNED.test(x.a + ' ' + x.b)) err(id, 'banned word');
  if (x.set != null && ![].concat(x.set).every(t => typeof t === 'string' && t)) err(id, 'set must be a name or a list of names');
  if (!scoreItem('pairup', id, x.b, x.lv).ok) err(id, 'the right fish does not score as right');
  if (scoreItem('pairup', id, x.a, x.lv).ok || scoreItem('pairup', id, null, x.lv).ok) err(id, 'a miss scores as right');
}
// pairs of the same kind that share a real word must share a `set`, so they never meet in a round
for (let i = 0; i < PAIRS.length; i++) for (let j = i + 1; j < PAIRS.length; j++) {
  const x = PAIRS[i], y = PAIRS[j];
  if (pairClash(x, y) || x.k !== y.k) continue;
  const tx = toks(x), shared = [...toks(y)].filter(w => tx.has(w));
  if (shared.length) err(x.id + ' / ' + y.id, 'share the word "' + shared[0] + '": give both the same set');
}
// "go together" pairs at levels 7-8: each preposition (the first word of the right tile) is used once, unless the pairs share a set
const prep = {};
for (const x of PAIRS.filter(x => x.k === 'go' && x.lv >= 7)) {
  const w = x.b.split(' ')[0], y = prep[w];
  if (y && !pairClash(x, y)) err(x.id + ' / ' + y.id, 'both use "' + w + '": a verb could take either right tile');
  prep[w] = x;
}
for (let L = 1; L <= 8; L++) if ((prPer[L] || 0) < 20) err('PAIRS lv ' + L, 'only ' + (prPer[L] || 0) + ' pairs (need 20+)');
for (let L = 1; L <= 8; L++) for (let t = 0; t < 30; t++) {
  const r = buildRound('pairup', L, false, new Set(), 'pair' + L + ':' + t).items.map(x => PAIRS.find(p => p.id === x.id));
  if (r.length !== 20) { err('picker', 'pairup at level ' + L + ' gave ' + r.length + ' pairs'); break; }
  const bad = r.find((x, i) => r.some((y, j) => j > i && pairClash(x, y)));
  if (bad) { err('picker', 'pairup at level ' + L + ' put two pairs that clash in one round (' + bad.id + ')'); break; }
  // Dive: four different fish, the right word among them, and no wrong word from a pair that clashes with this one
  const fish = buildRound('pairup', L, false, new Set(), 'pair' + L + ':' + t).items.find(x => x.opts.length !== 4 || new Set(x.opts).size !== 4 || !x.opts.includes(x.b)
    || x.opts.some(o => o !== x.b && PAIRS.some(y => y.b === o && y.k === x.k && pairClash(PAIRS.find(p => p.id === x.id), y))));
  if (fish) { err('picker', 'pairup ' + fish.id + ' has a bad set of fish: ' + fish.opts.join(', ')); break; }
}

// ---- munch (one extra word per sentence) ----
dupes(MUNCH, x => x.id, 'MUNCH'); dupes(MUNCH, x => x.s.toLowerCase(), 'MUNCH sentence');
const muPer = {};
for (const x of MUNCH) {
  const id = x.id;
  if (!lvOk(x)) { err(id, 'bad lv'); continue; }
  if (!new RegExp('^m' + x.lv + '-\\d\\d$').test(id)) err(id, 'id does not match lv');
  muPer[x.lv] = (muPer[x.lv] || 0) + 1;
  if ((x.s.match(/\[/g) || []).length !== 1) err(id, 'needs exactly one [extra] word');
  const m = munchItem(x);
  if (m.x < 1 || m.x >= m.words.length - 1) err(id, 'the extra word must not be first or last');
  if (!/[.?]$/.test(x.s)) err(id, 'must end with . or ?');
  if (m.words.length > (x.lv <= 3 ? 14 : 20)) err(id, m.words.length + ' words is too long for level ' + x.lv);
  if (!x.why || x.why.split(/\s+/).length > 20) err(id, 'why missing or over 20 words');
  if (!['chat', 'formal'].includes(x.ctx)) err(id, 'ctx must be chat or formal');
  if (STRAIGHT.test(x.s + x.why)) err(id, 'straight quote');
  if (BANNED.test(x.s)) err(id, 'banned word');
  // scoring agrees with the content: only the extra word counts as right
  if (!scoreItem('munch', id, m.x, x.lv).ok || scoreItem('munch', id, m.x === 1 ? 2 : 1, x.lv).ok) err(id, 'scoring does not match the extra word');
}
for (let L = 1; L <= 8; L++) if ((muPer[L] || 0) < 10) err('MUNCH lv ' + L, 'only ' + (muPer[L] || 0) + ' sentences (need 10+)');

// ---- pigeon post (read a note, pick one of three answers) ----
dupes(NOTES, x => x.id, 'NOTES'); dupes(NOTES, x => x.text, 'NOTES text');
const NOTE_WORDS = { 1: [10, 28], 2: [18, 38], 3: [28, 48], 4: [38, 58], 5: [48, 68], 6: [53, 78], 7: [63, 88], 8: [68, 98] };
const noPer = {};
for (const x of NOTES) {
  const id = x.id;
  if (!lvOk(x)) { err(id, 'bad lv'); continue; }
  if (!new RegExp('^n' + x.lv + '-\\d\\d$').test(id)) err(id, 'id does not match lv');
  noPer[x.lv] = (noPer[x.lv] || 0) + 1;
  if (!['chat', 'note', 'notice', 'email', 'poster'].includes(x.kind)) err(id, 'bad kind');
  if (!x.from || x.from.length > 22) err(id, 'from missing or over 22 characters');
  const n = x.text.trim().split(/\s+/).length, [lo, hi] = NOTE_WORDS[x.lv];
  if (n < lo || n > hi) err(id, n + ' words is outside ' + lo + '-' + hi + ' for level ' + x.lv);
  if (!/\?$/.test(x.q) || x.q.split(/\s+/).length > 10) err(id, 'question must end with ? and have 10 words or fewer');
  const opts = [x.a, ...(x.o || [])];
  if (opts.length !== 3 || new Set(opts.map(o => o.toLowerCase())).size !== 3) err(id, 'needs 1 answer + 2 different wrong answers');
  for (const o of opts) if (!o || o.length > 26 || o.split(/\s+/).length > 5) err(id, 'answer too long for a house sign: ' + o);
  if (!x.why || x.why.split(/\s+/).length > 24) err(id, 'why missing or over 24 words');
  if (STRAIGHT.test(x.text + x.q + opts.join('') + x.why)) err(id, 'straight quote');
  if (BANNED.test(x.text)) err(id, 'banned word');
}
for (let L = 1; L <= 8; L++) if ((noPer[L] || 0) < 8) err('NOTES lv ' + L, 'only ' + (noPer[L] || 0) + ' notes (need 8+)');

// ---- echo (hear once, fill the gaps) ----
dupes(ECHO, x => x.id, 'ECHO'); dupes(ECHO, x => echoParse(x).text, 'ECHO sentence');
const GAPS = { 1: [1, 1], 2: [1, 1], 3: [2, 2], 4: [2, 2], 5: [2, 2], 6: [2, 3], 7: [2, 3], 8: [2, 3] };
// words that sound the same: never put two of them in one gap (the ear can't tell them apart)
const SAME = [['their', 'there', 'they’re'], ['to', 'too', 'two'], ['hear', 'here'], ['write', 'right'], ['no', 'know'], ['by', 'buy', 'bye'], ['its', 'it’s'], ['week', 'weak'], ['whole', 'hole'], ['for', 'four'], ['won', 'one'], ['our', 'hour'], ['then', 'than'], ['can', 'can’t'], ['of', 'have'], ['would', 'wood'], ['been', 'bean'], ['new', 'knew'], ['meet', 'meat'], ['sea', 'see'], ['road', 'rode'], ['passed', 'past']];
const ecPer = {};
for (const x of ECHO) {
  const id = x.id;
  if (!lvOk(x)) { err(id, 'bad lv'); continue; }
  if (!new RegExp('^e' + x.lv + '-\\d\\d$').test(id)) err(id, 'id does not match lv');
  ecPer[x.lv] = (ecPer[x.lv] || 0) + 1;
  const e = echoParse(x);
  if (e.gaps.length < GAPS[x.lv][0] || e.gaps.length > GAPS[x.lv][1]) err(id, e.gaps.length + ' gaps is outside the level range');
  if (e.parts[0].g != null) err(id, 'a gap must not be the first word');
  if (/\d/.test(e.text)) err(id, 'write numbers as words (the voice reads them)');
  if (!/[.?]$/.test(e.text)) err(id, 'must end with . or ?');
  for (const g of e.gaps) {
    if (g.o.length !== 3 || new Set(g.o).size !== 3 || g.o.some(w => !/^[A-Za-z’-]+$/.test(w))) err(id, 'each gap needs 3 different one-word options: ' + g.o.join('|'));
    for (const s of SAME) if (g.o.filter(w => s.includes(w.toLowerCase())).length > 1) err(id, 'options sound the same: ' + g.o.join('|'));
  }
  if (!x.why || x.why.split(/\s+/).length > 18) err(id, 'why missing or over 18 words');
  if (BANNED.test(e.text)) err(id, 'banned word');
  const right = e.gaps.map(g => g.a);
  if (!scoreItem('echo', id, right, x.lv).ok || scoreItem('echo', id, right.map((w, k) => k ? w : e.gaps[0].o[1]), x.lv).ok) err(id, 'scoring does not match the gaps');
}
for (let L = 1; L <= 8; L++) if ((ecPer[L] || 0) < 8) err('ECHO lv ' + L, 'only ' + (ecPer[L] || 0) + ' sentences (need 8+)');
// every Echo sentence has a recorded clip (run python scripts/english-voice.py after content changes)
for (const x of ECHO) if (!existsSync(new URL('../public/assets/english/voice/' + echoClip(x), import.meta.url))) err(x.id, 'no audio clip yet: run python scripts/english-voice.py');

// ---- the picker can fill a round at every level ----
for (let L = 1; L <= 8; L++) for (const g of ['realfake', 'express', 'flick', 'munch', 'post', 'echo']) {
  const r = buildRound(g, L, false, new Set(), 'check' + L + g);
  if (r.items.length !== { realfake: 20, express: 8, flick: 20, munch: 12, post: 8, echo: 10 }[g]) err('picker', g + ' at level ' + L + ' gave ' + r.items.length + ' items');
  if (g === 'flick') { const b = r.items.filter(x => !x.good).length; if (b < 7 || b > 13) err('picker', 'flick at level ' + L + ' has ' + b + ' wrong cards of 20 (want about half)'); }
}

console.log('Words per level:', per, '| fakes per level:', fakePer);
console.log('Pair Up pairs per level:', prPer);
console.log('Munch per level:', muPer, '| Pigeon Post per level:', noPer, '| Echo per level:', ecPer);
console.log('Jumble:', JUMBLE.length, '| Spot & Fix:', SPOTFIX.length, sfPer, '| Word Groups per tier:', tiers);
if (bad.length) { console.log('\n' + bad.length + ' problem(s):\n' + bad.join('\n')); process.exit(1); }
console.log('All content checks passed.');
