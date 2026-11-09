// English Adda "Find your level" check: content + scoring. Server only: the answers never go to the browser.
// FOR TEAM REVIEW (written by Claude; reviewed by a separate reviewer agent on 2026-11-09, two rounds, all findings fixed).
// Four parts: Real or Fake (vocabulary), Fill the gaps (C-test: grammar + reading), Catch It (listening), Quick story (reading).
// Writing has no part; it starts from grammar and reading. Levels are 1-8 for each skill.
import { createHash } from 'node:crypto';

// ---------- Part 1: Real or Fake ----------
// Real words carry a level from their frequency (wordfreq Zipf bands: L1 >= 5.3 ... L8 2.8-3.3).
// Fake words were checked to have zero frequency in wordfreq's English list.
export const RF = [
  { w: 'honest', lv: 3 }, { w: 'grombish', fake: true }, { w: 'water', lv: 1 }, { w: 'reluctant', lv: 6 },
  { w: 'curious', lv: 4 }, { w: 'vensible', fake: true }, { w: 'simple', lv: 2 }, { w: 'frugal', lv: 8 },
  { w: 'obsurate', fake: true }, { w: 'eager', lv: 5 }, { w: 'village', lv: 3 }, { w: 'clarnish', fake: true },
  { w: 'tedious', lv: 7 }, { w: 'rescue', lv: 4 }, { w: 'friend', lv: 1 }, { w: 'prattock', fake: true },
  { w: 'humble', lv: 5 }, { w: 'answer', lv: 2 }, { w: 'motterly', fake: true }, { w: 'fragile', lv: 6 },
  { w: 'meticulous', lv: 8 }, { w: 'quemble', fake: true }, { w: 'improve', lv: 3 }, { w: 'anxious', lv: 5 },
  { w: 'fendrous', fake: true }, { w: 'reliable', lv: 4 }, { w: 'ambiguous', lv: 7 }, { w: 'plorrid', fake: true },
  { w: 'listen', lv: 2 }, { w: 'dribulous', fake: true }
];

