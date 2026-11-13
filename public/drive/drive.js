/* Drive School: a daily course inside Game Corner (home + path, lesson player, Drive Profile tab, Drive leaderboard).
   Lessons are data (public/content/drive/dayN.js) played by one shared player, so new days are content only.
   Uses the page's helpers from index.html: ME, api, SFX, syncMute, toast, confetti, anim, reduced, W3, openModal, closeModal, slot3d, img3d, view.
   Server copy: /api/drive (rules, points and answers). This file keeps a local cache so the page opens instantly and works offline. */
(() => {
'use strict';

/* ================= config ================= */
const FLAGS = {};                  // screens with flag:'x' show only when FLAGS.x is true (Day 0 now uses our own items, no flag)
const BUILT = 14;                  // highest day with content in this release (the server has the same number)
const DAILY_MAX = 3;
const TZ = 'Asia/Kolkata';

const TRACK = {
  setup:      { name: 'Setup',            c: '#7C4DFF', desc: 'Where you start' },
  strategy:   { name: 'Strategy',         c: '#11A37A', desc: 'How to learn well' },
  motivation: { name: 'Motivation',       c: '#FF7A2F', desc: 'How to keep going' },
  think:      { name: 'Think & Speak',    c: '#5B5BF0', desc: 'Form and say your own view' },
  review:     { name: 'Review & Reflect', c: '#E2407F', desc: 'What stuck, what you did' }
};
const LEVELS = ['Learner’s Permit', 'First Drive', 'Rules of the Road', 'Steering Through Setbacks', 'Eyes on the Road', 'Highway', 'Long Drive', 'Licence Day'];
// all 57 days (titles for the path); only days up to BUILT have content
const COURSE = [
  [0, 'setup', 'Before you start'],
  [1, 'strategy', 'The forgetting curve'], [2, 'motivation', 'Growth mindset, the honest version'], [3, 'think', 'Ship of Theseus'],
  [4, 'strategy', 'Retrieval practice'], [5, 'motivation', 'Why am I here?'], [6, 'think', 'The group project dilemma'], [7, 'review', 'Week 1 review'],
  [8, 'strategy', 'Spacing vs cramming'], [9, 'motivation', 'Procrastination is about mood'], [10, 'think', 'The Ring of Gyges'],
  [11, 'strategy', 'Mix it up: interleaving'], [12, 'motivation', 'If-then plans'], [13, 'think', 'The shared Wi-Fi'], [14, 'review', 'Week 1–2 review'],
  [15, 'strategy', 'The learning styles myth'], [16, 'motivation', 'Habits take time'], [17, 'think', 'The Chinese Room'],
  [18, 'strategy', 'The illusion of fluency'], [19, 'motivation', 'Did your plan work?'], [20, 'think', 'Sunk cost'], [21, 'review', 'Week 1–3 review'],
  [22, 'strategy', 'Explain it to yourself'], [23, 'motivation', 'Willpower vs your space'], [24, 'think', 'Who should the car protect?'],
  [25, 'strategy', 'Ask “why?”'], [26, 'motivation', 'Bouncing back from a bad result'], [27, 'think', 'Is being nice smart?'], [28, 'review', 'Midpoint review'],
  [29, 'strategy', 'The multitasking myth'], [30, 'motivation', 'What you can control'], [31, 'think', 'The Experience Machine'],
  [32, 'strategy', 'Phone in the other room'], [33, 'motivation', 'What an hour a day adds up to'], [34, 'think', 'The Veil of Ignorance'], [35, 'review', 'Week 3–5 review'],
  [36, 'strategy', 'Desirable difficulties'], [37, 'motivation', 'Comparison on social media'], [38, 'think', 'The stag hunt'],
  [39, 'strategy', 'Worked examples'], [40, 'motivation', 'When to stay stuck, when to ask'], [41, 'think', 'Is AI-written work yours?'], [42, 'review', 'Week 4–6 review'],
  [43, 'strategy', 'Plan, monitor, evaluate'], [44, 'motivation', 'Sleep and memory'], [45, 'think', 'Talent vs effort'],
  [46, 'strategy', 'Teach to learn'], [47, 'motivation', 'WOOP your goal'], [48, 'think', 'Honesty vs kindness'], [49, 'review', 'Week 5–7 review'],
  [50, 'strategy', 'Build your study system'], [51, 'motivation', 'Your future self'], [52, 'think', 'Passion or pay?'],
  [53, 'strategy', 'Myth-buster final'], [54, 'motivation', 'What changed?'], [55, 'think', 'Revisit your first stand'], [56, 'review', 'Final review']
].map(([d, track, title]) => ({ d, track, title }));
const dayInfo = d => COURSE[d];
/* test accounts (batch DEMO) see every built day unlocked: no Day 0 gate, no order, no daily cap (the server agrees) */
const tester = () => !!(typeof ME !== 'undefined' && ME && ME.pilot === 'DEMO');

const ICON = {
  setup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  strategy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/></svg>',
  motivation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2 0-4 0-7z"/></svg>',
  think: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H10l-5 4V5z"/><path d="M9 10h6"/></svg>',
  review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v4h4"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="#F5B82E" aria-hidden="true"><path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.5 6.8L12 17l-5.5 3.5L8 13.7 3 9.3l6.4-.7z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};

/* ================= small helpers ================= */
const qs = (s, el) => (el || document).querySelector(s);
const qa = (s, el) => [...(el || document).querySelectorAll(s)];
const frag = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
const words = s => (String(s || '').trim().match(/[A-Za-z0-9’']+/g) || []).length;
const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const istDay = (t) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t ? new Date(t) : new Date());
const cid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const sfx = name => { try { SFX.play(name); } catch (e) {} };
function blockPaste(el){
  el.addEventListener('paste', e => { e.preventDefault(); toast('Paste is off. Type your own words.'); });
  el.addEventListener('drop', e => { e.preventDefault(); toast('Paste is off. Type your own words.'); });
}

/* ================= state: server copy + local cache + offline queue ================= */
const CK = 'ds_cache', QK = 'ds_queue';
const blank = () => ({ today: istDay(), startedOn: istDay(), points: 0, memo: {}, done: {}, lastBuilt: BUILT, dailyMax: DAILY_MAX });
let DS = null, pulledAt = 0, pulling = null;
function cacheLoad(){
  try { const c = JSON.parse(localStorage.getItem(CK)); if (c && ME && c.id === ME.id) return c.s; } catch (e) {}
  return null;
}
function cacheSave(){ try { if (ME && DS) localStorage.setItem(CK, JSON.stringify({ id: ME.id, s: DS })); } catch (e) {} }
function queue(){ try { const q = JSON.parse(localStorage.getItem(QK)); if (q && ME && q.id === ME.id) return q.items; } catch (e) {} return []; }
function queueSet(items){ try { localStorage.setItem(QK, JSON.stringify({ id: ME && ME.id, items })); } catch (e) {} }
let dsOwner = null;
function st(){
  const id = typeof ME !== 'undefined' && ME ? ME.id : null;
  if (DS && dsOwner !== id) { DS = null; pulledAt = 0; PROF = null; profAt = 0; DBOARD = null; dboardAt = 0; }   // a different student logged in
  if (!DS) { DS = cacheLoad() || blank(); dsOwner = id; }
  return DS;
}
/* derived values are computed locally, so they stay right after midnight without a reload */
const firstToday = () => Object.entries(st().done).filter(([d, x]) => +d > 0 && x.ist === istDay()).length;
function streak(){
  const have = new Set(Object.values(st().done).map(x => x.ist));
  const step = d => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
  let d = istDay(); if (!have.has(d)) d = step(d);
  let n = 0; while (have.has(d)) { n++; d = step(d); }
  return n;
}
function dayState(d){
  const S = st();
  if (S.done[d]) return 'done';
  if (d > BUILT) return 'soon';
  if (d === 0 || tester()) return 'open';
  if (!S.done[d - 1]) return 'locked';
  if (firstToday() >= DAILY_MAX) return 'limit';
  return 'open';
}
const nextDay = () => { for (const x of COURSE) if (x.d > 0 && !st().done[x.d]) return x; return null; };

async function pull(force){
  if (!ME) return;
  if (pulling) return pulling;
  if (!force && Date.now() - pulledAt < 60000 && DS) return;
  pulling = (async () => {
    await flush();
    await flushRates();
    const r = await api('/api/drive', { action: 'state', token: ME.token });
    if (r.status === 200 && r.j.ok) { applyServer(r.j.state); pulledAt = Date.now(); }
  })();
  try { await pulling; } finally { pulling = null; }
  refresh();
}
/* the server state, plus any finishes still waiting in the offline queue */
function applyServer(s){
  DS = s; dsOwner = ME ? ME.id : null;
  for (const f of queue()) optimistic(f);
  cacheSave();
}
function optimistic(f){
  const S = st();
  if (S.done[f.day]) return;
  if (f.day > 0 && !S.done[f.day - 1] && !tester()) return;
  S.done[f.day] = { at: f.at, ist: istDay(f.at), pts: f.pts, pending: true };
  S.points += f.pts;
  Object.assign(S.memo, f.memo || {});
}
let flushing = false;
async function flush(){
  if (!ME || flushing) return;
  const items = queue(); if (!items.length) return;
  flushing = true;
  try {
    const left = [];
    for (const f of items) {
      const r = await api('/api/drive', Object.assign({ action: 'finish', token: ME.token }, f), 12000);
      if (r.status === 200 && r.j.ok) { DS = r.j.state; continue; }
      if (r.status === 400 || r.status === 401) continue;   // bad or not logged in: drop it
      left.push(f);
    }
    queueSet(left);
    for (const f of left) optimistic(f);
    cacheSave();
  } finally { flushing = false; }
}
setInterval(() => { if (ME && queue().length) flush().then(refresh); if (ME && rates().some(x => x.ans)) flushRates(); }, 60000);
window.addEventListener('online', () => { if (ME && queue().length) flush().then(refresh); });

/* re-render whatever Drive School screen is showing */
function refresh(){
  tabBadge();
  if (typeof view === 'undefined') return;
  if (view === 'drive' && !L) renderHome();
  if (view === 'muscles' && profTab === 'drive') renderProfile();
  if (view === 'leaderboard' && boardMode === 'drive') renderBoard();
}

/* ================= Turbo ================= */
const POSES = ['idle', 'correct', 'thinking', 'oops'];
const turboImg = (pose, size, cls) => '<img class="' + (cls || 'turbo') + '" src="assets/turbo/turbo-' + pose + '.svg" width="' + size + '" height="' + size + '" alt="" decoding="async">';
POSES.forEach(p => { const i = new Image(); i.src = 'assets/turbo/turbo-' + p + '.svg'; });

/* Fixed lines the player says. scripts/turbo-voice.py records these plus every lesson line.
   Keep this block a plain array expression: the recording script evaluates it. */
/*TURBO_LINES*/ const TURBO_LINES = [
  'Exactly.', 'Nailed it.', 'Yes!', 'Spot on.', 'Not quite. Tap Why? to see it.',
  ...Array.from({ length: 14 }, (_, i) => '🔥 ' + (i + 2) + ' in a row! +5 bonus.'),
  ...Array.from({ length: 6 }, (_, i) => i + ' of 6 right.'), 'All 6 right.',
  'Nice work! Lesson done.', 'Replay done. Points count only the first time.', 'Nice recall!',
  'You came back and got it.', 'First try!', 'Not this time. Your call: try again or skip.',
  'Each review resets the curve and slows the next drop.', 'Let’s see what Sam was doing.',
  'Not quite.', 'Nice work!', 'All of them. Nailed it.', 'Every blank right.', 'Perfect order.', 'Close, but not quite.', 'Yes! Bold and right.',
  'Stretch landed! +15.', 'Missed, but you stretched. That’s how you grow.'
]; /*END_TURBO_LINES*/

/* Turbo's voice: clips recorded ahead of time with Kokoro (am_fenrir, +3 semitones) by scripts/turbo-voice.py.
   assets/voice/manifest.json maps each line (whitespace removed) to its MP3 and word timings.
   A line with no clip is typed silently. Off when sound is muted or the voice toggle is off. */
const Voice = (() => {
  let pref = true, man = null, au = null, raf = 0, curEnd = null;
  try { pref = localStorage.getItem('ds_voice') !== '0'; } catch (e) {}
  const key = t => String(t).replace(/<[^>]*>/g, '').replace(/\s+/g, '').normalize('NFC');
  fetch('assets/voice/manifest.json?v=' + Date.now().toString(36).slice(0, -4)).then(r => r.ok ? r.json() : null).then(j => { man = j; }).catch(() => {});
  const on = () => pref && !(typeof SFX !== 'undefined' && SFX.muted);
  const fire = why => { const f = curEnd; curEnd = null; if (f) f(why); };
  return {
    on, key,
    get pref(){ return pref; },
    toggle(){ pref = !pref; try { localStorage.setItem('ds_voice', pref ? '1' : '0'); } catch (e) {} if (!pref) this.stop(); return pref; },
    clip(text){ return man && man.lines[key(text)] || null; },
    stop(){ cancelAnimationFrame(raf); if (au) try { au.pause(); } catch (e) {} fire('stop'); },
    /* play the clip for text; onTime(seconds) while it plays, onEnd(why) when it ends ('end', 'stop' or 'blocked') */
    say(text, onTime, onEnd){
      if (!on()) return null;
      const c = this.clip(text); if (!c) return null;
      this.stop();
      if (!au) { au = new Audio(); au.preload = 'auto'; }
      au.src = 'assets/voice/' + c.f;
      curEnd = onEnd;
      const tick = () => { onTime && onTime(au.currentTime); raf = requestAnimationFrame(tick); };
      au.onended = () => { cancelAnimationFrame(raf); fire('end'); };
      const p = au.play();
      if (p && p.then) p.then(() => { raf = requestAnimationFrame(tick); }).catch(() => fire('blocked'));
      else raf = requestAnimationFrame(tick);
      return c;
    }
  };
})();
document.addEventListener('click', e => { if (e.target.closest('.mute')) setTimeout(() => { if (SFX.muted) Voice.stop(); }, 0); });

/* typewriter: reveal el's words one by one, in step with Turbo's voice when it is on.
   el holds trusted lesson HTML; returns { skip, done } where done is a promise. */
function typeOut(el, opts){
  opts = opts || {};
  const spans = [];
  const walk = n => {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const parts = c.textContent.split(/(\s+)/), f = document.createDocumentFragment();
        parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(p)); return; } const s = document.createElement('span'); s.className = 'tw'; s.textContent = p; spans.push(s); f.appendChild(s); });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
  };
  walk(el);
  let shown = 0, timer = null, finished = false, resolve;
  const done = new Promise(r => resolve = r);
  const upto = n => { for (; shown < Math.min(n, spans.length); shown++) spans[shown].classList.add('on'); };
  const end = () => { if (finished) return; finished = true; clearInterval(timer); upto(spans.length); el.classList.add('typed'); resolve(); };
  if (reduced() || !spans.length) { end(); return { skip: end, done }; }
  el.classList.add('typing');
  const clock = () => { clearInterval(timer); timer = setInterval(() => { upto(shown + 1); if (shown >= spans.length) end(); }, 55); };
  const text = opts.say || spans.map(x => x.textContent).join(' ');
  const c = opts.speak !== false && Voice.say(text, sec => {
    let n = 0; while (n < at.length && at[n] <= sec + 0.04) n++; upto(n);
  }, why => { if (why === 'blocked') { if (!finished) clock(); } else end(); });
  // when each word appears: from the clip's word timings (matched by character position), or spread evenly
  const at = [];
  if (c) {
    let off = 0;
    spans.forEach((x, i) => {
      if (!opts.say && c.c) { let j = 0; while (j + 1 < c.c.length && c.c[j + 1] <= off) j++; at.push(c.t[j]); }
      else at.push(c.d * i / spans.length);
      off += x.textContent.replace(/\s+/g, '').length;
    });
  } else clock();
  return { skip(){ Voice.stop(); end(); }, done };
}

/* ================= home ================= */
function renderHome(){
  const root = qs('#drive-root'); if (!root) return;
  const S = st(), nx = nextDay(), left = Math.max(0, DAILY_MAX - firstToday());
  const setup = !S.done[0];
  tabBadge();
  if (setup && !tester()) return renderWelcome(root);
  let tTitle, tText, btn = '';
  if (setup) { tTitle = 'Day 0 · Before you start'; tText = 'A few quick taps about how you study right now.'; btn = '<button class="dbtn" data-start="0">Start here</button>'; }
  else if (!nx) { tTitle = 'Course complete'; tText = 'You finished all 56 days.'; }
  else {
    const ns = dayState(nx.d);
    if (ns === 'open') { tTitle = 'Day ' + nx.d + ' · ' + nx.title; tText = TRACK[nx.track].name + ' · about 10 minutes'; btn = '<button class="dbtn" data-start="' + nx.d + '">' + (S.done[1] ? 'Continue' : 'Start Day 1') + '</button>'; }
    else if (ns === 'limit') { tTitle = 'That’s 3 lessons today'; tText = 'Day ' + nx.d + ' unlocks tomorrow. Spacing it out helps it stick.'; }
    else { tTitle = 'Day ' + nx.d + ' · ' + nx.title; tText = 'This lesson is coming soon. Days 1–' + BUILT + ' are ready now.'; }
  }
  const sk = streak();
  const curLevel = nx ? Math.max(0, Math.ceil(nx.d / 7) - 1) : 7;
  const levels = [];
  for (let w = 0; w < 8; w++) {
    if (w > curLevel + 1) { levels.push('<div class="dlevel-later"><small>Level ' + (w + 1) + '</small><b>' + LEVELS[w] + '</b></div>'); continue; }
    const days = COURSE.filter(x => x.d > 0 && Math.ceil(x.d / 7) === w + 1);
    if (w === 0) days.unshift(COURSE[0]);
    levels.push('<div class="dlevel"><small>Level ' + (w + 1) + '</small><b>' + LEVELS[w] + '</b></div><div class="dpath">' + days.map(x => node(x, nx)).join('') + '</div>');
  }
  root.innerHTML =
    '<div class="dtop"><div><h1 class="ddisplay">Drive School</h1><p>10 minutes a day to learn smarter and think for yourself.</p>' + (tester() ? '<p class="dtester">🧪 Test account: every lesson is unlocked, with no daily limit.</p>' : '') + '</div>'
    + '<div class="dchips"><span class="dchip" title="Day streak">🔥 ' + plural(sk, 'day') + '</span><span class="dchip" title="Drive points">' + ICON.star + ' ' + S.points.toLocaleString('en-IN') + ' pt</span>'
    + '<button class="round press mute" aria-label="Turn sound off">🔊</button></div></div>'
    + '<section class="dhero"><div class="dhero-text"><span class="dtag">Today’s lesson</span><h2 class="ddisplay">' + esc(tTitle) + '</h2><p>' + esc(tText) + '</p>'
    + '<div class="dhero-row"><span class="dallow">' + (tester() ? 'No daily limit on this account' : left + ' of ' + DAILY_MAX + ' lessons left today') + '</span>' + btn + '</div></div>'
    + turboImg(setup || !S.done[1] ? 'idle' : 'correct', 150, 'dhero-turbo') + '</section>'
    + '<div class="dgrid"><section class="dpanel">' + levels.join('') + '</section>'
    + '<aside class="dpanel dside"><div class="dstreak">' + slot3d('flame', 'dflame', img3d('flame', 56)) + '<div><b>' + plural(sk, 'day') + '</b><span>' + (sk ? 'Keep it going with one lesson a day.' : 'Finish a lesson to start your streak.') + '</span></div></div>'
    + '<h3>Four kinds of days</h3><p class="dsub">Each week mixes all four.</p><div class="dlegend">'
    + ['strategy', 'motivation', 'think', 'review'].map(k => '<div><i style="background:' + TRACK[k].c + '"></i><p><b>' + TRACK[k].name + '</b>' + TRACK[k].desc + '</p></div>').join('')
    + '</div><div class="drules"><p>A new lesson opens each day. You can run ahead, up to 3 lessons a day.</p><p>Each lesson opens once the one before it is done.</p><p>Replays are free any time, but points count only the first time.</p></div></aside></div>';
  syncMute();
  // draw once layout settles, and again whenever a path changes size (fonts, images, sidebar, window)
  if (window.ResizeObserver) { if (!roadRO) roadRO = new ResizeObserver(() => { clearTimeout(roadT); roadT = setTimeout(drawRoads, 60); }); roadRO.disconnect(); qa('#drive-root .dpath').forEach(x => roadRO.observe(x)); }
  setTimeout(drawRoads, 80); setTimeout(drawRoads, 600);
}
let roadRO = null;
/* the course path is a road: an asphalt line with a dashed centre that winds through every lesson stop.
   The finished part of the road is painted green. Redrawn when the layout changes size. */
function drawRoads(){
  qa('#drive-root .dpath').forEach(path => {
    const old = qs('svg.droadmap', path); if (old) old.remove();
    const nodes = qa('.dnode', path); if (nodes.length < 2) return;
    const box = path.getBoundingClientRect();
    const pts = nodes.map(n => { const r = qs('.disc', n).getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top, n.classList.contains('done')]; });
    const seg = (a, b) => { const my = (a[1] + b[1]) / 2; return 'C' + a[0].toFixed(1) + ',' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ',' + my.toFixed(1) + ' ' + b[0].toFixed(1) + ',' + b[1].toFixed(1); };
    let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1), dd = '';
    let lastDone = -1; pts.forEach((p, i) => { if (p[2]) lastDone = i; });
    pts.slice(1).forEach((p, i) => { const sg = seg(pts[i], p); d += sg; if (i + 1 <= lastDone) dd += sg; });
    const done = lastDone > 0 ? 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1) + dd : '';
    path.insertAdjacentHTML('afterbegin', '<svg class="droadmap" aria-hidden="true" width="' + box.width + '" height="' + box.height + '">'
      + '<path d="' + d + '" class="r-base"/>' + (done ? '<path d="' + done + '" class="r-done"/>' : '') + '<path d="' + d + '" class="r-dash"/></svg>');
  });
}
let roadT = 0;
window.addEventListener('resize', () => { clearTimeout(roadT); roadT = setTimeout(() => { if (typeof view !== 'undefined' && view === 'drive' && !L) drawRoads(); }, 120); });
/* Day 0 is required: until it's done, Drive School shows only this start screen.
   Turbo stays quiet here; he introduces himself when Day 0 starts. */
