// English Adda · automatic checks on the game content in api/_lib/english/ (Build Spec §9.4 step 2).
// Run: node scripts/english-content-check.mjs     Exit code 1 if anything is wrong.
// Word frequency bands and fake-word checks need Python wordfreq and run separately (see the header of words.js).
import { WORDS, FAKES } from '../api/_lib/english/words.js';
import { JUMBLE } from '../api/_lib/english/jumble.js';
import { SPOTFIX } from '../api/_lib/english/spotfix.js';
import { GROUPS } from '../api/_lib/english/groups.js';
import { jumbleOrders, distractor, buildRound, scoreItem } from '../api/_lib/english-games.js';
import { RF } from '../api/_lib/english-check.js';

const bad = [];
const err = (id, msg) => bad.push(id + ': ' + msg);
const dupes = (list, key, name) => { const seen = new Set(); for (const x of list) { const k = key(x); if (seen.has(k)) err(name, 'duplicate ' + k); seen.add(k); } };
const BANNED = /\b(damn|hell|sex|kill|drunk|caste|hindu|muslim|christian|sikh|bjp|congress)\b/i;
const lvOk = x => Number.isInteger(x.lv) && x.lv >= 1 && x.lv <= 8;
const STRAIGHT = /['"]/;   // student-facing text uses curly quotes

// ---- words ----
dupes(WORDS, x => x.w, 'WORDS'); dupes(FAKES.map(w => ({ w })), x => x.w, 'FAKES');
const checkWords = new Set(RF.map(x => x.w));
for (const x of WORDS) {
  const id = 'word ' + x.w;
  if (!lvOk(x)) err(id, 'bad lv');
  if (!/^[a-z]+$/.test(x.w)) err(id, 'word must be lowercase letters');
  if (checkWords.has(x.w)) err(id, 'also in the level check');
  if (FAKES.includes(x.w)) err(id, 'also a fake');
  if (!x.m || x.m.split(/\s+/).length > 12) err(id, 'meaning missing or over 12 words');
  if (x.m && new RegExp('\\b' + x.w.slice(0, Math.max(4, x.w.length - 2)), 'i').test(x.m)) err(id, 'meaning uses the word');
  const hits = (x.ex || '').match(new RegExp('\\b' + x.w + '\\b', 'g')) || [];
  if (hits.length !== 1) err(id, 'example must contain the word exactly once (has ' + hits.length + ')');
  if (STRAIGHT.test(x.m + x.ex)) err(id, 'straight quote');
  if (BANNED.test(x.ex)) err(id, 'banned word in example');
  for (const a of x.avoid || []) if (!WORDS.some(y => y.w === a)) err(id, 'avoid names a word that is not in WORDS: ' + a);
}
for (const w of FAKES) if (!/^[a-z]{4,12}$/.test(w)) err('fake ' + w, 'bad shape');
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
  if (!scoreItem('jumble', id, orders[0], x.lv).ok) err(id, 'canonical order does not score as right');
  if (n > 1 && !orders.some(o => o.join('|') === orders[0].slice().reverse().join('|')) && scoreItem('jumble', id, orders[0].slice().reverse(), x.lv).ok) err(id, 'reversed order scores right');
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
    if (!scoreItem('spotfix', id, { p: -1, f: null }, x.lv).ok) err(id, '"No error" does not score as right');
  } else {
    if (br.length !== 1 || (x.s.match(/\[/g) || []).length !== 1) err(id, 'needs exactly one bracketed part');
    if (!Array.isArray(x.fixes) || x.fixes.length !== 3 || new Set(x.fixes).size !== 3) err(id, 'needs 3 different fixes');
    if (![0, 1, 2].includes(x.ans)) err(id, 'ans must be 0-2');
    const inside = (x.s.match(/\[([^\]]+)\]/) || [])[1];
    if (inside && x.fixes && x.fixes.includes(inside)) err(id, 'a fix equals the error text');
    const k = parts.findIndex(p => p.includes('['));
    if (!scoreItem('spotfix', id, { p: k, f: x.ans }, x.lv).ok) err(id, 'the right answer does not score as right');
    if (scoreItem('spotfix', id, { p: -1, f: null }, x.lv).ok) err(id, '"No error" scores right on an error item');
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
  const all = p.groups.map(g => g.words);
  if (!scoreItem('groups', id, all, 1).ok) err(id, 'solving all four groups does not score as solved');
}
const tiers = {}; GROUPS.forEach(p => tiers[p.tier] = (tiers[p.tier] || 0) + 1);

// ---- the picker can fill a round at every level ----
for (let L = 1; L <= 8; L++) for (const g of ['realfake', 'jumble', 'spotfix']) {
  const r = buildRound(g, L, false, new Set(), 'check' + L + g);
  if (r.items.length !== { realfake: 20, jumble: 8, spotfix: 8 }[g]) err('picker', g + ' at level ' + L + ' gave ' + r.items.length + ' items');
}

console.log('Words per level:', per, '| fakes:', FAKES.length);
console.log('Jumble:', JUMBLE.length, '| Spot & Fix:', SPOTFIX.length, sfPer, '| Word Groups per tier:', tiers);
if (bad.length) { console.log('\n' + bad.length + ' problem(s):\n' + bad.join('\n')); process.exit(1); }
console.log('All content checks passed.');