// ---------- Part 2: Fill the gaps (C-test) ----------
// stem{missing|alt} marks a gap: the student sees the stem and types the missing letters (boxes = length of the first answer).
// Any ending after | is also accepted. Gaps were reviewed so each has only one sensible answer of that length.
export const CTEST = {
  mid: { lv: 4, text: 'Last month, our college held its first coding contest. More th{an} two hundred stu{dents} signed up, but on{ly} forty finished all the probl{ems}. The win{ner} was a fresher fr{om} Nellore who had never used a lap{top} before joining college. She sa{id|ys} she practised for an hour every night on her bro{ther}’s old phone.' },
  easy: { lv: 2, text: 'Ravi lives in a small town near Guntur. Every mor{ning} he wa{lks} to the b{us} stop wi{th} his sis{ter}. They ta{ke} the bus to the{ir} college. The ri{de} is long, so they li{sten} to music or ta{lk} about their day.' },
  hard: { lv: 7, text: 'Many students assume that being busy is the same as being productive. In rea{lity}, research on learn{ing|ers} suggests that the num{ber} of hours we spend mat{ters} far less than how we spe{nd|nt} them. Rereading notes fe{els} reassuring, yet it rar{ely} leads to lasting memory. Testing yourself, by con{trast}, is uncomfortable but rema{rkably} effective. The les{son} is simple: deliberate effort beats mere activity.' }
};
// split into text pieces and gaps: [{ t }, { stem, n, ans: [..] }]
export function parseCtest(text){
  const out = [], re = /(\S*?)\{([^}]+)\}/g; let last = 0, m;
  while ((m = re.exec(text))) {
    const pre = text.slice(last, m.index), word = m[1];
    if (pre) out.push({ t: pre });
    const ans = m[2].split('|');
    out.push({ stem: word, n: ans[0].length, ans });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

// ---------- Part 3: Catch It ----------
// Each sentence is recorded once (Kokoro af_heart) at the speed for its level. The browser only gets the clip name.
export const CATCH = [
  { lv: 2, speed: 0.85, text: 'Please close the door when you leave.' },
  { lv: 4, speed: 1.0, text: 'The library stays open until nine from Monday to Friday.' },
  { lv: 6, speed: 1.05, text: 'If the train is late again, we will miss the first lecture.' },
  { lv: 8, speed: 1.12, text: 'Although the results were announced yesterday, most students still haven’t checked their scores.' }
];
export const VOICE = 'af_heart';
// must match scripts/english-voice.py clip_name()
export const clipName = (voice, speed, text) => createHash('sha1').update(voice + '|' + speed.toFixed(2) + '|' + text).digest('hex').slice(0, 12) + '.mp3';

// ---------- Part 4: Quick story ----------
export const STORIES = [
  { lv: 2, text: 'Meena has an exam on Monday. On Saturday she plays cricket with her cousins. On Sunday she studies for three hours. She makes short notes and asks her brother to quiz her. On Monday she feels calm, and she finishes the paper early.',
    q: [ { q: 'When does Meena study?', o: ['On Saturday', 'On Sunday', 'On Monday', 'Every day'], a: 1 },
         { q: 'Why does Meena feel calm on Monday?', o: ['She played cricket', 'She prepared well', 'The exam was cancelled', 'Her brother wrote the paper'], a: 1 } ] },
  { lv: 4, text: 'The hostel Wi-Fi in Block C stopped working on Tuesday night. Most students used their mobile data, but Arjun had only 200 MB left. Instead of waiting, he wrote a short email to the warden. He explained the problem, the room numbers affected and the time it started. By Wednesday afternoon, a technician had fixed the router. The warden thanked Arjun for the clear message and asked other students to report problems the same way.',
    q: [ { q: 'What did Arjun do about the Wi-Fi?', o: ['He waited for it to work again', 'He wrote an email to the warden', 'He bought more mobile data', 'He fixed the router himself'], a: 1 },
         { q: 'Why did the warden thank Arjun?', o: ['He fixed the router', 'His message was clear and useful', 'He paid the technician', 'He stopped using the Wi-Fi'], a: 1 } ] },
  { lv: 6, text: 'When Priya joined a start-up in Bengaluru as an intern, she expected to write code all day. Instead, her first week was spent reading old bug reports and asking questions. At first she felt frustrated, as if she was wasting time. Her manager explained that understanding why things broke was the fastest way to learn how the product worked. By the end of the month, Priya was fixing small bugs on her own, and she could often predict where problems were likely to appear.',
    q: [ { q: 'Why did Priya feel frustrated at first?', o: ['She was not allowed to ask questions', 'Reading old reports felt like a waste of time', 'Her manager was strict with her', 'She did not know how to code'], a: 1 },
         { q: 'What does the story suggest?', o: ['Interns should only write code', 'Studying past problems helped her learn faster', 'Most bug reports are wrong', 'Start-ups do not train their interns'], a: 1 } ] },
  { lv: 8, text: 'Every monsoon, the same debate returns to Indian cities: should roads be repaired before the rains or after them? Repairing before the rains seems sensible, yet contractors argue that fresh asphalt laid in humid conditions often fails within weeks, wasting public money. Repairing after the rains avoids that problem but leaves commuters to deal with potholes for months. Some city engineers now propose a compromise: patching only the most dangerous stretches early, while scheduling full resurfacing for the dry season. Critics say this merely postpones the issue; supporters reply that it is the only option that is both safe and affordable.',
    q: [ { q: 'What is the main purpose of the passage?', o: ['To blame contractors for potholes', 'To explain the arguments about when to repair roads', 'To describe how asphalt is made', 'To prove that roads should be repaired after the rains'], a: 1 },
         { q: 'According to its supporters, the compromise is:', o: ['cheaper but less safe', 'safe without costing too much', 'a way to avoid all repairs', 'popular with critics'], a: 1 } ] }
];
// answer positions are shuffled per story (fixed, so every student sees the same order)
const ORDER = [[2, 0, 3, 1], [1, 3, 0, 2], [3, 1, 2, 0], [0, 2, 1, 3]];
function shuffled(story, si){
  return story.q.map((x, qi) => { const ord = ORDER[(si + qi) % 4]; return { q: x.q, o: ord.map(i => x.o[i]), a: ord.indexOf(x.a) }; });
}

// ---------- what the browser gets (no answers) ----------
const publicPassage = key => ({ key, parts: parseCtest(CTEST[key].text).map(p => p.t != null ? { t: p.t } : { stem: p.stem, n: p.n }) });
export function startItems(){
  return {
    rf: RF.map(x => x.w),
    c1: publicPassage('mid'),
    catch: CATCH.map((x, i) => ({ i, clip: clipName(VOICE, x.speed, x.text), words: x.text.split(/\s+/).length }))
  };
}
// after part 1 and the first passage: which passage comes next, and which story
export function nextItems(a){
  const s = scoreParts(a);
  const si = storyIndex(s.voc, s.gra);
  return { c2: publicPassage(s.c2key), story: { i: si, text: STORIES[si].text, q: shuffled(STORIES[si], si).map(x => ({ q: x.q, o: x.o })) } };
}

// ---------- scoring ----------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lower = s => String(s || '').trim().toLowerCase();
function gapScore(key, answers){
  const gaps = parseCtest(CTEST[key].text).filter(p => p.ans);
  const got = Array.isArray(answers) ? answers : [];
  const right = gaps.filter((g, i) => g.ans.includes(lower(got[i]).replace(/[^a-z]/g, ''))).length;
  return gaps.length ? right / gaps.length : 0;
}
function vocab(rf){
  const said = Array.isArray(rf) ? rf : [];
  const per = {}; let fakes = 0, fa = 0;
  RF.forEach((x, i) => {
    const yes = said[i] === true;
    if (x.fake) { fakes++; if (yes) fa++; return; }
    (per[x.lv] = per[x.lv] || [0, 0])[1]++;
    if (yes) per[x.lv][0]++;
  });
  const sum = Object.values(per).reduce((a, [h, n]) => a + h / n, 0);   // 0-8: share known at each level
  const far = fakes ? fa / fakes : 0;                                    // saying "real" to made-up words means guessing
  return { level: clamp(Math.round(sum - 6 * far), 1, 8), sum: +sum.toFixed(2), far: +far.toFixed(2) };
}
function scoreParts(a){
  const v = vocab(a.rf), mid = gapScore('mid', a.c1);
  const c2key = mid >= 0.6 ? 'hard' : 'easy';
  // grammar from the passages; until the second passage is answered, estimate from the first
  let gra;
  const second = a.c2 ? gapScore(c2key, a.c2) : null;
  if (c2key === 'hard') gra = second == null ? (mid >= 0.9 ? 7 : 5) :second >= 0.75 ? 8 : second >= 0.5 ? 7 : second >= 0.3 ? 6 : 5;
  else gra = second == null ? 3 : second >= 0.8 ? (mid >= 0.4 ? 4 : 3) : second >= 0.5 ? 2 : 1;
  return { voc: v.level, vdet: v, mid, c2key, second, gra };
}
const storyIndex = (voc, gra) => { const t = (voc + gra) / 2; return clamp(Math.round((t - 2) / 2), 0, 3); };   // levels 2/4/6/8

// typed sentence vs target: word-level match, ignoring case, punctuation and contractions; a 1-letter slip counts half
const NUM = { '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten', '11': 'eleven', '12': 'twelve' };
export function words(s){
  return lower(s).replace(/[’‘`]/g, "'")
    .replace(/\bcan't\b/g, 'can not').replace(/\bwon't\b/g, 'will not').replace(/\bcannot\b/g, 'can not').replace(/n't\b/g, ' not').replace(/'re\b/g, ' are').replace(/'ll\b/g, ' will').replace(/'ve\b/g, ' have').replace(/'m\b/g, ' am').replace(/'d\b/g, ' would')
    .replace(/[^a-z0-9' -]/g, ' ').replace(/-/g, ' ').split(/\s+/).filter(Boolean).map(w => NUM[w] || w.replace(/'/g, ''));
}
// sound-alike words (their/there) get half credit, like a one-letter slip
const SOUNDS = [['their', 'there', 'theyre'], ['your', 'youre'], ['to', 'too', 'two'], ['whose', 'whos'], ['then', 'than']];
const near = (a, b) => { if (SOUNDS.some(g => g.includes(a) && g.includes(b))) return true; if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false; let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } } return d + (a.length - i) + (b.length - j) <= 1; };
export function sentenceScore(target, typed){
  const t = words(target), y = words(typed);
  if (!t.length) return 0;
  // weighted LCS: exact word = 1, near miss = 0.5
  const D = Array.from({ length: t.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = 1; i <= t.length; i++) for (let j = 1; j <= y.length; j++) {
    const m = t[i - 1] === y[j - 1] ? 1 : near(t[i - 1], y[j - 1]) ? 0.5 : 0;
    D[i][j] = Math.max(D[i - 1][j], D[i][j - 1], m ? D[i - 1][j - 1] + m : 0);
  }
  return D[t.length][y.length] / Math.max(t.length, y.length);
}

// full result from all four parts
export function score(a){
  const s = scoreParts(a);
  // the story was picked before the second passage was answered (nextItems), so pick it the same way here
  const pre = scoreParts({ rf: a.rf, c1: a.c1 });
  const si = storyIndex(pre.voc, pre.gra), st = STORIES[si], q = shuffled(st, si);
  const picks = Array.isArray(a.story) ? a.story : [];
  const right = q.filter((x, i) => picks[i] === x.a).length;
  const storyLv = clamp(st.lv - (2 - right), 1, 8);
  const rea = clamp(Math.round(0.6 * storyLv + 0.4 * s.gra), 1, 8);
  const typed = Array.isArray(a.catch) ? a.catch : [];
  const acc = CATCH.map((x, i) => +sentenceScore(x.text, typed[i]).toFixed(2));
  let lis = 1;
  for (let i = 0; i < CATCH.length; i++) {
    if (acc[i] >= 0.8) lis = CATCH[i].lv;
    else { if (acc[i] >= 0.5) lis = Math.max(lis, CATCH[i].lv - 1); break; }
  }
  const wri = clamp(Math.round((s.gra + rea) / 2) - 1, 1, 8);
  return {
    levels: { voc: s.voc, gra: s.gra, lis, rea, wri },
    detail: { vocab: s.vdet, mid: +s.mid.toFixed(2), second: s.c2key, secondScore: s.second == null ? null : +s.second.toFixed(2), story: { lv: st.lv, right }, catch: acc }
  };
}