function renderWelcome(root){
  if (qs('.dwelcome', root)) return;
  let started = false; try { started = localStorage.getItem('ds_hi') === '1'; } catch (e) {}   // opened Day 0 before but didn't finish
  root.innerHTML = '<section class="dwelcome"><div class="dwel-turbo">' + turboImg('idle', 220, 'dwel-img') + '</div>'
    + '<div class="dwel-talk"><span class="dtag">Day 0 · Quick setup</span><h1 class="ddisplay dwel-h">Drive School</h1>'
    + '<p class="dwel-sub">10 minutes a day to study smarter and think for yourself. It starts with a 2-minute setup.</p>'
    + '<div class="dwel-row"><button class="dbtn" data-start="0" id="dwel-go">' + (started ? 'Finish my setup' : 'Start Day 0') + '</button></div>'
    + '<p class="dnote">Day 0 unlocks the rest of Drive School.</p></div></section>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('.dvoice'); if (!b) return;
  const on = Voice.toggle(); sfx('select');
  qa('.dvoice').forEach(x => { x.setAttribute('aria-pressed', on); x.textContent = on ? '🗣️' : '🤐'; });
  toast(on ? 'Turbo will talk.' : 'Turbo will stay quiet. Text only.');
});
/* sidebar badge: "New" until Day 0 is done, then "1" when today's lesson is waiting */
function tabBadge(){
  const b = qs('#tab-drive-new'); if (!b || !ME) return;
  const S = st(), nx = nextDay();
  if (!S.done[0]) { b.textContent = 'New'; b.hidden = false; return; }
  const waiting = nx && dayState(nx.d) === 'open' && firstToday() === 0;
  b.textContent = '1'; b.hidden = !waiting;
  b.setAttribute('aria-label', 'Today’s lesson is ready');
}
function node(x, nx){
  const s = dayState(x.d), cur = nx && x.d === nx.d && s === 'open' || (x.d === 0 && s === 'open');
  const cls = s === 'done' ? 'done' : cur ? 'current' : s === 'open' ? '' : 'locked';
  const sub = s === 'done' ? 'Done · tap to replay' : s === 'open' ? (x.d ? 'Day ' + x.d : 'Day 0') + ' · ' + TRACK[x.track].name
    : s === 'limit' ? 'Day ' + x.d + ' · unlocks tomorrow' : s === 'soon' ? 'Day ' + x.d + ' · coming soon' : 'Day ' + x.d + ' · finish Day ' + (x.d - 1) + ' first';
  return '<button class="dnode ' + cls + '" style="--c:' + TRACK[x.track].c + '" data-day="' + x.d + '" aria-disabled="' + (s === 'open' || s === 'done' ? 'false' : 'true') + '">'
    + '<span class="disc">' + (cls === 'locked' ? ICON.lock : ICON[x.track]) + (cls === 'current' && x.d === (nx ? nx.d : -1) ? '<span class="dpark" aria-hidden="true">' + turboImg('idle', 40, 'dpark-img') + '</span>' : '') + '</span><span class="lab"><small>' + sub + '</small><b>' + esc(x.title) + '</b></span></button>';
}
document.addEventListener('click', e => {
  if (!e.target.closest('#drive-root')) return;
  const s = e.target.closest('[data-start]'); if (s) { openLesson(+s.dataset.start); return; }
  const n = e.target.closest('.dnode'); if (!n) return;
  const d = +n.dataset.day, ds = dayState(d);
  if (ds === 'open' || ds === 'done') openLesson(d);
  else if (ds === 'limit') toast('That’s 3 today. This one unlocks tomorrow.');
  else if (ds === 'soon') toast('This lesson is coming soon.');
  else toast('Finish Day ' + (d - 1) + ' first.');
});

/* ================= lesson loading ================= */
window.DRIVE_LESSONS = window.DRIVE_LESSONS || {};
function loadDay(d){
  if (DRIVE_LESSONS[d]) return Promise.resolve(DRIVE_LESSONS[d]);
  return new Promise((ok, bad) => {
    const s = document.createElement('script');
    s.src = 'content/drive/day' + d + '.js?v=6';
    s.onload = () => DRIVE_LESSONS[d] ? ok(DRIVE_LESSONS[d]) : bad();
    s.onerror = bad;
    document.head.appendChild(s);
  });
}
/* flags drop screens; a reviewSet becomes one quiz screen per question */
function prepare(lesson){
  const out = [];
  for (const s of lesson.screens) {
    if (s.flag && !FLAGS[s.flag]) continue;
    if (s.type === 'reviewSet') {
      s.items.forEach((q, i) => out.push(Object.assign({ type: 'quiz', kicker: 'Review · from Day ' + q.from + ' (' + (i + 1) + ' of ' + s.items.length + ')', review: true, id: 'rv' + q.from + '-' + i }, q)));
      continue;
    }
    out.push(s);
  }
  return out;
}

/* ================= lesson player ================= */
let L = null, P = null;
function buildPlayer(){
  if (P) return P;
  const el = document.createElement('section');
  el.className = 'dplayer'; el.setAttribute('aria-label', 'Lesson'); el.hidden = true;
  el.innerHTML = '<div class="dpbar"><button class="dicon" id="dp-close" aria-label="Close lesson">' + ICON.close + '</button>'
    + '<div class="dprog droad" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100"><i id="dp-fill"></i><b class="dcar" id="dp-car" aria-hidden="true">' + turboImg('idle', 30, 'dcar-img') + '</b></div>'
    + '<button class="dicon dvoice" aria-pressed="' + Voice.pref + '" aria-label="Turbo’s voice" title="Turbo’s voice">' + (Voice.pref ? '🗣️' : '🤐') + '</button>'
    + '<button class="dicon mute" aria-label="Turn sound off">🔊</button>'
    + '<div class="dpts" aria-live="polite"><span id="dp-pts">0</span>' + ICON.star + '</div></div>'
    + '<div class="dscroll" id="dp-scroll"><div class="dstage" id="dp-stage"></div><div class="dfoot">'
    + '<div class="dguide" id="dp-guide"><span class="dav" aria-hidden="true">' + POSES.map(p => turboImg(p, 54, 'dpose' + (p === 'idle' ? ' on' : '')).replace('<img ', '<img data-pose="' + p + '" ')).join('') + '</span>'
    + '<div class="dbubble" id="dp-bubble" aria-live="polite"></div></div>'
    + '<div class="dactions" id="dp-actions"></div></div></div>';
  document.body.appendChild(el);
  qs('#dp-close', el).onclick = askClose;
  el.addEventListener('keydown', e => { if (e.key === 'Escape' && !(typeof modalOpen === 'function' && modalOpen())) { e.stopPropagation(); askClose(); } });
  P = el; return el;
}
function setPose(p){ if (!P) return; qa('.dpose', P).forEach(i => i.classList.toggle('on', i.dataset.pose === p)); if (p === 'correct') anim(qs('.dav', P), { y: [0, -8, 0] }, { duration: 0.4 }); }
let basePose = 'idle';
let guideTW = null;
function guide(text, mood, pose, quiet, say){
  const b = qs('#dp-bubble'); b.className = 'dbubble ' + (mood || ''); b.textContent = text || '';
  qs('#dp-guide').classList.toggle('empty', !text);   // phones hide Turbo when he has nothing to say; wide screens keep the co-pilot panel
  if (guideTW) guideTW.skip();
  guideTW = text ? typeOut(b, { speak: !quiet, say }) : null;
  setPose(pose || (mood === 'ok' ? 'correct' : mood === 'bad' ? 'oops' : basePose));
}
const THINK = new Set(['story', 'estimate', 'rank', 'bet', 'pick', 'template', 'counter', 'selfcheck', 'predict', 'slider', 'scenarioSlider', 'poll', 'gameTheory', 'calendar', 'commons', 'ifthen']);
let typingT = null;
document.addEventListener('input', e => {
  if (!L || !P || !P.contains(e.target) || !e.target.matches('textarea,input[type=text],input:not([type])')) return;
  setPose('thinking'); clearTimeout(typingT); typingT = setTimeout(() => { if (L && !qs('.dbubble.ok,.dbubble.bad', P)) setPose(basePose); }, 1500);
});

async function openLesson(d, at){
  if (L) return;
  const owed = ME && unrated();
  if (owed && !(await rateLater(owed))) return;
  let lesson;
  try { lesson = await loadDay(d); } catch (e) { toast('Couldn’t load this lesson. Check your internet.'); return; }
  const S = st(), info = dayInfo(d);
  L = { d, i: 0, pts: 0, data: {}, memo: {}, events: [], first: !S.done[d], t0: Date.now(), screens: prepare(lesson), track: info.track, c: TRACK[info.track].c };
  buildPlayer();
  P.hidden = false; P.style.setProperty('--c', L.c);
  document.body.classList.add('dlesson');
  syncMute();
  W3('tint', L.c); W3('warp', L.c, 1200);
  if (ME) api('/api/drive', { action: 'open', token: ME.token, day: d, cid: cid(), at: Date.now() });
  if (d === 0) try { localStorage.setItem('ds_hi', '1'); } catch (e) {}
  sfx('go');
  if (at && tester()) L.i = Math.min(at, L.screens.length - 1);   // test accounts can jump to a screen: Drive.open(day, screen)
  render();
  setTimeout(() => qs('#dp-close').focus({ preventScroll: true }), 30);
}
function askClose(){
  if (!L) return;
  const last = L.i >= L.screens.length - 1;
  if (L.mustRate) { if (!L.rating) rateNow(); toast('One quick rating, then you’re done.'); return; }
  if (L.i === 0 || last || L.finished) return closeLesson();
  openModal('<h3 id="mtitle">Leave this lesson?</h3><p style="margin:0">Progress inside this lesson won’t be saved. You can start it again any time.</p>'
    + '<button type="button" class="btn full" id="dl-stay">Keep going</button>'
    + '<button type="button" class="mclose" id="dl-go">Leave anyway</button>');
  qs('#dl-stay').onclick = () => closeModal();
  qs('#dl-go').onclick = () => { closeModal(); closeLesson(); };
}
function closeLesson(){
  if (!L) return;
  clearInterval(L.timer);
  Voice.stop();
  L = null;
  P.hidden = true;
  document.body.classList.remove('dlesson');
  W3('tint', '#7B61FF');
  if (view === 'drive') renderHome();
  const b = qs('#drive-root [data-start]') || qs('#tab-drive'); if (b) b.focus({ preventScroll: true });
}
function actions(html){ qs('#dp-actions').innerHTML = html; }
function addPts(n){ if (!n) return; L.pts += n; qs('#dp-pts').textContent = L.pts; anim(qs('.dpts', P), { scale: [1.25, 1] }, { duration: 0.3 }); }
function log(kind, data, screen){ L.events.push({ kind, screen: screen || (L.screens[L.i] && L.screens[L.i].id) || ('s' + L.i), data }); }

function render(){
  const sc = L.screens, s = sc[L.i];
  clearInterval(L.timer);
  qs('#dp-fill').style.width = (L.i / Math.max(1, sc.length - 1) * 100) + '%';
  qs('#dp-car').style.left = (L.i / Math.max(1, sc.length - 1) * 100) + '%';
  qs('.dprog').setAttribute('aria-valuenow', Math.round(L.i / Math.max(1, sc.length - 1) * 100));
  qs('#dp-pts').textContent = L.pts;
  const stage = qs('#dp-stage'); stage.innerHTML = ''; qs('#dp-scroll').scrollTop = 0;
  const card = document.createElement('div'); card.className = 'dcard';
  stage.appendChild(card);
  basePose = THINK.has(s.type) ? 'thinking' : 'idle';
  guide(s.type === 'info' || s.type === 'wrap' ? '' : (s.guide || ''));
  const a = {
    s, card, stage, data: L.data, memo: st().memo,
    ready(v){ const b = qs('#dp-main'); if (b) b.disabled = v === false; },
    cont(label, ready, before){
      actions('<button class="dbtn" id="dp-main"' + (ready === false ? ' disabled' : '') + '>' + (label || 'Continue') + '</button>');
      qs('#dp-main').onclick = () => { if (before && before() === false) return; next(); };
    },
    check(fn){ actions('<button class="dbtn" id="dp-main" disabled>Check</button>'); qs('#dp-main').onclick = () => fn(); },
    log, addPts, guide
  };
  (R[s.type] || R.info)(s, a);
  anim(card, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3 });
  const f = card.querySelector('input[type=text],textarea'); if (f && !f.closest('[hidden]') && matchMedia('(hover:hover)').matches) setTimeout(() => f.focus({ preventScroll: true }), 60);
}
function next(){ sfx('tap'); Voice.stop(); L.i++; render(); }
function feedback(ok, msg, why, a, soft){
  a.card.classList.add(ok ? 'ok' : 'bad');
  guide(msg, ok ? 'ok' : 'bad');
  sfx(ok ? 'correct' : (soft ? 'softbad' : 'wrong'));
  actions('<button class="dbtn ghost" id="dp-why" aria-expanded="false">Why?</button><button class="dbtn okb" id="dp-main">Continue</button>');
  qs('#dp-main').onclick = next;
  qs('#dp-why').onclick = e => {
    const box = qs('#dp-whybox');
    if (box) { box.remove(); e.currentTarget.setAttribute('aria-expanded', 'false'); return; }
    a.stage.appendChild(frag('<div class="dwhy" id="dp-whybox">' + why + '</div>'));
    e.currentTarget.setAttribute('aria-expanded', 'true');
    qs('#dp-whybox').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
  };
  qs('#dp-main').focus({ preventScroll: true });
}
const kick = t => t ? '<div class="dkicker">' + t + '</div>' : '';
/* show elements one after another, each typed out by Turbo */
function talkSeq(els, onDone, onStep){
  let i = 0, cur = null, fin = false;
  const finish = () => { if (fin) return; fin = true; onDone && onDone(); };
  const step = () => {
    if (fin) return;
    if (i >= els.length) return finish();
    const el = els[i++]; if (!el.isConnected) return;
    el.hidden = false; anim(el, { opacity: [0, 1], y: [8, 0] }, { duration: 0.22 });
    if (onStep) onStep(i - 1);
    cur = typeOut(el); cur.done.then(() => setTimeout(step, reduced() ? 0 : 280));
  };
  step();
  return {
    get busy(){ return !fin; },
    tapSkip(){ if (cur) cur.skip(); },
    skipAll(){ if (fin) return; i = els.length; if (cur) cur.skip(); Voice.stop(); els.forEach(e => { e.hidden = false; qa('.tw', e).forEach(x => x.classList.add('on')); }); if (onStep) onStep(els.length - 1); finish(); }
  };
}
/* the visual stage above Turbo's bubbles: changes with each bubble.
   visual: 'curve' (a mini forgetting curve that draws itself), or an array with one entry per bubble:
   an emoji scene ('📖📖 vs ❓✍️'), or null to keep the last one. */
function scene(box, v, i){
  if (v === 'curve') return miniCurve(box, i);
  let k = Math.min(i, v.length - 1); while (k > 0 && v[k] == null) k--;
  const sc = v[k]; if (sc == null || box.dataset.k === String(k)) return;
  box.dataset.k = k;
  box.innerHTML = '<div class="dvis-scene">' + String(sc).split(' ').filter(Boolean).map((t, j) => '<span style="animation-delay:' + (j * 0.12) + 's">' + t + '</span>').join('') + '</div>';
}
function miniCurve(box, i){
  if (!qs('svg', box)) {
    box.innerHTML = '<svg class="dvis-curve" viewBox="0 0 320 150"><line x1="44" y1="125" x2="305" y2="125" stroke="var(--d-line)" stroke-width="3"/><line x1="44" y1="15" x2="44" y2="125" stroke="var(--d-line)" stroke-width="3"/>'
      + '<text x="38" y="22" text-anchor="end" font-size="11" font-weight="800" fill="var(--d-muted)">100%</text><text x="305" y="142" text-anchor="end" font-size="11" font-weight="800" fill="var(--d-muted)">time →</text>'
      + '<path class="c1" d="M46,18 C58,70 70,88 96,96" fill="none" stroke="var(--d-bad)" stroke-width="5" stroke-linecap="round" pathLength="1"/>'
      + '<path class="c2" d="M96,96 C150,104 230,108 302,111" fill="none" stroke="var(--d-brand-a)" stroke-width="5" stroke-linecap="round" pathLength="1"/>'
      + '<g class="c3"><circle cx="96" cy="96" r="6" fill="var(--d-bad)"/><text x="104" y="84" font-size="12" font-weight="900" fill="var(--d-bad)">most of it gone in a day</text></g>'
      + '<g class="c4"><text x="300" y="100" text-anchor="end" font-size="12" font-weight="900" fill="var(--d-brand-a)">then slower</text></g>'
      + '<g class="c5"><text x="160" y="40" text-anchor="middle" font-size="13" font-weight="900" fill="var(--d-ink)">Ebbinghaus, 1885 🧪</text></g>'
      + '<g class="c6"><text x="200" y="64" text-anchor="middle" font-size="22">🧠↘️</text></g></svg>';
  }
  const steps = [['c1', 'c3'], ['c2', 'c4'], ['c5'], ['c6']];
  for (let k = 0; k <= Math.min(i, steps.length - 1); k++) steps[k].forEach(c => qs('.' + c, box).classList.add('on'));
}
/* a month calendar (Mon-first weeks, the last day is the exam); on = picked days */
function calGrid(N, on, lock, cls){
  return '<div class="dcal' + (cls ? ' ' + cls : '') + '">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => '<span class="dcal-h" aria-hidden="true">' + d + '</span>').join('')
    + Array.from({ length: N }, (_, i) => {
      const d = i + 1;
      if (d === N) return '<span class="dcal-d exam" role="img" aria-label="Day ' + d + ': exam">🎯</span>';
      return lock ? '<span class="dcal-d' + (on.has(d) ? ' on' : '') + '" aria-label="Day ' + d + (on.has(d) ? ': study' : '') + '">' + d + '</span>'
        : '<button type="button" class="dcal-d" data-d="' + d + '" aria-pressed="false" aria-label="Day ' + d + '">' + d + '</button>';
    }).join('') + '</div>';
}
const fill = (t, d) => String(t).replace(/\{(\w+)\}/g, (m, k) => d[k] != null ? esc(String(d[k])) : m);

/* ================= screen renderers =================
   Content strings in lesson files are trusted HTML (written by the team); anything a student types is escaped. */
const R = {
/* Turbo talks: body lines appear one by one as chat bubbles, typed (and spoken when the voice is on).
   Facts, pairs and notes show once he's done. The first press of the button while he's talking shows everything. */
info(s, a){
  const lines = (s.body || []).slice(); if (s.guide) lines.push(s.guide);
  let html = kick(s.kicker) + (s.title ? '<h2>' + s.title + '</h2>' : '')
    + (s.visual ? '<div class="dtalkwrap"><div class="dvis" aria-hidden="true"></div>' : '')
    + '<div class="dtalk"><span class="dtalk-av" aria-hidden="true">' + turboImg(s.pose || 'idle', 64, 'dtalk-img') + '</span><div class="dtalk-lines">'
    + lines.map((p, i) => '<p class="dtb' + (s.guide && i === lines.length - 1 ? ' last' : '') + '" hidden>' + p + '</p>').join('') + '</div></div>' + (s.visual ? '</div>' : '');
  let later = '';
  if (s.facts) later += '<div class="dfacts">' + s.facts.map(f => '<div class="dfact"><b>' + f[0] + '</b><span>' + f[1] + '</span></div>').join('') + '</div>';
  if (s.pairs) {
    const mine = L.data.rewrites || [];
    later += s.pairs.map((p, i) => '<div class="dsortrow col"><span class="dnote">' + (s.pairLabel || 'Fixed') + ': “' + p[0] + '”</span>' + (mine[i] ? '<span><b>You:</b> ' + esc(mine[i]) + '</span>' : '') + '<span><b>Example:</b> ' + p[1] + '</span></div>').join('');
  }
  if (s.note) later += '<p class="dnote">' + s.note + '</p>';
  a.card.appendChild(frag(html + (later ? '<div class="dlater" hidden>' + later + '</div>' : '')));
  const label = s.cta || 'Continue';
  const show = () => { const l = qs('.dlater', a.card); if (l && l.hidden) { l.hidden = false; anim(l, { opacity: [0, 1], y: [10, 0] }, { duration: 0.3 }); } const b = qs('#dp-main'); if (b) b.textContent = label; };
  const vis = qs('.dvis', a.card);
  const t = talkSeq(qa('.dtb', a.card), show, vis ? i => scene(vis, s.visual, i) : null);
  actions('<button class="dbtn" id="dp-main">' + (lines.length > 1 ? 'Skip ▸▸' : label) + '</button>');
  qs('#dp-main').onclick = () => { if (t.busy) { t.skipAll(); return; } next(); };
  a.card.addEventListener('click', e => { if (!e.target.closest('button,a,input,textarea,svg')) t.tapSkip(); });
},

quiz(s, a){
  a.card.appendChild(frag(kick(s.kicker) + '<h3>' + s.q + '</h3><div class="dopts">' + s.opts.map((o, i) => '<button class="dopt" data-i="' + i + '" aria-pressed="false">' + o[0] + '</button>').join('') + '</div>'));
  let pickI = -1; const t0 = Date.now();
  qa('.dopt', a.card).forEach(b => b.onclick = () => {
    pickI = +b.dataset.i; sfx('tap');
    qa('.dopt', a.card).forEach(x => x.setAttribute('aria-pressed', x === b)); a.ready(true);
  });
  a.check(() => {
    const o = s.opts[pickI], ok = !!o[1];
    qa('.dopt', a.card).forEach((x, i) => { x.disabled = true; if (s.opts[i][1]) x.classList.add('right'); else if (i === pickI) x.classList.add('wrong'); });
    L.combo = ok ? (L.combo || 0) + 1 : 0;
    if (ok) addPts(10 + (L.combo >= 2 ? 5 : 0));
    log('attempt', { dim: s.dim || dimOf(L.track), pick: pickI, correct: ok, first: true, ms: Date.now() - t0, review: !!s.review, from: s.from || L.d });
    const right = s.opts.find(x => x[1]);
    const praise = ['Exactly.', 'Nailed it.', 'Yes!', 'Spot on.'][Math.floor(Math.random() * 4)];
    feedback(ok, ok ? (L.combo >= 2 ? '🔥 ' + L.combo + ' in a row! +5 bonus.' : praise) : 'Not quite. Tap Why? to see it.', '<p><b>' + (ok ? 'Your answer' : 'Why not') + ':</b> ' + o[2] + '</p>' + (ok ? '' : '<p><b>Best answer:</b> ' + right[0] + '. ' + right[2] + '</p>') + '<p>' + s.why + '</p>', a);
  });
},

/* items: [text, labelKey, why]; labels: [[key, Label], [key, Label]]. judge:false = a self-sort with no right answer */
sort(s, a){
  const items = s.fromPick ? (L.data[s.fromPick] || []).map(t => [t]) : s.items;
  if (!items.length) { L.i++; return render(); }
  a.card.appendChild(frag(kick(s.kicker) + '<h3>' + s.title + '</h3>' + (s.text ? '<p>' + s.text + '</p>' : '')
    + '<div class="dsortlist">' + items.map((it, i) => '<div class="dsortrow" id="dsr' + i + '"><q>' + it[0] + '</q><div class="dseg" role="group" aria-label="Sort line ' + (i + 1) + '">'
      + s.labels.map(l => '<button data-i="' + i + '" data-v="' + l[0] + '" aria-pressed="false">' + l[1] + '</button>').join('') + '</div></div>').join('') + '</div>'));
  const picks = {};
  qa('.dseg button', a.card).forEach(b => b.onclick = () => {
    sfx('tap'); picks[b.dataset.i] = b.dataset.v;
    qa('button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', x === b)); a.ready(Object.keys(picks).length === items.length);
  });
  if (s.judge === false) {
    a.cont(s.btn || 'Done', false, () => {
      const out = items.map((it, i) => ({ text: it[0], v: picks[i] }));
      log('sort', { items: out });
      L.data[s.key || 'sorted'] = out;
      addPts(s.pts || 10);
    });
    return;
  }
  a.check(() => {
    let n = 0, why = '';
    items.forEach((it, i) => {
      const ok = picks[i] === it[1]; if (ok) n++;
      qs('#dsr' + i).classList.add(ok ? 'right' : 'wrong'); qa('#dsr' + i + ' button').forEach(x => x.disabled = true);
      why += '<p><b>' + s.labels.find(l => l[0] === it[1])[1] + ':</b> “' + it[0] + '” ' + it[2] + '</p>';
    });
    addPts(n * 2);
    log('sort', { right: n, of: items.length, picks });
    feedback(n >= items.length - 1, n === items.length ? 'All ' + items.length + ' right.' : n + ' of ' + items.length + ' right.', why, a);
  });
},

memorize(s, a){
  const secs = s.secs || 30, min = s.minSecs || 15;
  a.card.appendChild(frag(kick(s.kicker || 'Feel it') + '<h3>' + s.title + '</h3><p>' + (s.text || 'You have ' + secs + ' seconds. You can continue after ' + (secs - min) + '.') + '</p>'
    + '<p class="dtimer" id="dp-tmr" aria-live="off">⏱ ' + secs + ' seconds left</p><div class="dwords">' + s.words.map(w => '<div class="dword">' + w + '</div>').join('') + '</div>'));
  a.cont(s.btn || 'I’ve got them', false, () => { clearInterval(L.timer); L.data[s.key || 'memAt'] = Date.now(); });
  let t = secs;
  L.timer = setInterval(() => {
    t--; const el = qs('#dp-tmr'); if (!el) return clearInterval(L.timer);
    el.textContent = t > 0 ? '⏱ ' + t + ' seconds left' : 'Time’s up';
    if (t <= secs - min) a.ready(true);
    if (t <= 0) { clearInterval(L.timer); qs('.dwords', a.card).classList.add('blur'); }
  }, 1000);
},

/* a number slider; the value is kept in L.data[key] and logged */
slider(s, a){
  const v0 = s.value != null ? s.value : Math.round((s.min + s.max) / 2);
  a.card.appendChild(frag(kick(s.kicker || 'Predict') + '<h3>' + s.q + '</h3><div class="dcenter"><div class="dbig" id="dp-sv">' + v0 + (s.unit || '') + '</div></div>'
    + '<input type="range" class="drange" id="dp-sr" min="' + s.min + '" max="' + s.max + '" value="' + v0 + '" aria-label="' + esc(s.aria || 'Your answer') + '">'
    + '<div class="dticks"><span>' + (s.minLabel || s.min) + '</span><span>' + (s.maxLabel || s.max) + '</span></div>'));
  const r = qs('#dp-sr'); r.oninput = () => { qs('#dp-sv').textContent = r.value + (s.unit || ''); a.ready(true); };
  a.cont(s.btn || 'Lock in my guess', !s.mustMove, () => { L.data[s.key] = +r.value; log(s.logKind || 'predict', { key: s.key, value: +r.value }); if (s.memo) L.memo[s.key] = +r.value; });
},
predict(s, a){ R.slider(Object.assign({ min: 0, max: 12, value: 6, key: 'predict', memo: true, aria: 'Keywords you will remember in 7 days' }, s), a); },

/* Day 1: Ebbinghaus' savings data, with a toggle for the illustrative spaced-review line */
curve(s, a){
  const pts = [[0, '0', 100], [1, '20 min', 58], [2, '1 hr', 44], [3, '9 hr', 36], [4, '1 day', 34], [5, '2 days', 28], [6, '6 days', 25], [7, '31 days', 21]];
  const W = 640, H = 300, px = i => 60 + i * 76, py = v => 250 - v * 2.1;
  const line = pts.map((p, i) => (i ? 'L' : 'M') + px(p[0]) + ',' + py(p[2])).join(' ');
  const sp = [[0, 100], [1, 62], [2, 52], [3, 46], [4, 44], [4, 95], [5, 82], [5, 97], [6, 88], [6, 98], [7, 90]];
  const sline = sp.map((p, i) => (i ? 'L' : 'M') + px(p[0]) + ',' + py(p[1])).join(' ');
  a.card.appendChild(frag(kick('See it') + '<h3>How much of a list was still remembered</h3>'
    + '<div class="dtoggle"><button class="dtbtn" id="dp-rev" aria-pressed="false">Add 3 reviews</button></div>'
    + '<svg class="dchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Forgetting curve: memory drops from 100% to 58% after 20 minutes, 34% after 1 day and 21% after 31 days.">'
    + [0, 25, 50, 75, 100].map(v => '<line x1="55" x2="' + (W - 20) + '" y1="' + py(v) + '" y2="' + py(v) + '" stroke="var(--d-line)" stroke-width="1.5"/><text x="46" y="' + (py(v) + 5) + '" text-anchor="end" font-size="13" font-weight="700" fill="var(--d-muted)">' + v + '%</text>').join('')
    + pts.map(p => '<text x="' + px(p[0]) + '" y="' + (H - 14) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--d-muted)">' + p[1] + '</text>').join('')
    + '<path id="dp-spc" d="' + sline + '" fill="none" stroke="var(--d-strat)" stroke-width="4" stroke-linejoin="round" stroke-dasharray="1400" stroke-dashoffset="1400" style="transition:stroke-dashoffset 1.4s ease"/>'
    + '<path d="' + line + '" fill="none" stroke="var(--d-brand-a)" stroke-width="4" stroke-linejoin="round"/>'
    // where each review happened: a small green circle at the top of each jump, with its label
    + '<g id="dp-revs" class="drevs">' + [[4, 95, 'Review 1'], [5, 97, 'Review 2'], [6, 98, 'Review 3']].map(([x, v, t], i) =>
      '<g style="transition-delay:' + (0.5 + i * 0.35) + 's"><line x1="' + px(x) + '" x2="' + px(x) + '" y1="' + py(v) + '" y2="' + (py(0) + 2) + '" stroke="var(--d-strat)" stroke-width="2" stroke-dasharray="4 5" opacity=".55"/>'
      + '<circle cx="' + px(x) + '" cy="' + py(v) + '" r="8" fill="var(--d-strat)" stroke="#fff" stroke-width="3"/>'
      + '<text x="' + px(x) + '" y="' + (py(v) - 14) + '" text-anchor="middle" font-size="12.5" font-weight="900" fill="var(--d-strat)">' + t + '</text></g>').join('') + '</g>'
    + pts.map(p => '<circle cx="' + px(p[0]) + '" cy="' + py(p[2]) + '" r="7" fill="#fff" stroke="var(--d-brand-a)" stroke-width="3" class="dpt" data-v="' + p[2] + '" data-t="' + p[1] + '" tabindex="0" role="button" aria-label="' + (p[1] === '0' ? 'Right after learning' : 'After ' + p[1]) + '"/>').join('')
    + '</svg><p id="dp-cnote" class="dnote" aria-live="polite">Purple: Ebbinghaus’ 1885 results. Tap a point.</p>'));
  qa('.dpt', a.card).forEach(c => {
    const f = () => { sfx('tap'); const v = +c.dataset.v; qs('#dp-cnote').textContent = c.dataset.t === '0' ? 'Right after learning: 100% remembered.' : 'After ' + c.dataset.t + ': about ' + v + '% left. Of your 12 keywords, that’s about ' + Math.round(12 * v / 100) + '.'; };
    c.onclick = f; c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } };
  });
  a.cont('Continue', false);
  qs('#dp-rev').onclick = e => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on);
    qs('#dp-spc').style.strokeDashoffset = on ? 0 : 1400; qs('#dp-revs').classList.toggle('on', on); sfx('tap');
    qs('#dp-cnote').textContent = on ? 'Green dots: a quick review on day 1, day 2 and day 6. Each one pushes memory back up, and it falls slower every time. (An illustration, not Ebbinghaus’ data.)' : 'Purple: Ebbinghaus’ 1885 results. Tap a point.';
    guide(on ? 'Each review resets the curve and slows the next drop.' : s.guide); a.ready(true);
  };
},

/* type items one by one; hits = items in s.words */
recall(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Memory test') + '<h3>' + s.title + '</h3><p>' + (s.text || 'Press Enter after each one. Order doesn’t matter.') + '</p>'
    + '<div class="drecall-in"><input id="dp-ri" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="' + esc(s.aria || 'Keyword') + '"><button class="dbtn ghost sm" id="dp-radd">Add</button></div>'
    + '<div class="dfound" id="dp-found" aria-live="polite"></div>'));
  const ri = qs('#dp-ri'), got = new Set(), tried = new Set(); blockPaste(ri);
  const add = () => {
    const w = ri.value.trim().toLowerCase(); ri.value = ''; if (!w || tried.has(w)) return; tried.add(w);
    const hit = s.words.includes(w); if (hit) { got.add(w); sfx('softok'); } else sfx('softbad');
    qs('#dp-found').appendChild(frag('<span class="' + (hit ? 'hit' : 'miss') + '">' + esc(w) + '</span>')); a.ready(tried.size > 0); ri.focus();
  };
  ri.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
  qs('#dp-radd').onclick = add;
  a.cont(s.btn || 'That’s all I remember', false, () => {
    L.data.got = [...got];
    const mins = L.data.memAt ? Math.max(1, Math.round((Date.now() - L.data.memAt) / 60000)) : null;
    log('recall', { key: s.key, got: L.data.got, n: got.size, tried: tried.size, mins, sinceDay1: s.key === 'd7' && st().done[1] ? Math.round((Date.now() - st().done[1].at) / 60000) : null });
    if (s.key === 'd1') L.memo.recall = { n: got.size, mins: mins || 5 };
  });
},
recallResult(s, a){
  const got = L.data.got || [], n = got.length, total = s.words.length;
  const missed = s.words.filter(w => !got.includes(w));
  addPts(n * 2);
  let html;
  if (s.compare) {
    const m = st().memo, before = m.recall ? m.recall.n : null, guess = m.predict;
    html = kick('Your result') + '<div class="dcenter"><div class="dbig">' + n + ' / ' + total + '</div><p>remembered today, with no review since Day 1</p></div>'
      + '<div class="dfacts"><div class="dfact"><b>' + (before ?? '–') + '</b><span>on Day 1, minutes after learning</span></div><div class="dfact"><b>' + (guess ?? '–') + '</b><span>your guess for today</span></div><div class="dfact"><b>' + n + '</b><span>today, with no review</span></div></div>'
      + '<p>' + (guess == null ? '' : n > guess ? 'You beat your own guess.' : n === guess ? 'Your guess was spot on.' : 'You remembered fewer than you guessed. Most people overestimate. That’s why a review plan beats a feeling.') + '</p>'
      + (missed.length ? '<p class="dnote">You missed: ' + missed.join(', ') + '</p>' : '');
  } else {
    const mins = L.data.memAt ? Math.max(1, Math.round((Date.now() - L.data.memAt) / 60000)) : 5;
    html = kick('Your result') + '<div class="dcenter"><div class="dbig">' + n + ' / ' + total + '</div><p>remembered after about ' + plural(mins, 'minute') + '</p></div>'
      + '<p>' + (n >= 10 ? 'Strong start. The curve says most of these will still fade without a review.' : n >= 6 ? 'You’ve already lost some, just minutes later. That’s the curve at work.' : 'Most are already gone, just minutes later. That’s exactly what Ebbinghaus found.') + '</p>'
      + (missed.length ? '<p class="dnote">You missed: ' + missed.join(', ') + '</p>' : '')
      + '<p>Your guess for Day 7: <b>' + (L.data.predict ?? '–') + ' of ' + total + '</b>. We’ll test you then.</p>';
  }
  a.card.appendChild(frag(html));
  guide('+' + n * 2 + ' points for recall.', null, null, false, 'Nice recall!');
  a.cont();
},

rewrite(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Commit') + '<h3>' + s.title + '</h3><p>' + (s.text || 'Say it the way you’d actually say it. At least 4 words each.') + '</p>'
    + s.lines.map((l, i) => '<div class="dfield"><label for="dp-rw' + i + '">“' + l + '”</label><textarea id="dp-rw' + i + '" rows="2"></textarea><div class="dmeta"><span>Your version</span><span id="dp-wc' + i + '">0 words</span></div></div>').join('')));
  const tas = s.lines.map((_, i) => qs('#dp-rw' + i));
  const strip = t => t.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  const upd = () => {
    let ok = true;
    tas.forEach((t, i) => {
      const n = words(t.value), same = strip(t.value) === strip(s.lines[i]), good = n >= 4 && !same;
      const el = qs('#dp-wc' + i); el.textContent = same ? 'Change it a little' : plural(n, 'word'); el.className = good ? 'good' : ''; if (!good) ok = false;
    });
    a.ready(ok);
  };
  tas.forEach(t => { blockPaste(t); t.oninput = upd; });
  a.cont('Done', false, () => {
    L.data.rewrites = tas.map(t => t.value.trim());
    log('rewrite', { lines: L.data.rewrites, words: L.data.rewrites.map(words) });
    addPts(15);
  });
},

commit(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Commit') + '<h3>' + s.q + '</h3><div class="dopts">' + s.opts.map((o, i) => '<button class="dopt" data-i="' + i + '" aria-pressed="false">' + o + '</button>').join('') + '</div>'
    + '<div class="dfield" style="margin-top:16px"><label for="dp-own">Or write your own</label><input id="dp-own" type="text" placeholder="If …, then I’ll …" autocomplete="off"></div>'));
  let val = ''; const own = qs('#dp-own'); blockPaste(own);
  qa('.dopt', a.card).forEach(b => b.onclick = () => { sfx('tap'); val = s.opts[+b.dataset.i]; own.value = ''; qa('.dopt', a.card).forEach(x => x.setAttribute('aria-pressed', x === b)); a.ready(true); });
  own.oninput = () => { if (own.value.trim()) { val = ''; qa('.dopt', a.card).forEach(x => x.setAttribute('aria-pressed', 'false')); } a.ready(words(own.value) >= 4 || (!!val && !own.value.trim())); };
  a.cont('Save my plan', false, () => {
    const text = own.value.trim() || val, mine = !!own.value.trim();
    L.memo['plan_d' + L.d] = text;
    log('plan', { key: s.key, text, own: mine, words: words(text) });
    addPts(10);
    sfx('select');
  });
},

/* a free-text reflection: not judged, only a minimum length */
reflect(s, a){
  const min = s.minWords || 10;
  a.card.appendChild(frag(kick(s.kicker || 'Reflect') + '<h3>' + s.q + '</h3>' + (s.text ? '<p>' + s.text + '</p>' : '')
    + '<div class="dfield"><label for="dp-rf" class="sr">' + esc(s.label || 'Your answer') + '</label><textarea id="dp-rf" rows="4" placeholder="' + esc(s.ph || '') + '"></textarea><div class="dmeta"><span>Not marked. At least ' + min + ' words.</span><span id="dp-rfc">0 words</span></div></div>'));
  const ta = qs('#dp-rf'); blockPaste(ta);
  ta.addEventListener('input', () => { const n = words(ta.value); const el = qs('#dp-rfc'); el.textContent = plural(n, 'word'); el.className = n >= min ? 'good' : ''; a.ready(n >= min); });
  a.cont(s.btn || 'Save', false, () => {
    const text = ta.value.trim();
    log('reflect', { key: s.key, track: s.track || L.track, text, words: words(text) });
    if (s.key) L.memo[s.key] = text;
    addPts(s.pts || 10);
  });
},

/* pick any options that apply (Day 0 study habits, Day 5 reasons) */
multi(s, a){
  a.card.appendChild(frag(kick(s.kicker) + '<h3>' + s.q + '</h3>' + (s.text ? '<p>' + s.text + '</p>' : '') + '<div class="dopts multi">' + s.opts.map((o, i) => '<button class="dopt' + (i === s.none ? ' dnone' : '') + '" data-i="' + i + '" aria-pressed="false">' + o + '</button>').join('') + '</div>'
    + (s.none != null ? '<p class="dnote" style="margin-top:10px">The last option can’t go with the others, so picking it clears them.</p>' : '')));
  const on = new Set();
  qa('.dopt', a.card).forEach(b => b.onclick = () => {
    sfx('tap'); const i = +b.dataset.i, was = on.has(i);
    if (s.none != null && i === s.none) on.clear(); else if (s.none != null) on.delete(s.none);
    was ? on.delete(i) : on.add(i);
    qa('.dopt', a.card).forEach(x => x.setAttribute('aria-pressed', on.has(+x.dataset.i)));
    a.ready(on.size >= (s.min || 1));
  });
  a.cont(s.btn || 'Continue', false, () => {
    const picked = [...on].sort((x, y) => x - y).map(i => s.opts[i]);
    L.data[s.key] = picked;
    if (s.memo) L.memo[s.key] = picked;
    log(s.logKind || 'study', { key: s.key, picked });
  });
},

/* a choice with no right answer (a prediction or a poll) */
poll(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Predict') + '<h3>' + s.q + '</h3><div class="dopts">' + s.opts.map((o, i) => '<button class="dopt" data-i="' + i + '" aria-pressed="false">' + o + '</button>').join('') + '</div>'));
  let v = -1;
  qa('.dopt', a.card).forEach(b => b.onclick = () => { sfx('tap'); v = +b.dataset.i; qa('.dopt', a.card).forEach(x => x.setAttribute('aria-pressed', x === b)); a.ready(true); });
  a.cont(s.btn || 'Lock it in', false, () => { L.data[s.key] = v; log('predict', { key: s.key, pick: v, text: s.opts[v] }); });
},

/* Day 0 scales (behind FLAGS.scales). Items: [text, reverse?] */
scale(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'About you') + '<h3>' + s.title + '</h3><p>' + s.text + '</p><div class="dscale">'
    + s.items.map((it, i) => '<fieldset class="dsitem"><legend>' + (i + 1) + '. ' + it[0] + '</legend><div class="dseg wrap" style="--n:' + s.options.length + '">' + s.options.map((o, j) => '<button type="button" data-i="' + i + '" data-v="' + (j + 1) + '" aria-pressed="false">' + o + '</button>').join('') + '</div></fieldset>').join('') + '</div>'));
  const ans = {};
  qa('.dseg button', a.card).forEach(b => b.onclick = () => { sfx('tap'); ans[b.dataset.i] = +b.dataset.v; qa('button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', x === b)); a.ready(Object.keys(ans).length === s.items.length); });
  a.cont('Continue', false, () => {
    const raw = s.items.map((_, i) => ans[i]);
    log('scale', { scale: s.scale, raw, reverse: s.items.map(it => !!it[1]), points: s.options.length });
    L.memo.scales = Object.assign({}, L.memo.scales, { [s.scale]: true });
  });
},

/* Day 3: the CampusEats files (generalised: count tiles, a slider, a message at the end) */
scenarioSlider(s, a){
  const n = s.count || 16, order = s.order || [5, 12, 0, 9, 3, 14, 7, 1, 10, 15, 4, 8, 13, 2, 11, 6];
  a.card.appendChild(frag(kick(s.kicker || 'The puzzle') + '<h2>' + s.title + '</h2>' + (s.body || []).map(p => '<p>' + p + '</p>').join('')
    + '<div class="dfiles' + (s.shape ? ' ' + s.shape : '') + '" aria-hidden="true">' + Array.from({ length: n }, () => '<i></i>').join('') + '</div>'
    + '<input type="range" class="drange" id="dp-mo" min="0" max="' + (s.max || 24) + '" value="0" aria-label="' + esc(s.aria || 'Months since launch') + '">'
    + '<div class="dticks"><span>' + (s.left || 'Launch') + '</span><span id="dp-mol" aria-live="polite">' + fill(s.unit, { k: 0, n }) + '</span><span>' + (s.right || '2 years') + '</span></div>'
    + '<p id="dp-theq" class="dnote" style="margin-top:12px">' + (s.note || '') + '</p>'));
  const fs = qa('.dfiles i', a.card), mo = qs('#dp-mo');
  mo.oninput = () => {
    const k = Math.round(n * mo.value / (s.max || 24));
    fs.forEach((f, i) => f.classList.toggle('new', order.indexOf(i) < k)); qs('#dp-mol').textContent = fill(s.unit, { k, n });
    if (k === n && !L.data.sliderDone) { L.data.sliderDone = true; qs('#dp-theq').innerHTML = '<b>' + s.end + '</b>'; a.ready(true); guide(s.endGuide || ''); }
  };
  a.cont('Continue', false);
},
theseus(s, a){ R.scenarioSlider(s, a); },

/* ---- Take a Stand: pick -> template -> counter -> selfcheck -> standWrap. Never judged, never scored for quality. ---- */
pick(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Pick a side') + '<h3>' + s.q + '</h3><div class="dsides">' + s.sides.map((x, i) => '<button class="dsidecard" data-i="' + i + '" aria-pressed="false"><b>' + x[0] + '</b><span>' + x[1] + '</span></button>').join('') + '</div>'
    + '<p class="dnote" style="margin-top:16px">Your batch’s split shows after you save your stand, once 20 students have picked.</p>'));
  qa('.dsidecard', a.card).forEach(b => b.onclick = () => {
    sfx('tap'); L.data.side = +b.dataset.i; L.data.sideName = s.sides[+b.dataset.i][0]; L.data.sides = s.sides.map(x => x[0]); L.data.claim = (s.claims || [])[+b.dataset.i];
    qa('.dsidecard', a.card).forEach(x => x.setAttribute('aria-pressed', x === b)); a.ready(true);
  });
  a.cont('This is my side', false);
},
template(s, a){
  const f = s.parts || [['because', 'Because', 'One reason you believe this.'], ['example', 'For example', 'One example, from life, tech or college.'], ['other', 'Someone who disagrees would say', 'Their best point, not a weak one.'], ['reply', 'My reply', 'One line answering them.']];
  const claim = L.data.claim || fill(s.claim || 'I think {side}.', { side: (L.data.sideName || '').toLowerCase() });
  a.card.appendChild(frag(kick('Your stand') + '<h3>' + claim + '</h3><p>Fill all four parts in your own words. At least 5 words each.</p>'
    + f.map(x => '<div class="dfield"><label for="dp-f_' + x[0] + '">' + x[1] + '</label><textarea id="dp-f_' + x[0] + '" rows="2" placeholder="' + esc(x[2]) + '"></textarea><div class="dmeta"><span></span><span id="dp-c_' + x[0] + '">0 words</span></div></div>').join('')));
  const t0 = Date.now(); let typing = 0, last = 0;
  const upd = () => {
    let ok = true; const vals = f.map(x => norm(qs('#dp-f_' + x[0]).value));
    f.forEach((x, i) => {
      const n = words(qs('#dp-f_' + x[0]).value), dup = n > 0 && vals.indexOf(vals[i]) !== i, el = qs('#dp-c_' + x[0]);
      el.textContent = dup ? 'Same as another box. Write something new.' : plural(n, 'word'); el.className = n >= 5 && !dup ? 'good' : ''; if (n < 5 || dup) ok = false;
    });
    a.ready(ok);
  };
  f.forEach(x => { const ta = qs('#dp-f_' + x[0]); blockPaste(ta); ta.oninput = () => { const now = Date.now(); if (last && now - last < 5000) typing += now - last; last = now; upd(); }; });
  a.cont('Save my stand', false, () => {
    L.data.claimText = claim;
    L.data.stand = {}; f.forEach(x => L.data.stand[x[0]] = qs('#dp-f_' + x[0]).value.trim());
    L.data.partLabels = f.map(x => [x[0], x[1]]);
    L.data.typingSec = Math.round(typing / 1000); L.data.totalSec = Math.round((Date.now() - t0) / 1000);
    addPts(20);
  });
},
counter(s, a){
  a.card.appendChild(frag(kick('The other side') + '<h3>The strongest case against your view</h3><div class="dquote">' + s.texts[L.data.side] + '</div>'
    + '<p style="margin-top:16px" class="dnote">You said: “' + esc(L.data.stand.because) + '”</p>'));
  a.cont();
},
selfcheck(s, a){
  a.card.appendChild(frag(kick('Self-check') + '<h3>Does your reason still hold?</h3>'
    + '<div class="dsides"><button class="dsidecard" data-v="hold" aria-pressed="false"><b>I hold my stand</b><span>My reason still works.</span></button>'
    + '<button class="dsidecard" data-v="revise" aria-pressed="false"><b>I’ll revise it</b><span>Their point changed my thinking.</span></button></div>'
    + '<div id="dp-revwrap" hidden><div class="dfield" style="margin-top:16px"><label for="dp-rev">Your revised reason</label><textarea id="dp-rev" rows="2"></textarea></div></div>'
    + '<div class="dfield" style="margin-top:16px"><label for="dp-whyl">In one line, why?</label><input id="dp-whyl" type="text" autocomplete="off" placeholder="At least 4 words"></div>'));
  let v = ''; const rev = qs('#dp-rev'), wl = qs('#dp-whyl'); rev.value = L.data.stand.because; blockPaste(rev); blockPaste(wl);
  const upd = () => a.ready(!!v && words(wl.value) >= 4 && (v === 'hold' || words(rev.value) >= 5));
  qa('.dsidecard', a.card).forEach(b => b.onclick = () => { sfx('tap'); v = b.dataset.v; qa('.dsidecard', a.card).forEach(x => x.setAttribute('aria-pressed', x === b)); qs('#dp-revwrap').hidden = v !== 'revise'; upd(); });
  rev.oninput = upd; wl.oninput = upd;
  a.cont('Finish', false, () => {
    L.data.self = { choice: v, why: wl.value.trim() };
    L.data.originalBecause = L.data.stand.because;
    if (v === 'revise') L.data.stand.because = rev.value.trim();
    addPts(10);
  });
},
standWrap(s, a){
  const d = L.data, st0 = d.stand;
  log('stand', { side: d.side, sideName: d.sideName, parts: st0, original: d.originalBecause, counterShown: true, self: d.self, typingSec: d.typingSec, totalSec: d.totalSec, words: Object.fromEntries(Object.entries(st0).map(([k, v]) => [k, words(v)])) });
  L.memo['stand_d' + L.d] = { side: d.sideName, claim: d.claimText, because: st0.because };
  a.card.appendChild(frag(kick('Saved') + '<h2>Your stand</h2><dl class="dstand"><dt>I think</dt><dd>' + esc(d.claimText.replace(/^I think\s*/i, '').replace(/^(.)/, c => c.toUpperCase())) + '</dd>'
    + d.partLabels.map(([k, lab]) => '<dt>' + lab + '</dt><dd>' + esc(st0[k]) + '</dd>').join('')
    + '<dt>After hearing the other side</dt><dd>' + (d.self.choice === 'hold' ? 'I held my stand' : 'I revised my reason') + ': ' + esc(d.self.why) + '</dd></dl>'
    + '<div class="dsplit" id="dp-split"><p class="dnote">Checking how your batch split…</p></div>'
    + '<p class="dnote" style="margin-top:14px">' + (s.note || 'Stands aren’t marked. On Day 55 you’ll reread one and see how your thinking has changed.') + '</p>'));
  const day = L.d;
  finish(a).then(() => showSplit(day, d.sides));
},
wrap(s, a){
  a.card.appendChild(frag('<div class="dcenter">' + turboImg('correct', 150, 'dwrap-turbo') + '<h2>' + (L.d ? 'Day ' + L.d + ' done' : 'All set') + '</h2>' + (s.lines || []).map(l => '<p class="dtb-w" hidden>' + l + '</p>').join('') + '</div>'));
  finish(a, true);
  setTimeout(() => talkSeq(qa('.dtb-w', a.card)), 900);
},

/* Day 4: study a set of word pairs, then reread it (mode:'read') or quiz yourself on it (mode:'quiz') */
pairStudy(s, a){
  const list = '<div class="dpairs">' + s.pairs.map(p => '<div><b>' + p[0] + '</b><span>' + p[1] + '</span></div>').join('') + '</div>';
  a.card.appendChild(frag(kick(s.kicker) + '<h3>' + s.title + '</h3><p>' + s.text + '</p><p class="dtimer" id="dp-tmr">⏱ ' + s.secs + ' seconds</p>' + list));
  let t = s.secs;
  a.cont(s.btn || 'Continue', false);
  L.timer = setInterval(() => { t--; const el = qs('#dp-tmr'); if (!el) return clearInterval(L.timer); el.textContent = t > 0 ? '⏱ ' + t + ' seconds' : 'Time’s up'; if (t <= 0) { clearInterval(L.timer); a.ready(true); } }, 1000);
},
pairQuiz(s, a){
  const order = s.pairs.map((_, i) => i).sort(() => Math.random() - 0.5);
  let k = 0, right = 0;
  const show = () => {
    a.card.innerHTML = '';
    const p = s.pairs[order[k]];
    a.card.appendChild(frag(kick(s.kicker) + '<h3>' + s.title + ' (' + (k + 1) + ' of ' + s.pairs.length + ')</h3><p>What does <b class="dmono">' + p[0] + '</b> mean?</p>'
      + '<div class="drecall-in"><input id="dp-pq" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Meaning of ' + p[0] + '"></div><p id="dp-pqf" class="dnote" aria-live="polite"></p>'));
    const inp = qs('#dp-pq'); blockPaste(inp); setTimeout(() => inp.focus({ preventScroll: true }), 30);
    let checked = false;
    const go = () => {
      if (!checked) {
        checked = true; inp.disabled = true;
        const ok = norm(inp.value) === p[1];
        if (ok) { right++; sfx('softok'); } else sfx('softbad');
        qs('#dp-pqf').innerHTML = ok ? '<b class="dok">Right.</b> ' + p[0] + ' = ' + p[1] : '<b class="dbad">It’s “' + p[1] + '”.</b> Checking the answer is part of the practice.';
        actions('<button class="dbtn" id="dp-main">' + (k < s.pairs.length - 1 ? 'Next word' : 'Continue') + '</button>'); qs('#dp-main').onclick = go; qs('#dp-main').focus({ preventScroll: true });
        return;
      }
      k++;
      if (k < s.pairs.length) show();
      else { log('pairs', { set: s.set, mode: 'quiz', right, of: s.pairs.length }); addPts(right * 2); next(); }
    };
    inp.onkeydown = e => { if (e.key === 'Enter' && inp.value.trim()) { e.preventDefault(); go(); } };
    inp.oninput = () => a.ready(!!inp.value.trim());
    actions('<button class="dbtn" id="dp-main" disabled>Check</button>'); qs('#dp-main').onclick = go;
  };
  show();
},
/* test both sets: type the meaning of each word, no feedback until the end */
pairTest(s, a){
  const all = [];
  s.sets.forEach(set => set.pairs.forEach(p => all.push({ set: set.id, w: p[0], m: p[1] })));
  all.sort((x, y) => (x.w > y.w ? 1 : -1));
  a.card.appendChild(frag(kick(s.kicker || 'Test') + '<h3>' + s.title + '</h3><p>' + s.text + '</p><div class="dptest">'
    + all.map((x, i) => '<label><b class="dmono">' + x.w + '</b><input type="text" id="dp-pt' + i + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Meaning of ' + x.w + '"></label>').join('') + '</div>'));
  all.forEach((_, i) => blockPaste(qs('#dp-pt' + i)));
  a.cont('Check my answers', true, () => {
    const score = {};
    all.forEach((x, i) => { score[x.set] = (score[x.set] || 0) + (norm(qs('#dp-pt' + i).value) === x.m ? 1 : 0); });
    L.data.pairScore = score;
    log('pairs', { key: s.key, score, of: s.sets[0].pairs.length });
    L.memo.pairs = Object.assign({}, st().memo.pairs, L.memo.pairs, { [s.key]: score });
    addPts(Object.values(score).reduce((x, y) => x + y, 0) * 2);
  });
},
pairResult(s, a){
  const sc = L.data.pairScore || {}, m = Object.assign({}, st().memo.pairs, L.memo.pairs), n = s.of || 6;
  const was = s.compare && m.now ? m.now : null;
  const row = (id, lab) => '<div class="dfact"><b>' + (sc[id] ?? 0) + ' / ' + n + '</b><span>' + lab + (was ? ' (Day 4: ' + (was[id] ?? '–') + ')' : '') + '</span></div>';
  const diff = (sc.B || 0) - (sc.A || 0);
  const msg = s.compare
    ? (diff > 0 ? 'Your quizzed set held up better. That’s the testing effect, in your own data.' : diff === 0 ? 'A tie this time. In big studies, the quizzed set usually wins after a few days. One small test can go either way.' : 'Your reread set did better this time. In big studies, the quizzed set usually wins after a few days, but one person’s 12 words can go either way.')
    : (Math.abs(diff) <= 1 ? 'About the same right now. That’s normal. The difference usually shows up days later.' : diff > 0 ? 'Your quizzed set is ahead already.' : 'Your reread set is ahead right now. That’s common straight after studying. Watch what happens on Day 7.');
  a.card.appendChild(frag(kick('Your result') + '<h3>' + s.title + '</h3><div class="dfacts">' + row('A', 'Set A: you reread it') + row('B', 'Set B: you quizzed yourself') + '</div><p>' + msg + '</p>' + (s.note ? '<p class="dnote">' + s.note + '</p>' : '')));
  a.cont();
},

/* Day 6: repeated rounds against a bot, with a payoff table */
gameTheory(s, a){
  const PAY = s.payoff, me = [], them = [];
  let r = 0, mine = 0, theirs = 0;
  const botMove = () => s.bot === 'copycat' ? (me.length ? me[me.length - 1] : s.start || 'c') : s.bot === 'always-c' ? 'c' : 'd';
  const lab = k => s.moves[k];
  const table = '<table class="dpay"><caption class="sr">Points each round</caption><thead><tr><th></th><th>' + esc(s.botName) + ' ' + lab('c').toLowerCase() + 's</th><th>' + esc(s.botName) + ' ' + lab('d').toLowerCase() + 's</th></tr></thead><tbody>'
    + ['c', 'd'].map(x => '<tr><th>You ' + lab(x).toLowerCase() + '</th>' + ['c', 'd'].map(y => '<td>You ' + PAY[x + y][0] + ', ' + esc(s.botName) + ' ' + PAY[x + y][1] + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
  const draw = (msg) => {
    a.card.innerHTML = '';
    a.card.appendChild(frag(kick(s.kicker || 'Play it') + '<h3>' + s.title + '</h3><p>' + s.text + '</p>' + table
      + '<div class="dscore"><span>Round <b>' + Math.min(r + 1, s.rounds) + '</b> of ' + s.rounds + '</span><span>You <b>' + mine + '</b></span><span>' + esc(s.botName) + ' <b>' + theirs + '</b></span></div>'
      + '<div class="dhist">' + me.map((m, i) => '<span>R' + (i + 1) + ': you ' + lab(m).toLowerCase() + ', ' + esc(s.botName) + ' ' + lab(them[i]).toLowerCase() + 's</span>').join('') + '</div>'
      + (msg ? '<p class="dnote" aria-live="polite">' + msg + '</p>' : '')
      + (r < s.rounds ? '<div class="dsides two">' + ['c', 'd'].map(k => '<button class="dsidecard" data-m="' + k + '"><b>' + lab(k) + '</b><span>' + s.hint[k] + '</span></button>').join('') + '</div>' : '')));
    qa('[data-m]', a.card).forEach(b => b.onclick = () => {
      const m = b.dataset.m, t = botMove(); sfx('tap');
      me.push(m); them.push(t); mine += PAY[m + t][0]; theirs += PAY[m + t][1]; r++;
      draw('Round ' + r + ': you ' + lab(m).toLowerCase() + ', ' + s.botName + ' ' + lab(t).toLowerCase() + 's. You get ' + PAY[m + t][0] + ', ' + s.botName + ' gets ' + PAY[m + t][1] + '.');
      if (r >= s.rounds) {
        log('theory', { bot: s.bot, moves: me.join(''), botMoves: them.join(''), total: mine, botTotal: theirs });
        L.data.theory = { mine, theirs, moves: me.join('') };
        addPts(10);
        a.cont('See what happened');
        guide(s.doneGuide || 'Let’s see what Sam was doing.');
      }
    });
  };
  actions('');
  draw('');
},

/* ---------- more question types (see Mindset/Drive School — 100 Question Types.md) ---------- */

/* True/False or Myth/Fact, one card at a time. items: [statement, isTrue, why]; labels: [trueLabel, falseLabel] */
tf(s, a){
  const labs = s.labels || ['True', 'False'], n = s.items.length; let k = 0, right = 0; const t0 = Date.now();
  const show = () => {
    const it = s.items[k];
    a.card.innerHTML = '';
    a.card.appendChild(frag(kick(s.kicker || 'True or false?') + (s.title ? '<h3>' + s.title + '</h3>' : '')
      + '<div class="dtf-card"><small>' + (k + 1) + ' of ' + n + '</small><p>' + it[0] + '</p></div>'
      + '<div class="dtf-btns"><button class="dtfb yes" data-v="1">' + labs[0] + '</button><button class="dtfb no" data-v="0">' + labs[1] + '</button></div>'
      + '<p class="dnote" id="dp-tff" aria-live="polite"></p>'));
    anim(qs('.dtf-card', a.card), { opacity: [0, 1], scale: [0.94, 1] }, { duration: 0.25 });
    actions('');
    qa('.dtfb', a.card).forEach(b => b.onclick = () => {
      const ok = (b.dataset.v === '1') === !!it[1];
      if (ok) { right++; sfx('softok'); } else sfx('softbad');
      qa('.dtfb', a.card).forEach(x => { x.disabled = true; if ((x.dataset.v === '1') === !!it[1]) x.classList.add('right'); else if (x === b) x.classList.add('wrong'); });
      qs('#dp-tff').innerHTML = (ok ? '<b class="dok">Right.</b> ' : '<b class="dbad">Nope.</b> ') + it[2];
      guide(ok ? 'Yes!' : 'Not quite.', ok ? 'ok' : 'bad');
      actions('<button class="dbtn" id="dp-main">' + (k < n - 1 ? 'Next' : 'Continue') + '</button>');
      qs('#dp-main').onclick = () => {
        k++;
        if (k < n) { sfx('tap'); show(); return; }
        addPts(right * 4);
        log('attempt', { dim: s.dim || dimOf(L.track), correct: right >= n - 1, score: right, of: n, first: true, ms: Date.now() - t0, from: L.d });
        next();
      };
      qs('#dp-main').focus({ preventScroll: true });
    });
  };
  show();
},

/* pick all that apply, graded. opts: [text, correct, why] */
multiSelect(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Pick all that apply') + '<h3>' + s.q + '</h3><div class="dopts multi">' + s.opts.map((o, i) => '<button class="dopt" data-i="' + i + '" aria-pressed="false">' + o[0] + '</button>').join('') + '</div>'));
  const on = new Set(); const t0 = Date.now();
  qa('.dopt', a.card).forEach(b => b.onclick = () => { sfx('tap'); const i = +b.dataset.i; on.has(i) ? on.delete(i) : on.add(i); b.setAttribute('aria-pressed', on.has(i)); a.ready(on.size > 0); });
  a.check(() => {
    let good = 0, bad = 0;
    s.opts.forEach((o, i) => { const el = qs('.dopt[data-i="' + i + '"]', a.card); el.disabled = true; if (o[1]) { el.classList.add(on.has(i) ? 'right' : 'missed'); if (on.has(i)) good++; } else if (on.has(i)) { el.classList.add('wrong'); bad++; } });
    const need = s.opts.filter(o => o[1]).length, ok = good === need && bad === 0;
    addPts(Math.max(0, good * 4 - bad * 2));
    log('attempt', { dim: s.dim || dimOf(L.track), correct: ok, good, bad, need, first: true, ms: Date.now() - t0, from: L.d });
    feedback(ok, ok ? 'All of them. Nailed it.' : good + ' of ' + need + ' found' + (bad ? ', ' + bad + ' extra.' : '.'),
      s.opts.map(o => '<p><b>' + (o[1] ? '✓' : '✗') + '</b> ' + o[0] + ': ' + o[2] + '</p>').join('') + (s.why ? '<p>' + s.why + '</p>' : ''), a, !ok);
  });
},

/* fill the blanks from a word bank. text has {0} {1}…; answers: words; bank: extra words mixed in */
blanks(s, a){
  const words0 = s.answers.concat(s.bank || []).sort(() => Math.random() - 0.5);
  const fillv = s.answers.map(() => null);
  let i = 0;
  const html = s.text.replace(/\{(\d+)\}/g, (m, k) => '<button class="dblank" data-k="' + k + '" aria-label="Blank ' + (+k + 1) + '">&nbsp;</button>');
  a.card.appendChild(frag(kick(s.kicker || 'Fill the blanks') + '<h3>' + (s.title || 'Tap a word to fill each blank') + '</h3><p class="dblank-text">' + html + '</p>'
    + '<div class="dbank">' + words0.map((w, j) => '<button class="dchipw" data-j="' + j + '">' + w + '</button>').join('') + '</div>'));
  const draw = () => {
    qa('.dblank', a.card).forEach(b => { const v = fillv[+b.dataset.k]; b.textContent = v == null ? ' ' : words0[v]; b.classList.toggle('filled', v != null); });
    qa('.dchipw', a.card).forEach(c => { c.disabled = fillv.includes(+c.dataset.j); });
    a.ready(fillv.every(v => v != null));
  };
  qa('.dchipw', a.card).forEach(c => c.onclick = () => { const k = fillv.indexOf(null); if (k < 0) return; sfx('tap'); fillv[k] = +c.dataset.j; draw(); });
  qa('.dblank', a.card).forEach(b => b.onclick = () => { if (b.disabled) return; fillv[+b.dataset.k] = null; sfx('tap'); draw(); });
  a.check(() => {
    let n = 0;
    qa('.dblank', a.card).forEach(b => { const k = +b.dataset.k, ok = words0[fillv[k]] === s.answers[k]; if (ok) n++; b.classList.add(ok ? 'right' : 'wrong'); b.disabled = true; if (!ok) b.textContent = words0[fillv[k]] + ' → ' + s.answers[k]; });
    qa('.dchipw', a.card).forEach(c => c.disabled = true);
    addPts(n * 4);
    log('attempt', { dim: s.dim || dimOf(L.track), correct: n === s.answers.length, score: n, of: s.answers.length, first: true, from: L.d });
    feedback(n === s.answers.length, n === s.answers.length ? 'Every blank right.' : n + ' of ' + s.answers.length + ' right.', '<p>' + s.why + '</p>', a, true);
  });
},

/* rank: tap the items in order (best first). items are given in the right order and shown shuffled */
rank(s, a){
  const order = s.items.map((_, i) => i).sort(() => Math.random() - 0.5);
  if (order.every((v, i) => v === i)) order.reverse();
  const picked = [];
  a.card.appendChild(frag(kick(s.kicker || 'Rank it') + '<h3>' + s.q + '</h3><p class="dnote">' + (s.hint || 'Tap them from best to worst. Tap again to undo.') + '</p>'
    + '<div class="drank">' + order.map(i => '<button class="drk" data-i="' + i + '"><i></i><span>' + s.items[i][0] + '</span></button>').join('') + '</div>'
    + (s.ends ? '<div class="dticks"><span>⬆ ' + s.ends[0] + '</span><span>' + s.ends[1] + ' ⬇</span></div>' : '')));
  const draw = () => { qa('.drk', a.card).forEach(b => { const p = picked.indexOf(+b.dataset.i); b.querySelector('i').textContent = p < 0 ? '' : p + 1; b.classList.toggle('on', p >= 0); }); a.ready(picked.length === s.items.length); };
  qa('.drk', a.card).forEach(b => b.onclick = () => { const i = +b.dataset.i, p = picked.indexOf(i); sfx('tap'); if (p >= 0) picked.splice(p); else picked.push(i); draw(); });
  a.check(() => {
    const exact = picked.every((v, i) => v === i);
    const close = picked.filter((v, i) => Math.abs(v - i) <= 1).length;
    qa('.drk', a.card).forEach(b => { const i = +b.dataset.i; b.disabled = true; b.classList.add(picked.indexOf(i) === i ? 'right' : 'wrong'); });
    addPts(exact ? 20 : close * 2);
    log('attempt', { dim: s.dim || dimOf(L.track), correct: exact, picked, first: true, from: L.d });
    feedback(exact, exact ? 'Perfect order.' : 'Close, but not quite.', '<p><b>Best order:</b></p><ol>' + s.items.map(x => '<li>' + x[0] + (x[1] ? ': ' + x[1] : '') + '</li>').join('') + '</ol>' + (s.why ? '<p>' + s.why + '</p>' : ''), a, true);
  });
},

/* swipe sort: one card at a time, swipe (or tap) left/right. cards: [text, 0|1 (side), why]; sides: [left, right] */
swipe(s, a){
  const cards = s.cards.slice(), n = cards.length; let k = 0, right = 0; const res = [];
  a.card.appendChild(frag(kick(s.kicker || 'Swipe it') + '<h3>' + s.title + '</h3>'
    + '<div class="dswipe"><div class="dsw-side l">⬅ ' + s.sides[0] + '</div><div class="dsw-stack" id="dp-sw"></div><div class="dsw-side r">' + s.sides[1] + ' ➡</div></div>'
    + '<p class="dnote dcenter" id="dp-swn" aria-live="polite">Swipe or tap a side. ' + n + ' cards.</p>'));
  actions('<button class="dbtn ghost" id="dp-swl">⬅ ' + s.sides[0] + '</button><button class="dbtn ghost" id="dp-swr">' + s.sides[1] + ' ➡</button>');
  const stack = qs('#dp-sw');
  const decide = side => {
    const c = cards[k], ok = side === c[1], el = qs('.dsw-card', stack);
    if (ok) { right++; sfx('softok'); } else sfx('softbad');
    res.push([c, side, ok]);
    if (el) { el.classList.add(side ? 'goR' : 'goL', ok ? 'ok' : 'bad'); }
    qs('#dp-swn').innerHTML = (ok ? '<b class="dok">✓</b> ' : '<b class="dbad">✗ It’s ' + s.sides[c[1]] + '.</b> ') + c[2];
    k++;
    setTimeout(k < n ? draw : done, reduced() ? 0 : 380);
  };
  const draw = () => {
    stack.innerHTML = '<div class="dsw-card" tabindex="0"><small>' + (k + 1) + ' / ' + n + '</small><p>' + cards[k][0] + '</p></div>';
    const el = qs('.dsw-card', stack); let x0 = null, dx = 0;
    el.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; });
    el.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; el.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 18 + 'deg)'; });
    el.addEventListener('pointerup', () => { el.style.transition = ''; if (Math.abs(dx) > 70) decide(dx > 0 ? 1 : 0); else el.style.transform = ''; x0 = null; });
    el.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') decide(0); if (e.key === 'ArrowRight') decide(1); });
    anim(el, { opacity: [0, 1], scale: [0.9, 1] }, { duration: 0.2 });
  };
  const done = () => {
    addPts(right * 3);
    log('sort', { swipe: true, right, of: n, picks: res.map(r => r[1]) });
    log('attempt', { dim: s.dim || dimOf(L.track), correct: right >= n - 1, score: right, of: n, first: true, from: L.d });
    stack.innerHTML = '<div class="dsw-done"><b>' + right + ' / ' + n + '</b><span>sorted right</span></div>';
    feedback(right >= n - 1, right === n ? 'All ' + n + ' right.' : right + ' of ' + n + ' right.', res.map(([c, side, ok]) => '<p>' + (ok ? '✓' : '✗') + ' <b>' + s.sides[c[1]] + ':</b> ' + c[0] + ' ' + c[2] + '</p>').join(''), a, true);
  };
  qs('#dp-swl').onclick = () => decide(0); qs('#dp-swr').onclick = () => decide(1);
  draw();
},

/* lightning round: as many true/false as you can before the clock runs out. items: [statement, isTrue, why] */
lightning(s, a){
  const secs = s.secs || 30, items = s.items.slice().sort(() => Math.random() - 0.5), labs = s.labels || ['True', 'False'];
  let k = 0, right = 0, combo = 0, best = 0, left = secs; const miss = [];
  a.card.appendChild(frag(kick(s.kicker || '⚡ Lightning round') + '<h3>' + s.title + '</h3><p>' + (s.text || secs + ' seconds. Go fast, go with your gut.') + '</p>'
    + '<div class="dcenter"><div class="dbig">⚡</div></div>'));
  a.cont('I’m ready', true, () => false);
  qs('#dp-main').onclick = () => { sfx('go'); start(); };
  const start = () => {
    a.card.innerHTML = '<div class="dlz-top"><span class="dtimer" id="dp-lzt">⏱ ' + left + 's</span><span class="dlz-combo" id="dp-lzc"></span><span class="dtimer">✓ <b id="dp-lzs">0</b></span></div><div class="dlz-bar"><i id="dp-lzb"></i></div><div class="dtf-card" id="dp-lzq"></div>'
      + '<div class="dtf-btns"><button class="dtfb yes" data-v="1">' + labs[0] + '</button><button class="dtfb no" data-v="0">' + labs[1] + '</button></div>';
    actions('');
    qa('.dtfb', a.card).forEach(b => b.onclick = () => answer(b.dataset.v === '1'));
    show();
    L.timer = setInterval(() => { left--; const t = qs('#dp-lzt'); if (!t) return clearInterval(L.timer); t.textContent = '⏱ ' + left + 's'; qs('#dp-lzb').style.width = (left / secs * 100) + '%'; if (left <= 5) t.classList.add('hot'); if (left <= 0) end(); }, 1000);
  };
  const show = () => { const q = qs('#dp-lzq'); q.innerHTML = '<p>' + items[k % items.length][0] + '</p>'; anim(q, { opacity: [0, 1], x: [16, 0] }, { duration: 0.15 }); };
  const answer = v => {
    const it = items[k % items.length], ok = v === !!it[1];
    if (ok) { right++; combo++; best = Math.max(best, combo); sfx('softok'); } else { combo = 0; sfx('softbad'); miss.push(it); }
    qs('#dp-lzs').textContent = right; qs('#dp-lzc').textContent = combo >= 2 ? '🔥 ×' + combo : '';
    const q = qs('#dp-lzq'); q.classList.remove('ok', 'bad'); void q.offsetWidth; q.classList.add(ok ? 'ok' : 'bad');
    k++;
    if (k >= items.length) return end();
    show();
  };
  const end = () => {
    clearInterval(L.timer);
    qa('.dtfb', a.card).forEach(b => b.disabled = true);
    addPts(right * 3 + best * 2);
    log('game', { game: 'lightning', right, answered: k, of: items.length, best, secs });
    log('attempt', { dim: s.dim || 'strategy', correct: right >= Math.ceil(items.length * 0.75), score: right, of: items.length, first: true, from: L.d });
    a.card.innerHTML = '';
    a.card.appendChild(frag(kick(s.kicker || '⚡ Lightning round') + '<h3>' + (k >= items.length ? 'Cleared! ⚡' : 'Time’s up!') + '</h3>'
      + '<div class="dfacts"><div class="dfact"><b>' + right + ' / ' + k + '</b><span>right</span></div><div class="dfact"><b>🔥 ' + best + '</b><span>best streak</span></div></div>'
      + (miss.length ? '<p class="dnote"><b>Missed:</b></p>' + miss.map(it => '<p class="dnote">' + (it[1] ? labs[0] : labs[1]) + ': ' + it[0] + ' ' + it[2] + '</p>').join('') : '<p>Zero mistakes. Big brain energy. 🧠</p>')));
    guide(best >= 4 ? '🔥 ' + Math.min(best, 15) + ' in a row! +5 bonus.' : right >= k - 1 ? 'Nailed it.' : 'Nice work!', 'ok');
    a.cont();
  };
},

/* match pairs: tap a left item, then its partner on the right. pairs: [left, right] */
match(s, a){
  const n = s.pairs.length, R2 = s.pairs.map((_, i) => i).sort(() => Math.random() - 0.5);
  let sel = null, done = 0, mistakes = 0;
  a.card.appendChild(frag(kick(s.kicker || 'Match them') + '<h3>' + (s.title || 'Match each one to its partner') + '</h3>'
    + '<div class="dmatch"><div>' + s.pairs.map((p, i) => '<button class="dmt l" data-i="' + i + '">' + p[0] + '</button>').join('') + '</div><div>'
    + R2.map(i => '<button class="dmt r" data-i="' + i + '">' + s.pairs[i][1] + '</button>').join('') + '</div></div><p class="dnote dcenter" id="dp-mtn" aria-live="polite">Tap one on the left, then its match.</p>'));
  actions('');
  qa('.dmt.l', a.card).forEach(b => b.onclick = () => { if (b.disabled) return; sfx('tap'); qa('.dmt.l', a.card).forEach(x => x.classList.toggle('sel', x === b)); sel = +b.dataset.i; });
  qa('.dmt.r', a.card).forEach(b => b.onclick = () => {
    if (b.disabled || sel == null) { if (sel == null) qs('#dp-mtn').textContent = 'Pick one on the left first.'; return; }
    const lb = qs('.dmt.l[data-i="' + sel + '"]', a.card);
    if (+b.dataset.i === sel) {
      sfx('softok'); [lb, b].forEach(x => { x.disabled = true; x.classList.remove('sel'); x.classList.add('right', 'm' + (done % 6)); }); done++; sel = null;
      if (done === n) {
        addPts(Math.max(4, n * 4 - mistakes * 2));
        log('attempt', { dim: s.dim || dimOf(L.track), correct: mistakes <= 1, mistakes, of: n, first: true, from: L.d });
        guide(mistakes ? 'Yes!' : 'Spot on.', 'ok');
        qs('#dp-mtn').textContent = mistakes ? 'All matched, with ' + plural(mistakes, 'wrong try') + '.' : 'All matched, zero mistakes.';
        a.cont();
      }
    } else { mistakes++; sfx('softbad'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); qs('#dp-mtn').textContent = 'Not that one. Try again.'; }
  });
},

/* a quiz where you also bet 1–3 on being right (confidence). Same opts format as quiz */
bet(s, a){
  a.card.appendChild(frag(kick(s.kicker || 'Bet on it') + '<h3>' + s.q + '</h3><div class="dopts">' + s.opts.map((o, i) => '<button class="dopt" data-i="' + i + '" aria-pressed="false">' + o[0] + '</button>').join('') + '</div>'
    + '<div class="dbet" hidden><p><b>How sure are you?</b> Bet your points.</p><div class="dseg">' + [[1, 'Not sure · 5'], [2, 'Pretty sure · 10'], [3, 'Certain · 15']].map(([v, t]) => '<button data-b="' + v + '" aria-pressed="false">' + t + '</button>').join('') + '</div></div>'));
  let pickI = -1, b = 0; const t0 = Date.now();
  qa('.dopt', a.card).forEach(x => x.onclick = () => { pickI = +x.dataset.i; sfx('tap'); qa('.dopt', a.card).forEach(y => y.setAttribute('aria-pressed', y === x)); const bx = qs('.dbet', a.card); if (bx.hidden) { bx.hidden = false; anim(bx, { opacity: [0, 1], y: [8, 0] }, { duration: 0.2 }); } a.ready(b > 0); });
  qa('[data-b]', a.card).forEach(x => x.onclick = () => { b = +x.dataset.b; sfx('tap'); qa('[data-b]', a.card).forEach(y => y.setAttribute('aria-pressed', y === x)); a.ready(pickI >= 0); });
  a.check(() => {
    const o = s.opts[pickI], ok = !!o[1];
    qa('.dopt,[data-b]', a.card).forEach(x => x.disabled = true);
    qa('.dopt', a.card).forEach((x, i) => { if (s.opts[i][1]) x.classList.add('right'); else if (i === pickI) x.classList.add('wrong'); });
    if (ok) addPts(b * 5);
    log('attempt', { dim: s.dim || dimOf(L.track), pick: pickI, correct: ok, bet: b, first: true, ms: Date.now() - t0, from: L.d });
    const right = s.opts.find(x => x[1]);
    const msg = ok ? (b === 3 ? 'Yes! Bold and right.' : 'Yes!') : 'Not quite. Tap Why? to see it.';
    feedback(ok, msg, '<p><b>' + (ok ? 'Your answer' : 'Why not') + ':</b> ' + o[2] + '</p>' + (ok ? '' : '<p><b>Best answer:</b> ' + right[0] + '. ' + right[2] + '</p>')
      + '<p>' + (ok ? (b === 1 ? 'You were right but unsure. Trust yourself a bit more.' : 'Your confidence matched your answer.') : (b === 3 ? 'You were certain and wrong. Feeling sure isn’t the same as being right.' : 'Low bet, so low loss. Knowing when you’re unsure is a skill.')) + '</p><p>' + s.why + '</p>', a);
  });
},

/* choose-your-path story. nodes: { id: { scene, text, choices: [[label, nextId]] } }; an end node has end:true */
story(s, a){
  const path = [];
  const go = id => {
    const nd = s.nodes[id]; path.push(id);
    a.card.innerHTML = '';
    a.card.appendChild(frag(kick(s.kicker || 'Your call') + (path.length === 1 ? '<h3>' + s.title + '</h3>' : '')
      + (nd.scene ? '<div class="dvis"><div class="dvis-scene">' + nd.scene.split(' ').map((t, j) => '<span style="animation-delay:' + j * 0.12 + 's">' + t + '</span>').join('') + '</div></div>' : '')
      + '<p class="dstory">' + nd.text + '</p>'
      + (nd.end ? '' : '<div class="dopts">' + nd.choices.map((c, i) => '<button class="dopt" data-i="' + i + '">' + c[0] + '</button>').join('') + '</div>')));
    const tw = typeOut(qs('.dstory', a.card));
    if (!nd.end) qa('.dopt', a.card).forEach(x => { x.style.visibility = 'hidden'; });
    tw.done.then(() => qa('.dopt', a.card).forEach((x, j) => { x.style.visibility = ''; anim(x, { opacity: [0, 1], y: [8, 0] }, { duration: 0.2, delay: j * 0.06 }); }));
    a.card.addEventListener('click', e => { if (!e.target.closest('button')) tw.skip(); }, { once: true });
    if (nd.end) {
      log('story', { key: s.key, path, ending: id });
      addPts(10);
      guide(nd.guide || '');
      a.cont();
      return;
    }
    actions('');
    qa('.dopt', a.card).forEach(b => b.onclick = () => { sfx('select'); go(nd.choices[+b.dataset.i][1]); });
  };
  go(s.start || 'start');
},

/* estimate a number with a slider, then see the real one. Scored by how close you were */
estimate(s, a){
  const v0 = s.value != null ? s.value : Math.round((s.min + s.max) / 2);
  a.card.appendChild(frag(kick(s.kicker || 'Guess the number') + '<h3>' + s.q + '</h3><div class="dcenter"><div class="dbig" id="dp-ev">' + v0 + (s.unit || '') + '</div></div>'
    + '<input type="range" class="drange" id="dp-er" min="' + s.min + '" max="' + s.max + '" value="' + v0 + '" aria-label="Your guess">'
    + '<div class="dticks"><span>' + s.min + (s.unit || '') + '</span><span>' + s.max + (s.unit || '') + '</span></div><div id="dp-eres"></div>'));
  const r = qs('#dp-er'); let moved = false;
  r.oninput = () => { moved = true; qs('#dp-ev').textContent = r.value + (s.unit || ''); a.ready(true); };
  a.check(() => {
    const g = +r.value, off = Math.abs(g - s.answer), span = s.max - s.min, ok = off <= span * 0.1;
    r.disabled = true;
    addPts(Math.max(0, Math.round(15 * (1 - off / (span * 0.5)))));
    log('attempt', { dim: s.dim || dimOf(L.track), correct: ok, guess: g, answer: s.answer, first: true, from: L.d });
    qs('#dp-eres').innerHTML = '<div class="dfacts"><div class="dfact"><b>' + g + (s.unit || '') + '</b><span>your guess</span></div><div class="dfact"><b>' + s.answer + (s.unit || '') + '</b><span>the real answer</span></div></div>';
    feedback(ok, ok ? 'Spot on.' : 'Not quite. Tap Why? to see it.', '<p>' + s.why + '</p>', a, true);
  });
},

/* Day 8: place study sessions on a calendar before an exam (the last day). s.weeks, s.sessions. Saves L.data.cal for calendarCompare */
calendar(s, a){
  const N = (s.weeks || 4) * 7, need = s.sessions || 6, on = new Set();
  a.card.appendChild(frag(kick(s.kicker || 'Plan it') + '<h3>' + s.title + '</h3>' + (s.text ? '<p>' + s.text + '</p>' : '')
    + calGrid(N, on, false) + '<p class="dnote dcenter" id="dp-caln" aria-live="polite">0 of ' + need + ' placed</p>'));
  qa('.dcal-d[data-d]', a.card).forEach(b => b.onclick = () => {
    const d = +b.dataset.d;
    if (on.has(d)) on.delete(d); else if (on.size < need) on.add(d); else { toast('That’s all ' + need + '. Tap a day again to move it.'); return; }
    sfx('tap'); b.classList.toggle('on', on.has(d)); b.setAttribute('aria-pressed', on.has(d));
    qs('#dp-caln').textContent = on.size + ' of ' + need + ' placed'; a.ready(on.size === need);
  });
  a.cont(s.btn || 'Lock my plan', false, () => {
    const days = [...on].sort((x, y) => x - y), weeks = new Set(days.map(d => Math.ceil(d / 7))).size, late = days.filter(d => d > N - 4).length;
    L.data.cal = { days, weeks, late, N };
    log('practice', { key: 'calendar', days, weeks, last3: late, first: days[0] });
    addPts(10);
  });
},
/* your plan next to a spaced plan (s.good: the spaced days) */
calendarCompare(s, a){
  const c = L.data.cal || { days: [], weeks: 0, late: 0, N: 28 };
  const msg = c.late >= Math.ceil(c.days.length / 2) ? (c.late === c.days.length ? 'All' : 'Half or more') + ' of your sessions are in the last 3 days. That’s cramming: it feels productive, but most of it fades soon after the exam.'
    : c.weeks >= 3 ? 'Nicely spread over ' + c.weeks + ' weeks. That’s spacing, the same idea the research backs.'
    : 'Some spacing, but your sessions bunch up in ' + plural(c.weeks, 'week') + '. Starting earlier gives every review a gap to work with.';
  a.card.appendChild(frag(kick(s.kicker || 'Compare') + '<h3>' + s.title + '</h3>'
    + '<div class="dcal-two"><div><p class="dcal-cap">Your plan</p>' + calGrid(c.N, new Set(c.days), true) + '</div>'
    + '<div><p class="dcal-cap">A spaced plan</p>' + calGrid(c.N, new Set(s.good), true, 'good') + '</div></div>'
    + '<p>' + msg + '</p>' + (s.note ? '<p class="dnote">' + s.note + '</p>' : '')));
  a.cont();
},

/* quick-fire drill: tap the answer for each item, no explanations. Two drills (blocked, then mixed) feed drillResult */
drill(s, a){
  const its = s.items, n = its.length, t0 = Date.now(); let k = 0, right = 0, busy = false;
  a.card.appendChild(frag(kick(s.kicker) + '<h3>' + s.title + '</h3>' + (s.text ? '<p>' + s.text + '</p>' : '')
    + '<div class="dtf-card"><small id="dp-drn"></small><p class="dmono dcode" id="dp-drq"></p></div>'
    + '<div class="dopts ddrill">' + s.opts.map(o => '<button class="dopt" data-v="' + o + '">' + o + '</button>').join('') + '</div><p class="dnote dcenter" id="dp-drf" aria-live="polite"></p>'));
  actions('');
  const show = () => { qs('#dp-drn').textContent = (k + 1) + ' of ' + n; qs('#dp-drq').textContent = its[k][0]; qa('.dopt', a.card).forEach(b => b.classList.remove('right', 'wrong')); busy = false; };
  const end = () => {
    const secs = Math.round((Date.now() - t0) / 1000);
    L.data.drill = Object.assign({}, L.data.drill, { [s.set]: { right, n, secs } });
    log('practice', { key: 'drill', set: s.set, right, of: n, secs });
    addPts(right);
    a.card.innerHTML = '';
    a.card.appendChild(frag(kick(s.kicker) + '<h3>Round done</h3><div class="dfacts"><div class="dfact"><b>' + right + ' / ' + n + '</b><span>right</span></div><div class="dfact"><b>' + secs + 's</b><span>time taken</span></div></div>' + (s.end ? '<p>' + s.end + '</p>' : '')));
    a.cont();
  };
  qa('.dopt', a.card).forEach(b => b.onclick = () => {
    if (busy) return; busy = true;
    const it = its[k], ok = b.dataset.v === it[1];
    if (ok) { right++; sfx('softok'); } else sfx('softbad');
    b.classList.add(ok ? 'right' : 'wrong');
    qs('#dp-drf').innerHTML = ok ? '' : '<b class="dbad">' + esc(it[0]) + ' is ' + it[1] + '.</b>';
    setTimeout(() => { qs('#dp-drf').innerHTML = ''; k++; if (k < n) show(); else end(); }, ok ? 350 : 1100);
  });
  show();
},
drillResult(s, a){
  const d = L.data.drill || {}, row = (id, lab) => { const x = d[id] || {}; return '<div class="dfact"><b>' + (x.right ?? '–') + ' / ' + (x.n ?? '–') + '</b><span>' + lab + (x.secs != null ? ', ' + x.secs + 's' : '') + '</span></div>'; };
  a.card.appendChild(frag(kick('Your result') + '<h3>' + s.title + '</h3><div class="dfacts">' + s.sets.map(x => row(x[0], x[1])).join('') + '</div>' + (s.body || []).map(p => '<p>' + p + '</p>').join('')));
  a.cont();
},

/* if-then plan: two boxes. All plans from one day are kept together in memo plan_dN (a later day checks them) */
ifthen(s, a){
  const ex = s.examples || [];
  a.card.appendChild(frag(kick(s.kicker || 'Your plan') + '<h3>' + s.q + '</h3>' + (s.text ? '<p>' + s.text + '</p>' : '')
    + (ex.length ? '<p class="dnote">Stuck? Tap an example, then change it to fit your week.</p><div class="dbank">' + ex.map((e, i) => '<button class="dchipw" data-i="' + i + '">If ' + e[0] + ', then I’ll ' + e[1] + '</button>').join('') + '</div>' : '')
    + '<div class="dfield"><label for="dp-if">If…</label><input id="dp-if" type="text" autocomplete="off" placeholder="' + esc(s.ifPh || 'a time, a place or a feeling') + '"></div>'
    + '<div class="dfield"><label for="dp-then">then I’ll…</label><input id="dp-then" type="text" autocomplete="off" placeholder="' + esc(s.thenPh || 'one small, clear action') + '"></div>'
    + '<div class="dmeta"><span id="dp-itm">At least 3 words in each box.</span><span></span></div>'));
  const fi = qs('#dp-if'), ft = qs('#dp-then'); blockPaste(fi); blockPaste(ft);
  const clean = () => [fi.value.trim().replace(/^if\s+/i, '').replace(/[,.]$/, ''), ft.value.trim().replace(/^then\s+/i, '').replace(/^i(’|')?ll\s+|^i will\s+/i, '').replace(/\.$/, '')];
  let used = -1;
  const upd = () => {
    const [x, y] = clean(), copy = used >= 0 && norm(x) === norm(ex[used][0]) && norm(y) === norm(ex[used][1]);
    qs('#dp-itm').textContent = copy ? 'Change it a little so it fits your week.' : 'At least 3 words in each box.';
    a.ready(words(x) >= 3 && words(y) >= 3 && !copy);
  };
  qa('.dchipw', a.card).forEach(b => b.onclick = () => { sfx('tap'); used = +b.dataset.i; fi.value = ex[used][0]; ft.value = ex[used][1]; upd(); ft.focus(); });
  fi.oninput = upd; ft.oninput = upd;
  a.cont(s.btn || 'Save my plan', false, () => {
    const [x, y] = clean(), text = 'If ' + x + ', then I’ll ' + y + '.', k = 'plan_d' + L.d;
    L.memo[k] = (Array.isArray(L.memo[k]) ? L.memo[k] : []).concat(text);
    log('plan', { key: s.key, text, cue: x, action: y, fromExample: used >= 0, words: words(text) });
    addPts(10); sfx('select');
  });
},

/* Day 13: a shared resource game. You + 4 bots share hostel Wi-Fi for s.rounds nights; each night everyone goes light or heavy.
   Speed depends on how many go heavy; going heavy is always better for you that night, but worse for the hostel.
   The bots: when the Wi-Fi was fast, one more of them is tempted to go heavy; when it crawled, one backs off; when you went heavy, one copies you. */
commons(s, a){
  const LV = ['Fast', 'OK', 'Slow', 'Crawl'], lvOf = H => H === 0 ? 0 : H <= 2 ? 1 : H === 3 ? 2 : 3;
  const PAY = s.payoff || { l: [3, 2, 1, 0], h: [5, 4, 3, 2] }, M = (s.mates || ['Riya', 'Kabir', 'Dev', 'Asha']).length, R = s.rounds || 5;
  const hist = []; let m = s.start || 0, mine = 0, hostel = 0;
  const table = '<table class="dpay"><caption class="sr">Your points each night</caption><thead><tr><th></th>' + LV.map(l => '<th>' + l + '</th>').join('') + '</tr></thead><tbody>'
    + [['l', 'Light'], ['h', 'Heavy']].map(([k, t]) => '<tr><th>' + t + '</th>' + PAY[k].map(v => '<td>' + v + '</td>').join('') + '</tr>').join('') + '</tbody></table>'
    + '<p class="dnote">Speed: <b>Fast</b> if nobody goes heavy, <b>OK</b> with 1–2 heavy, <b>Slow</b> with 3, <b>Crawl</b> with 4–5.</p>';
  const draw = msg => {
    const r = hist.length;
    a.card.innerHTML = '';
    a.card.appendChild(frag(kick(s.kicker || 'Play it') + '<h3>' + s.title + '</h3><p>' + s.text + '</p>' + table
      + '<div class="dscore"><span>Night <b>' + Math.min(r + 1, R) + '</b> of ' + R + '</span><span>You <b>' + mine + '</b></span><span>Hostel <b>' + hostel + '</b></span></div>'
      + '<div class="dhist">' + hist.map((h, i) => '<span>N' + (i + 1) + ': you ' + (h.me === 'h' ? 'heavy' : 'light') + ', ' + h.m + ' of ' + M + ' mates heavy · ' + LV[h.lv] + '</span>').join('') + '</div>'
      + (msg ? '<p class="dnote" aria-live="polite">' + msg + '</p>' : '')
      + (r < R ? '<div class="dsides two"><button class="dsidecard" data-m="l"><b>Light</b><span>' + (s.hint ? s.hint.l : 'Chats, notes, one video in low quality.') + '</span></button><button class="dsidecard" data-m="h"><b>Heavy</b><span>' + (s.hint ? s.hint.h : 'HD streaming and big downloads all night.') + '</span></button></div>' : '')));
    qa('[data-m]', a.card).forEach(b => b.onclick = () => {
      sfx('tap');
      const me = b.dataset.m, H = m + (me === 'h' ? 1 : 0), lv = lvOf(H);
      const you = PAY[me][lv], all = you + m * PAY.h[lv] + (M - m) * PAY.l[lv];
      hist.push({ me, m, lv, you, all }); mine += you; hostel += all;
      const txt = 'Night ' + hist.length + ': ' + m + ' of ' + M + ' mates went heavy, and you went ' + (me === 'h' ? 'heavy' : 'light') + '. Wi-Fi: ' + LV[lv] + '. You get ' + you + '.';
      m = Math.max(0, Math.min(M, m + (me === 'h' ? 1 : 0) + (lv === 0 ? 1 : 0) - (lv >= 2 ? 1 : 0)));
      if (hist.length < R) { draw(txt); return; }
      draw(txt);
      log('theory', { game: 'commons', moves: hist.map(h => h.me).join(''), mates: hist.map(h => h.m), total: mine, hostel });
      L.data.commons = { mine, hostel, heavy: hist.filter(h => h.me === 'h').length };
      addPts(10);
      a.card.appendChild(frag('<div class="dfacts"><div class="dfact"><b>' + mine + '</b><span>your points</span></div><div class="dfact"><b>' + hostel + '</b><span>the whole hostel’s points</span></div><div class="dfact"><b>' + (R * 3) + ' / ' + (R * 3 * (M + 1)) + '</b><span>you / the hostel, if all 5 stayed light every night</span></div></div>'));
      a.cont('See what happened');
      guide(s.doneGuide || '');
    });
  };
  actions('');
  draw('');
},

/* mindset games inside a lesson (review days) */
gameRound(s, a){ (GAMES[s.game] || GAMES.bounceBack)(s, a); }
};
const dimOf = track => track === 'think' ? 'voice' : track === 'motivation' ? 'motivation' : 'strategy';

/* ================= mindset games ================= */
const GAMES = {
  /* Bounce Back: puzzles where failing is likely; after a miss, try again (with a hint) or skip. Tracks retries after failure. */
  bounceBack(s, a){
    const pz = s.puzzles; let k = 0, tries = 0, fails = 0, retries = 0, skips = 0, solved = 0, chances = 0;
    const draw = (msg, missed) => {
      const p = pz[k];
      a.card.innerHTML = '';
      a.card.appendChild(frag(kick(s.kicker || 'Game · Bounce Back') + '<h3>' + s.title + ' (' + (k + 1) + ' of ' + pz.length + ')</h3><p>' + p.q + '</p>'
        + (tries > 0 && p.hint ? '<p class="dnote"><b>Hint:</b> ' + p.hint + '</p>' : '')
        + '<div class="drecall-in"><input id="dp-bb" type="text" inputmode="numeric" autocomplete="off" aria-label="Your answer"' + (missed ? ' disabled' : '') + '></div>'
        + (msg ? '<p class="dnote" aria-live="polite">' + msg + '</p>' : '')));
      const inp = qs('#dp-bb');
      if (missed) {
        chances++;
        actions('<button class="dbtn ghost" id="dp-skip">Skip it</button><button class="dbtn" id="dp-again">Try again</button>');
        qs('#dp-again').onclick = () => { retries++; sfx('select'); draw(''); };
        qs('#dp-skip').onclick = () => { skips++; advance('Skipped. The answer was ' + p.a + '.'); };
        qs('#dp-again').focus({ preventScroll: true });
        return;
      }
      setTimeout(() => inp.focus({ preventScroll: true }), 30);
      const check = () => {
        if (!inp.value.trim()) return;
        tries++;
        if (inp.value.trim().replace(/\s/g, '') === String(p.a)) { solved++; sfx('correct'); addPts(10); guide(tries > 1 ? 'You came back and got it.' : 'First try!', 'ok'); advance('Right: ' + p.a + '. ' + (p.why || '')); }
        else {
          fails++; sfx('softbad'); guide('Not this time. Your call: try again or skip.', 'bad');
          if (tries >= 3) { skips++; advance('That’s 3 tries. The answer was ' + p.a + '. ' + (p.why || '')); } else draw('Not quite.', true);
        }
      };
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } };
      actions('<button class="dbtn" id="dp-main">Check</button>'); qs('#dp-main').onclick = check;
    };
    const advance = msg => {
      k++; tries = 0;
      if (k < pz.length) { draw(msg); return; }
      log('game', { game: 'bounceBack', level: s.level || 1, fails, chances, retries, skips, solved, of: pz.length });
      L.memo.bounce = { level: s.level || 1, fails, retries };
      a.card.innerHTML = '';
      a.card.appendChild(frag(kick(s.kicker || 'Game · Bounce Back') + '<h3>Round done</h3><p>' + msg + '</p><div class="dfacts"><div class="dfact"><b>' + solved + ' / ' + pz.length + '</b><span>solved</span></div><div class="dfact"><b>' + retries + '</b><span>times you tried again after a miss</span></div></div><p>' + (s.end || 'What counts here isn’t the score. It’s what you did right after a miss.') + '</p>'));
      a.cont();
    };
    draw('');
  },

  /* Safe or Stretch: each round, pick an easy question (few points) or a hard one (more points, a miss still gets a little).
     Tracks how often the student stretches, and whether they stretch again right after a miss (that's the "does" signal). */
  safeStretch(s, a){
    const rs = s.rounds, P = s.points || { safe: 5, stretch: 15, tried: 2 };
    let k = 0, picks = '', safeRight = 0, stretchRight = 0, missed = false, chances = 0, retries = 0;
    const pickRound = msg => {
      a.card.innerHTML = '';
      a.card.appendChild(frag(kick(s.kicker || 'Game · Safe or Stretch') + '<h3>' + s.title + ' (' + (k + 1) + ' of ' + rs.length + ')</h3>' + (msg ? '<p class="dnote" aria-live="polite">' + msg + '</p>' : '')
        + '<div class="dsides two"><button class="dsidecard" data-p="s"><b>🛟 Safe · ' + P.safe + '</b><span>' + (rs[k].safe.tag || 'An easy one. Very likely right.') + '</span></button>'
        + '<button class="dsidecard" data-p="t"><b>🧗 Stretch · ' + P.stretch + '</b><span>' + (rs[k].stretch.tag || 'A hard one. A miss still gets ' + P.tried + '.') + '</span></button></div>'));
      actions('');
      qa('[data-p]', a.card).forEach(b => b.onclick = () => {
        sfx('select'); const p = b.dataset.p; picks += p;
        if (missed) { chances++; if (p === 't') retries++; }
        ask(p);
      });
    };
    const ask = p => {
      const q = p === 't' ? rs[k].stretch : rs[k].safe;
      a.card.innerHTML = '';
      a.card.appendChild(frag(kick(p === 't' ? '🧗 Stretch' : '🛟 Safe') + '<h3>' + q.q + '</h3>' + (q.code ? '<pre class="dmono dcode">' + q.code + '</pre>' : '')
        + '<div class="drecall-in"><input id="dp-ss" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer"></div>'));
      const inp = qs('#dp-ss'); blockPaste(inp); setTimeout(() => inp.focus({ preventScroll: true }), 30);
      const check = () => {
        if (!inp.value.trim()) return;
        inp.disabled = true;
        const ok = [].concat(q.a).map(x => norm(String(x)).replace(/\s/g, '')).includes(norm(inp.value).replace(/\s/g, ''));
        const pts = ok ? (p === 't' ? P.stretch : P.safe) : (p === 't' ? P.tried : 0);
        addPts(pts); missed = !ok;
        if (ok) { if (p === 't') stretchRight++; else safeRight++; }
        sfx(ok ? 'correct' : 'softbad');
        guide(ok ? (p === 't' ? 'Stretch landed! +15.' : 'Yes!') : (p === 't' ? 'Missed, but you stretched. That’s how you grow.' : 'Not quite.'), ok ? 'ok' : 'bad');
        a.card.appendChild(frag('<p class="dnote" aria-live="polite">' + (ok ? '<b class="dok">Right.</b> ' : '<b class="dbad">The answer is ' + [].concat(q.a)[0] + '.</b> ') + (q.why || '') + '</p>'));
        k++;
        const last = k >= rs.length;
        actions('<button class="dbtn" id="dp-main">' + (last ? 'See my round' : 'Next round') + '</button>');
        qs('#dp-main').onclick = () => { sfx('tap'); last ? end() : pickRound(''); };
        qs('#dp-main').focus({ preventScroll: true });
      };
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); check(); } };
      inp.oninput = () => a.ready(!!inp.value.trim());
      actions('<button class="dbtn" id="dp-main" disabled>Check</button>'); qs('#dp-main').onclick = check;
    };
    const end = () => {
      const st = [...picks].filter(p => p === 't').length;
      log('game', { game: 'safeStretch', level: s.level || 1, picks, stretches: st, stretchRight, safeRight, of: rs.length, chances, retries });
      a.card.innerHTML = '';
      a.card.appendChild(frag(kick(s.kicker || 'Game · Safe or Stretch') + '<h3>Round done</h3><div class="dfacts"><div class="dfact"><b>' + st + ' / ' + rs.length + '</b><span>times you picked Stretch</span></div><div class="dfact"><b>' + (safeRight + stretchRight) + ' / ' + rs.length + '</b><span>answers right</span></div>'
        + (chances ? '<div class="dfact"><b>' + retries + ' / ' + chances + '</b><span>times you stretched right after a miss</span></div>' : '') + '</div><p>' + (s.end || '') + '</p>'));
      a.cont();
    };
    pickRound('');
  }
};

/* ================= finishing a lesson ================= */
function finish(a, quiet){
  if (L.finished) return Promise.resolve();
  L.finished = true;
  const S = st(), first = !S.done[L.d] && dayState(L.d) === 'open';
  if (first) addPts(30);
  const body = { day: L.d, cid: cid(), at: Date.now(), pts: first ? L.pts : 0, secs: Math.round((Date.now() - L.t0) / 1000), events: L.events, memo: first ? L.memo : {} };
  if (first) {
    S.done[L.d] = { at: body.at, ist: istDay(), pts: body.pts, pending: true };
    S.points += body.pts; Object.assign(S.memo, L.memo); cacheSave();
  }
  guide(first ? '+' + L.pts + ' points. Nice work.' : 'Replay done. Points count only the first time.', 'ok', null, quiet, first ? 'Nice work! Lesson done.' : null);
  sfx('fanfare'); confetti(); W3('celebrate', L.c);
  // the usual way out (next lesson / back home); after a first finish it shows only once the lesson is rated
  L.after = card => {
    const nx = nextDay(), ns = nx ? dayState(nx.d) : '';
    const extra = L.d === 0 && dayState(1) === 'open' && !st().done[1] ? '<button class="dbtn ghost" id="dp-next" data-d="1">Start Day 1</button>'
      : nx && ns === 'open' ? '<button class="dbtn ghost" id="dp-next" data-d="' + nx.d + '">Start Day ' + nx.d + '</button>' : '';
    actions(extra + '<button class="dbtn okb" id="dp-main">Back to Drive School</button>');
    qs('#dp-main').onclick = closeLesson;
    const nb = qs('#dp-next'); if (nb) nb.onclick = () => { const d = +nb.dataset.d; closeLesson(); openLesson(d); };
    const left = DAILY_MAX - firstToday();
    if (L.d > 0) {
      if (nx && ns === 'limit') card.appendChild(frag('<p class="dnote dcenter" style="margin-top:12px">That’s 3 lessons today. Day ' + nx.d + ' unlocks tomorrow.</p>'));
      else if (nx && ns === 'open') card.appendChild(frag('<p class="dnote dcenter" style="margin-top:12px">' + plural(left, 'more lesson') + ' available today.</p>'));
    }
  };
  if (first && ME) {
    rateOwed(L.d, body.secs); L.mustRate = true;
    actions('<button class="dbtn" id="dp-main">Rate today’s lesson</button>');
    qs('#dp-main').onclick = rateNow;
  } else L.after(a.card);
  // send it now; if it fails, it waits in the queue and goes on the next sync
  if (!ME) return Promise.resolve();
  return (async () => {
    const r = await api('/api/drive', Object.assign({ action: 'finish', token: ME.token }, body), 12000);
    if (r.status === 200 && r.j.ok) { applyServer(r.j.state); if (r.j.blocked && first) toast('This lesson didn’t count today. Check the unlock rules.'); }
    else if (r.status !== 400 && r.status !== 401) { queueSet(queue().concat(body)); }
    pulledAt = Date.now();
  })();
}

/* ================= end-of-lesson "11-star" rating =================
   Same idea as Brain Gym's end-of-session rating (Airbnb's 11-star exercise): 5 means "it worked", 7-11 say what great looks like,
   and the follow-up asks what would push it higher. Asked once after every first finish (not replays). Stars are required, the rest is optional.
   The student can't leave the lesson or start the next one without rating. If the tab closes first, it's asked before the next lesson.
   Answers wait in localStorage until the server has them (offline, or the finish is still queued). Server copy: /api/drive action "rate". */
const RK = 'ds_rate';
const STARS = { 11: '🛸 Turbo, start the flying car. Next stop: my dream job.', 10: '✍️ I could teach this lesson myself. Turbo wants my autograph.',
  9: '💪 Exams? Hard days? Bring it on.', 8: '📲 This lesson is going straight to my best friend.', 7: '🔥 Next lesson? I’m coming early.',
  5: '👍 It was fine. I learned a thing.', 3: '😐 Meh. My mind went for a walk.', 1: '🛑 Engine off. Waste of my time.' };
/* step 2 of the feedback sheet (feedbackSheet in index.html): one question per star choice, [icon, label, follow-up, choices].
   Each question asks what in THIS lesson led to the rating. 7-10 are saved as best, the rest as why (see fbSplit in index.html). */
const DV_SETS = {
  1: ['Ouch. What made it a waste?', [
    ['🐞', 'It didn’t work', 'What went wrong?', ['Voice didn’t play', 'Slow to load', 'A button didn’t work', 'Lost my answers']],
    ['⏳', 'Way too long', 'Which part?', ['The story', 'The questions', 'Typing answers']],
    ['😕', 'Didn’t get the point', 'What was unclear?', ['The main idea', 'The example', 'What to do next']],
    ['🎯', 'Not for me', 'Why not?', ['Too basic', 'Not my problem']]]],
  3: ['What made your mind go for a walk?', [
    ['📖', 'Too much reading', 'What would help?', ['Shorter story', 'Turbo reads it to me']],
    ['⌨️', 'Too much typing', 'What would help?', ['Tap answers', 'Fewer questions']],
    ['🔁', 'Heard it before', 'Which part?', ['The idea', 'The example', 'The tips']],
    ['🧩', 'Confusing', 'What was confusing?', ['A question', 'The story', 'What to do next']]]],
  5: ['You learned a thing. What would make it a 7?', [
    ['🏫', 'Examples from my college life', 'About what?', ['Exams', 'Hostel life', 'Friends', 'Placements']],
    ['🎮', 'More games', 'What kind?', ['Quick quiz', 'Pick a side', 'Story choices']],
    ['✂️', 'Shorter lesson', 'How short?', ['5 minutes', 'Less reading']],
    ['👥', 'See my batch’s answers', 'What would you like to see?', ['Batch answers', 'How I compare']]]],
  7: ['What’s pulling you to the next lesson?', [
    ['🏎️', 'Turbo', 'What about him?', ['His jokes', 'His voice', 'His tips']],
    ['📖', 'The stories', 'What about them?', ['They feel real', 'Want to know the next one']],
    ['🛠️', 'Tips I can use', 'Where?', ['Exams', 'Daily study', 'Friends']],
    ['🔥', 'My streak', 'What about it?', ['Don’t want to break it', 'The points']]]],
  8: ['What would you share from this lesson?', [
    ['📖', 'The story', 'Why share it?', ['Felt real', 'Made me think', 'Funny']],
    ['⚖️', 'Take a Stand', 'Why share it?', ['Good question to argue', 'Want my friend’s view']],
    ['🛠️', 'A tip', 'For what?', ['Exams', 'Habits', 'Focus']],
    ['🏎️', 'Turbo', 'What about him?', ['His jokes', 'His tips']]]],
  9: ['What made you feel ready?', [
    ['🧠', 'A new way to think', 'About what?', ['Mistakes', 'Hard work', 'Marks']],
    ['📋', 'The plan I made', 'What kind?', ['Study plan', 'If-then plan', 'Daily habit']],
    ['💪', 'A story like mine', 'How?', ['Same problem as me', 'Gave me hope']]]],
  10: ['What was the best part of today’s lesson?', [
    ['📖', 'The story', 'What made it good?', ['Felt real', 'Made me think', 'Funny']],
    ['❓', 'A question', 'What did it do?', ['Made me think', 'Changed my mind']],
    ['⚖️', 'Take a Stand', 'What did you like?', ['Picking a side', 'Seeing other views']],
    ['🏎️', 'Turbo', 'What about him?', ['His jokes', 'His voice', 'His tips']]]],
  11: ['Flying car ready! What would make Drive School legendary?', [
    ['🗣️', 'Chat with Turbo', 'About what?', ['My doubts', 'A daily check-in']],
    ['🏆', 'Real-life challenges', 'Like what?', ['7-day challenge', 'Habit tracker', 'Batch challenge']],
    ['👥', 'Learn with friends', 'How?', ['Study group', 'Live debate']],
    ['🎓', 'Hear from real people', 'Who?', ['Seniors', 'Toppers', 'People from companies']]]]
};
function rates(){ try { const q = JSON.parse(localStorage.getItem(RK)); if (q && ME && q.id === ME.id) return q.items || []; } catch (e) {} return []; }
function ratesSet(items){ try { if (items.length) localStorage.setItem(RK, JSON.stringify({ id: ME && ME.id, items })); else localStorage.removeItem(RK); } catch (e) {} }
const unrated = () => rates().find(x => !x.ans);
function rateOwed(day, secs){ if (!rates().some(x => x.day === day)) ratesSet(rates().concat({ day, secs })); }
async function sendRate(item){
  const r = await api('/api/drive', Object.assign({ action: 'rate', token: ME.token, day: item.day, secs: item.secs }, item.ans), 10000);
  if ((r.status === 200 && r.j.ok) || r.status === 400) ratesSet(rates().filter(x => x.day !== item.day));   // saved (or bad data: never resend)
}
let ratesBusy = false;
async function flushRates(){
  if (!ME || ratesBusy) return;
  ratesBusy = true;
  try { for (const x of rates().filter(x => x.ans)) await sendRate(x); } finally { ratesBusy = false; }
}
/* the rating form; box = where it goes, scroller = what scrolls to the follow-up, done(box) runs once it's answered */
function rateUI(box, day, late, done, scroller){
  box.innerHTML = '<div class="drate"></div>';
  const inner = qs('.drate', box);
  feedbackSheet(inner, {
    head: '<p class="dkicker">' + (late ? 'Before your next lesson' : 'One last thing') + '</p>' + (late ? '<p class="dnote" style="margin:0">You left Day ' + day + ' before rating it.</p>' : ''),
    scroller, accent: 'var(--d-brand-a, #7C4DFF)', label: 'Lesson rating', stars: STARS, sets: DV_SETS, product: 'dv', host: ['🏎️', 'Turbo'],
    title: 'How high does Day ' + day + ' go?', send: late ? 'Send feedback' : 'Send and finish', skip: null,
    onSend: ans => {
      const a = Object.assign(fbSplit(ans), { stars: ans.stars, more: ans.more, text: ans.text, voice: ans.voice, late: !!late });
      ratesSet(rates().map(x => x.day === day ? Object.assign(x, { ans: a }) : x));   // kept until the server has it
      const item = rates().find(x => x.day === day);
      if (ME && item) sendRate(item);
      return Promise.resolve(true);
    },
    after: () => done(box)
  });
}
/* inside the lesson, right after a first finish */
function rateNow(){
  if (!L || L.rating) return;
  L.rating = true;
  Voice.stop(); guide('');
  const stage = qs('#dp-stage'), card = document.createElement('div'); card.className = 'dcard';
  stage.innerHTML = ''; stage.appendChild(card); qs('#dp-scroll').scrollTop = 0;
  qs('#dp-fill').style.width = '100%'; qs('#dp-car').style.left = '100%';
  actions('');
  rateUI(card, L.d, false, box => { if (!L) return; L.mustRate = false; guide('Thanks! That helps a lot.', 'ok', null, true); L.after(box); }, qs('#dp-scroll'));
  anim(card, { opacity: [0, 1], y: [12, 0] }, { duration: 0.3 });
}
/* a lesson finished but not rated (tab closed): asked in a sheet. Resolves true once rated */
function rateLater(item){
  let sent = false;
  const p = openModal('<div id="dr-box"></div><button type="button" class="mclose">Not now</button>');
  rateUI(qs('#dr-box'), item.day, true, () => { sent = true; setTimeout(closeModal, 1400); }, qs('#mbox'));
  return p.then(() => {
    if (!sent) toast('Rate Day ' + item.day + ' to start your next lesson.');
    return sent;
  });
}

/* batch split for a Take a Stand day: shown only once 20+ students have answered */
async function showSplit(day, sides){
  const box = qs('#dp-split'); if (!box || !ME) return;
  const r = await api('/api/drive', { action: 'split', token: ME.token, day }, 8000);
  const el = qs('#dp-split'); if (!el) return;
  if (r.status !== 200 || !r.j.ok) { el.innerHTML = '<p class="dnote">Your batch’s split will show here once 20 students have answered.</p>'; return; }
  if (!r.j.split) { el.innerHTML = '<p class="dnote">You’re among the first to answer. Your batch’s split shows here once 20 students have picked' + (r.j.n ? ' (' + r.j.n + ' so far)' : '') + '.</p>'; return; }
  el.innerHTML = '<p class="dnote"><b>How your batch split</b> (' + r.j.n + ' students). No side is right.</p>'
    + sides.map((sd, i) => { const p = r.j.split[i] || 0; return '<div class="dbar"><span>' + esc(sd) + '</span><i style="--w:' + p + '%"></i><b>' + p + '%</b></div>'; }).join('');
}

/* ================= Drive Profile tab (My Profiles) ================= */
let profTab = 'thinking', PROF = null, profAt = 0;
function profileTab(){
  qa('[data-ptab]').forEach(b => b.setAttribute('aria-selected', b.dataset.ptab === profTab));
  const th = qs('#m-thinking'), dr = qs('#m-drive'), en = qs('#m-english'), enTab = qs('#pt-english');
  if (!th || !dr) return;
  // English Profile tab: only for batches that can open English Adda (english.js owns that panel)
  const enOn = !!(window.Adda && Adda.isOpen && Adda.isOpen());
  if (enTab) enTab.hidden = !enOn;
  if (profTab === 'english' && !enOn) { profTab = 'thinking'; qa('[data-ptab]').forEach(b => b.setAttribute('aria-selected', b.dataset.ptab === profTab)); }
  th.hidden = profTab !== 'thinking'; dr.hidden = profTab !== 'drive'; if (en) en.hidden = profTab !== 'english';
  if (profTab === 'drive') renderProfile();
  if (profTab === 'english') Adda.profile(en);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ptab]'); if (!b) return;
  profTab = b.dataset.ptab; sfx('select'); profileTab();
});
document.addEventListener('keydown', e => {
  const b = e.target.closest && e.target.closest('[data-ptab],[data-board]'); if (!b || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
  const sib = qa(b.dataset.ptab ? '[data-ptab]' : '[data-board]'); const i = sib.indexOf(b), n = sib[(i + (e.key === 'ArrowRight' ? 1 : sib.length - 1)) % sib.length];
  n.focus(); n.click();
});
const DIM = { strategy: ['Strategy', 'How you learn', TRACK.strategy.c], motivation: ['Motivation', 'How you keep going', TRACK.motivation.c], voice: ['Voice', 'How you form and say your view', TRACK.think.c] };
const ROWS = [['knows', 'Knows', 'Right answers on scenario questions'], ['does', 'Does', 'What you actually did: reviews, retries, effort on stands'], ['reflects', 'Reflects', 'Reflections, self-checks and plans']];
async function renderProfile(){
  const box = qs('#m-drive'); if (!box) return;
  const S = st(), doneN = Object.keys(S.done).filter(d => +d > 0).length;
  if (Date.now() - profAt > 30000 && ME) {
    profAt = Date.now();
    api('/api/drive', { action: 'profile', token: ME.token }).then(r => { if (r.status === 200 && r.j.ok) { PROF = r.j.profile; if (profTab === 'drive') renderProfile(); } });
  }
  const p = PROF;
  if (!S.done[7]) {
    const n = Math.min(doneN, 7);
    box.innerHTML = '<div class="card dprof-empty">' + turboImg('thinking', 120, 'dprof-turbo') + '<h2>Drive Profile</h2><p class="muted">Your profile builds as you go: Strategy, Motivation and Voice. Your first snapshot appears after Day 7.</p>'
      + '<div class="dprog big" role="progressbar" aria-label="Days done before your snapshot" aria-valuemin="0" aria-valuemax="7" aria-valuenow="' + n + '"><i style="width:' + (n / 7 * 100) + '%"></i></div><p><b>' + n + ' of 7 days done</b></p>'
      + '<button class="btn" data-go="drive">Go to Drive School</button></div>';
    return;
  }
  if (!p) { box.innerHTML = '<div class="card dprof-empty"><p class="muted">Loading your Drive Profile…</p></div>'; return; }
  const gaps = Object.entries(p.dims).filter(([, v]) => v.knows != null && v.does != null).map(([k, v]) => [k, v.knows - v.does]).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
  const head = gaps.length && Math.abs(gaps[0][1]) >= 20
    ? (gaps[0][1] > 0 ? 'In ' + DIM[gaps[0][0]][0] + ', you know more than you do yet. That gap is the thing to work on.' : 'In ' + DIM[gaps[0][0]][0] + ', you do more than your answers show. Your habits are ahead of your theory.')
    : 'What you know and what you do are close so far. Keep going to see the full picture.';
  const bar = (v, c) => v == null ? '<span class="dpnone">Not enough yet</span>' : '<span class="dpmeter"><i style="width:' + v + '%;background:' + c + '"></i></span><b>' + v + '</b>';
  box.innerHTML = '<div class="card dprof-head"><span class="dtag">' + (p.stage === 'full' ? 'Full report' : 'Week 1 snapshot') + '</span><h2>Your Drive Profile</h2><p>' + head + '</p>'
    + '<p class="small muted">Early signal from ' + plural(p.daysDone, 'day') + '. Your stands are never scored, for quality or for side.</p></div>'
    + '<div class="dprof-grid">' + Object.entries(DIM).map(([k, [name, sub, c]]) => {
      const v = p.dims[k];
      return '<div class="card dprof-card" style="--c:' + c + '"><div class="dprof-top"><b>' + name + '</b><span>' + sub + '</span></div>'
        + ROWS.map(([key, lab, hint]) => '<div class="dprow"><span title="' + esc(hint) + '">' + lab + '</span>' + bar(v[key], c) + '</div>').join('')
        + (v.type ? '<p class="dptype">' + v.type + '</p>' : '') + '</div>';
    }).join('') + '</div>'
    + '<div class="card dprof-key">' + ROWS.map(([, lab, hint]) => '<p><b>' + lab + ':</b> ' + hint + '.</p>').join('') + '</div>';
}

/* ================= Drive School leaderboard (separate from Brain Gym) ================= */
let boardMode = 'gym', DBOARD = null, dboardAt = 0;
const boardOn = () => boardMode === 'drive';
document.addEventListener('click', e => {
  const b = e.target.closest('[data-board]'); if (!b) return;
  boardMode = b.dataset.board; sfx('select');
  qa('[data-board]').forEach(x => x.setAttribute('aria-selected', x.dataset.board === boardMode));
  window.renderBoard ? window.renderBoard() : (typeof renderBoard === 'function' && renderBoard());
});
async function loadDBoard(){
  if (!ME) return;
  dboardAt = Date.now();
  const r = await api('/api/leaderboard?board=drive&pilot=' + encodeURIComponent(ME.pilot));
  if (r.status === 200 && r.j.ok) { DBOARD = r.j.rows; if (view === 'leaderboard' && boardMode === 'drive') renderBoard(); }
}
function renderBoard(){
  qa('[data-board]').forEach(x => x.setAttribute('aria-selected', x.dataset.board === boardMode));
  if (Date.now() - dboardAt > 60000) loadDBoard();
  const head = qs('.lbhead'), list = qs('#lb-list'), pod = qs('#lb-podium');
  if (!DBOARD) { head.classList.add('empty'); pod.innerHTML = ''; list.innerHTML = '<div class="lb-empty"><p class="muted">Loading Drive School…</p></div>'; return; }
  const mine = st().points;
  const all = DBOARD.map(u => u.id === ME.id ? { n: u.n, p: Math.max(u.p, mine), me: true } : { n: u.n, p: u.p });
  if (!all.some(u => u.me) && mine > 0) all.push({ n: ME.call || ME.name.split(' ')[0], p: mine, me: true });
  all.sort((x, y) => y.p - x.p);
  const coinD = p => '<span class="coin dcoin">' + ICON.star + p.toLocaleString('en-IN') + ' pt</span>';
  const ini = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const face = u => '<span style="font-size:.62em;font-weight:900">' + esc(ini(u.n)) + '</span>';
  const row = (u, rk) => '<div class="lrow' + (u.me ? ' me' : '') + '"><span class="rk">' + rk + '</span><span class="fc">' + face(u) + '</span><span class="nm">' + esc(u.n) + (u.me ? ' (you)' : '') + '</span>' + coinD(u.p) + '</div>';
  const rank = all.findIndex(u => u.me) + 1;
  const meLine = rank ? '<div class="lbme">You are #' + rank + ' of ' + all.length + ' in Drive School</div>' : '<div class="lbme">Finish a Drive School lesson to join this board.</div>';
  if (all.length < 3) {
    head.classList.add('empty'); pod.innerHTML = '';
    list.innerHTML = meLine + all.map((u, i) => row(u, i + 1)).join('') + '<p class="small muted" style="text-align:center">Only Drive School points count here. Classmates appear once they finish a lesson.</p>';
    return;
  }
  head.classList.remove('empty');
  const top = [all[1], all[0], all[2]], cls = ['', 'first', ''], blk = ['b2', 'b1', 'b3'], num = [2, 1, 3];
  pod.innerHTML = top.map((u, i) => '<div class="pcol ' + cls[i] + '"><div class="who">' + esc(u.n) + '</div><div class="face">' + face(u) + '</div>' + coinD(u.p) + '<div class="block ' + blk[i] + '">' + num[i] + '</div></div>').join('');
  list.innerHTML = meLine + all.slice(3).map((u, i) => row(u, i + 4)).join('');
}

/* ================= wiring ================= */
let askedLate = false;
function render2(){
  if (!ME) return; renderHome(); pull();
  const owed = unrated();
  if (owed && !askedLate && !L && !(typeof modalOpen === 'function' && modalOpen())) { askedLate = true; rateLater(owed); }
}
function leave(){ if (!L) Voice.stop(); /* lessons are an overlay and keep running */ }
/* on logout: forget this student's Drive state so the next login starts clean */
function reset(){ if (L) closeLesson(); Voice.stop(); DS = null; pulledAt = 0; PROF = null; profAt = 0; DBOARD = null; dboardAt = 0; const r = qs('#drive-root'); if (r) r.innerHTML = ''; }
window.Drive = { render: render2, leave, profileTab, boardOn, renderBoard, open: openLesson, reset, _state: st };
// the page's first route() ran before this file loaded
if (typeof view !== 'undefined') {
  if (view === 'drive') render2();
  if (view === 'muscles') profileTab();
}
if (typeof ME !== 'undefined' && ME) pull();
})();
