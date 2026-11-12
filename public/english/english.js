/* English Adda: a daily 15-minute English workout made of short games, inside Game Corner. Host: Yapper.
   Uses the page's helpers from index.html: ME, api, SFX, syncMute, toast, confetti, anim, reduced, W3, esc, view, openModal, closeModal.
   Server copy: /api/english (timer, streak, points, levels; only batches in ENGLISH_BATCHES can open it).
   This file keeps a local cache so the page opens instantly, and counts active seconds only while a game is running. */
(() => {
'use strict';

/* ================= config ================= */
const TZ = 'Asia/Kolkata';
const GOAL = 900, CAP = 1500;          // 15-minute goal; fresh content closes at 25 minutes (the server has the same numbers)
const IDLE_MS = 40000;                 // no tap or key for 40 s = not active
const SKILLS = [
  { k: 'voc', name: 'Vocabulary', c: '#8B5CF6' },
  { k: 'gra', name: 'Grammar',    c: '#E8407A' },
  { k: 'lis', name: 'Listening',  c: '#2BB3A3' },
  { k: 'rea', name: 'Reading',    c: '#4C6EF5' },
  { k: 'wri', name: 'Writing',    c: '#F0A43A' }
];
const LEVELS = ['First Sip', 'Regular', 'Chatter', 'Storyteller', 'Debater', 'Anchor', 'Headliner', 'Adda Legend'];
// v1 games (built: false = not playable in this release yet). Keep built: true in step with BUILT in api/_lib/english-games.js
const GAMES = [
  { id: 'groups',  name: 'Word Groups',  skill: 'voc', icon: '🧩', mins: 2, built: true, daily: true },
  { id: 'realfake',name: 'Real or Fake', skill: 'voc', icon: '🕵️', mins: 2, built: true },
  { id: 'catch',   name: 'Catch It',     skill: 'lis', icon: '🎧', mins: 2, built: false },
  { id: 'rewind',  name: 'Story Rewind', skill: 'lis', icon: '📻', mins: 3, built: false },
  { id: 'jumble',  name: 'Jumble',       skill: 'gra', icon: '🔀', mins: 2, built: true },
  { id: 'spotfix', name: 'Spot & Fix',   skill: 'gra', icon: '🔍', mins: 2, built: true },
  { id: 'reels',   name: 'Reel Reader',  skill: 'rea', icon: '📱', mins: 3, built: false },
  { id: 'vanish',  name: 'Vanish',       skill: 'rea', icon: '💨', mins: 3, built: false },
  { id: 'email',   name: 'Fix My Email', skill: 'wri', icon: '✉️', mins: 3, built: false },
  { id: 'vault',   name: 'Word Vault',   skill: 'voc', icon: '🔐', mins: 1, built: true, always: true }
];
const gameOf = id => GAMES.find(g => g.id === id);
// Everything Yapper says out loud. After ANY change here, run: python scripts/english-voice.py
/*YAPPER_LINES*/const YAPPER_LINES = {
  hello: ['Yes, I talk a lot. This is English Adda: 15 minutes a day of word games, stories and quick challenges.',
          'First, a quick warm-up so I can pick the right games for you. No marks, no pressure.'],
  rf: ['Part one: Real or Fake. Tap Real only if you know the word. Some words are made up, so don’t guess!'],
  c1: ['Part two: Fill the gaps. Each word has lost its ending. Type the missing letters.'],
  c2: ['Nice! One more short passage.'],
  catch: ['Part three: Catch it. Listen, then type exactly what you hear. Each sentence plays only once, so stay sharp!'],
  story: ['Last part! Read this quick story, then answer two questions.'],
  done: ['Done! Here’s where you start. I’ll pick your games from this.'],
  groups: ['Word Groups! Sixteen words, four hidden groups of four. You get four mistakes. Go!'],
  realfake: ['Real or Fake! Tap Real if it’s a real English word, Fake if it’s made up. Five seconds each, so be quick!'],
  jumble: ['Jumble! Tap the pieces in the right order to build the sentence.', 'Careful: one piece doesn’t belong. Leave it out.'],
  spotfix: ['Spot and Fix! Tap the part with the mistake, then pick the fix. Some sentences are already perfect, so don’t over-fix.'],
  vault: ['Word Vault time! Let’s see which of your saved words stuck.']
};/*END_YAPPER_LINES*/
const skillOf = k => SKILLS.find(s => s.k === k);

/* ================= small helpers ================= */
const qs = (s, el) => (el || document).querySelector(s);
const qa = (s, el) => [...(el || document).querySelectorAll(s)];
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const istDay = t => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t ? new Date(t) : new Date());
const sfx = name => { try { SFX.play(name); } catch (e) {} };
const mins = s => Math.floor(s / 60);
const tester = () => !!(typeof ME !== 'undefined' && ME && ME.pilot === 'DEMO');
const yap = (pose, size, cls, tip) => '<img class="' + (cls || 'eyap') + '" src="assets/yapper/yapper-' + pose + '.svg" width="' + size + '" height="' + size + '" alt="" decoding="async"' + (tip ? ' data-tip="' + tip + '" tabindex="0" role="button" aria-label="Yapper says hi"' : '') + '>';
// what Yapper says when you hover over (or tap) him. Text only, no sound.
const TIPS = {
  hi: ['Hi, I’m Yapper. Ready to play?', 'Yes, I talk a lot. Let’s play!', 'Words are my snacks. Got any?'],
  home: ['Hi, I’m Yapper. Ready to play?', '15 minutes. That’s all I ask!', 'Today’s games are picked just for you.', 'Psst… keep that streak alive 🔥'],
  done: ['Goal done! You’re on fire 🔥', 'Nice work today. Bonus round?'],
  closed: ['Adda’s closed. See you tomorrow!', 'Rest those brain cells. Back tomorrow?'],
  wait: ['Not open for you yet. Soon, promise!']
};
const ICON = {
  star: '<svg viewBox="0 0 24 24" fill="#F5B82E" aria-hidden="true"><path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.5 6.8L12 17l-5.5 3.5L8 13.7 3 9.3l6.4-.7z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};

/* ================= state: server copy + local cache ================= */
const CK = 'ea_cache', OK_KEY = 'ea_open';
let EA = null, pulledAt = 0, pulling = null;
let OPEN = null;   // true/false once the server has answered (or from the cache); null = unknown
function cacheLoad(){
  try { const c = JSON.parse(localStorage.getItem(CK)); if (c && ME && c.id === ME.id) return c.s; } catch (e) {}
  return null;
}
function cacheSave(){ try { if (ME && EA) localStorage.setItem(CK, JSON.stringify({ id: ME.id, s: EA })); } catch (e) {} }
function openLoad(){ try { const o = JSON.parse(localStorage.getItem(OK_KEY)); if (o && ME && o.id === ME.id) return o.v; } catch (e) {} return null; }
function setOpen(v){
  OPEN = v;
  try { if (ME) localStorage.setItem(OK_KEY, JSON.stringify({ id: ME.id, v })); } catch (e) {}
  const t = qs('#tab-english'); if (t) t.hidden = !v;
}
function st(){
  if (!EA) EA = cacheLoad();
  if (EA && EA.today !== istDay()) { EA.today = istDay(); EA.todaySecs = 0; EA.closed = false; pull(true); }   // a new India day
  return EA;
}
async function pull(force){
  if (!ME) return;
  if (pulling) return pulling;
  if (!force && EA && Date.now() - pulledAt < 60000) return;
  pulling = api('/api/english', { action: 'state', token: ME.token }).then(r => {
    pulling = null;
    if (r.status === 200 && r.j.ok) { EA = r.j.state; pulledAt = Date.now(); setOpen(true); cacheSave(); refresh(); }
    else if (r.status === 403) { EA = null; setOpen(false); try { localStorage.removeItem(CK); } catch (e) {} refresh(); }
  });
  return pulling;
}
function refresh(){ if (typeof view !== 'undefined' && view === 'english') render(); }

/* ================= active time ================= */
// counted only while a game or the level check is running, the tab is visible, and the student touched it in the last 40 s
let playing = false, lastAct = Date.now(), pend = 0, flushing = false, lastFlush = Date.now();
['keydown', 'pointerdown', 'input'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, true));
const todaySecs = () => { const S = st(); return (S ? S.todaySecs || 0 : 0) + pend; };
const isClosed = () => !tester() && todaySecs() >= CAP;
setInterval(() => {
  if (!playing || !ME || document.hidden || Date.now() - lastAct > IDLE_MS || typeof view === 'undefined' || view !== 'english') return;
  const before = todaySecs();
  pend++;
  const now = todaySecs();
  onSecond(now);
  if (before < GOAL && now >= GOAL) goalReached();
  if (pend >= 30 || Date.now() - lastFlush > 30000) flush();
}, 1000);
async function flush(beacon){
  if (!ME || flushing || pend <= 0) return;
  const n = Math.min(pend, 120);
  lastFlush = Date.now();
  if (beacon) {   // the tab is closing: fire and forget
    try { fetch('/api/english', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'tick', token: ME.token, secs: n }) }); } catch (e) {}
    return;
  }
  flushing = true;
  const r = await api('/api/english', { action: 'tick', token: ME.token, secs: n });
  flushing = false;
  if (r.status === 200 && r.j.ok) {
    pend = Math.max(0, pend - n);
    const S = st(); if (S) { S.todaySecs = r.j.today; S.closed = !tester() && r.j.today >= CAP; cacheSave(); }
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(true); });
window.addEventListener('pagehide', () => flush(true));
// the game player shows the ring while playing; it registers here (step 3)
let secondHook = null;
function onSecond(t){ if (secondHook) secondHook(t); }
function goalReached(){
  sfx('levelup'); try { confetti(); } catch (e) {}
  toast('🎯 Today’s 15 minutes: done! Your streak is safe.');
}

/* ================= home ================= */
function ring(t, size){
  const R = 52, C = 2 * Math.PI * R, f = Math.min(1, t / GOAL), done = t >= GOAL;
  return '<div class="ering" style="--sz:' + size + 'px" role="img" aria-label="' + mins(Math.min(t, GOAL)) + ' of 15 minutes today">'
    + '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="' + R + '" class="tr"/><circle cx="60" cy="60" r="' + R + '" class="pr" style="stroke-dasharray:' + C.toFixed(1) + ';stroke-dashoffset:' + (C * (1 - f)).toFixed(1) + '"/></svg>'
    + '<div class="c">' + (done ? '<b>✓</b><span>' + mins(t) + ' min</span>' : '<b>' + mins(t) + '</b><span>of 15 min</span>') + '</div></div>';
}
function render(){
  const root = qs('#english-root'); if (!root) return;
  if (!ME) { root.innerHTML = ''; return; }
  if (OPEN === null) OPEN = openLoad();
  const S = st();
  pull();
  if (OPEN === false) return renderNotOpen(root);
  if (!S) { root.innerHTML = '<div class="eload">' + yap('thinking', 120, 'eyap bob') + '<p>Opening the adda…</p></div>'; return; }
  if (!S.placed && !tester()) return renderWelcome(root);
  renderHome(root, S);
}
function renderNotOpen(root){
  root.innerHTML = '<section class="ewelcome"><div class="ewel-yap">' + yap('idle', 200, 'eyap bob', 'wait') + '</div><div class="ewel-talk">'
    + '<h1 class="ddisplay">English Adda</h1><p class="ewel-sub">Not open for your batch yet. Yapper is still warming up. Check back soon!</p>'
    + '<button class="ebtn ghost" data-go="home">Back to Brain Gym</button></div></section>';
}
/* the level check is required: until it's done, English Adda shows only this start screen. Yapper introduces himself here. */
function renderWelcome(root){
  root.innerHTML = '<section class="ewelcome"><div class="ewel-yap">' + yap('idle', 240, 'eyap bob', 'hi') + '</div>'
    + '<div class="ewel-talk"><span class="etag">New · English Adda</span><h1 class="ddisplay">Hey, I’m Yapper!</h1>'
    + '<div class="ebubble">' + YAPPER_LINES.hello.map(t => '<p>' + esc(t) + '</p>').join('') + '<button class="ehear" data-ehear aria-label="Hear Yapper">🔊 Hear me</button></div>'
    + '<div class="ewel-row"><button class="ebtn" data-echeck>Let’s go</button><span class="enote">About 5 minutes</span></div></div></section>';
}
function renderHome(root, S){
  const t = todaySecs(), done = t >= GOAL, closed = isClosed();
  const sk = S.streak ? S.streak.n : 0;
  let tag = 'Today’s Adda', h, p, btn;
  if (closed) { tag = 'See you tomorrow'; h = 'Adda’s closed for today'; p = 'Great work! You played ' + mins(t) + ' minutes. Your Word Vault stays open.'; btn = ''; }
  else if (!S.placed) { h = 'Find your level'; p = 'A 5-minute warm-up picks your games. Test accounts can skip it.'; btn = '<button class="ebtn" data-echeck>Start the level check</button>'; }
  else if (done) { tag = 'Goal done ✓'; h = 'Bonus rounds'; p = 'Today’s 15 minutes are done. Keep playing for bonus points, up to 25 minutes.'; btn = '<button class="ebtn" data-eplay>Play a bonus round</button>'; }
  else if (t > 0) { const n = nextGame(); h = 'Keep going'; p = Math.ceil((GOAL - t) / 60) + ' minutes left in today’s Adda.'; btn = '<button class="ebtn" data-eplay>' + (n ? 'Continue: ' + esc(gameOf(n).name) : 'Play a bonus round') + '</button>'; }
  else { h = 'Start today’s Adda'; p = '5 quick games picked for you. About 15 minutes.'; btn = '<button class="ebtn" data-eplay>Start</button>'; }
  const L = S.levels || {}, lv = SKILLS.map(s => L[s.k]).filter(Boolean);
  const overall = lv.length ? Math.round(lv.reduce((a, b) => a + b, 0) / lv.length) : null;
  root.innerHTML =
    '<div class="etop"><div><h1 class="ddisplay">English Adda</h1><p>15 minutes a day of word games, stories and quick challenges.</p>'
    + (tester() ? '<p class="etester">🧪 Test account: no daily limit, every game open.' + (S.placed ? ' <button class="elink" data-echeck>Redo the level check</button>' : '') + '</p>' : '') + '</div>'
    + '<div class="echips"><span class="echip" title="Goal days in a row">🔥 ' + plural(sk, 'day') + '</span><span class="echip" title="Adda points">' + ICON.star + ' ' + (S.points || 0).toLocaleString('en-IN') + ' pt</span>'
    + '<button class="round press mute" aria-label="Turn sound off">🔊</button></div></div>'
    + '<section class="ehero' + (closed ? ' closed' : '') + '">' + ring(t, 128)
    + '<div class="ehero-text"><span class="etag">' + tag + '</span><h2 class="ddisplay">' + esc(h) + '</h2><p>' + esc(p) + '</p>'
    + (btn ? '<div class="ehero-row">' + btn + '</div>' : '') + '</div>'
    + yap(closed ? 'idle' : done ? 'correct' : 'idle', 140, 'eyap ehero-yap', closed ? 'closed' : done ? 'done' : 'home') + '</section>'
    + '<div class="egrid"><section class="epanel"><h3>Today’s games</h3><p class="esub">' + (S.placed ? 'Picked for your level. More time goes to the skills you’re building.' : 'Your games appear after the level check.') + '</p>'
    + '<div class="esets">' + (S.placed && S.circuit && S.circuit.length ? todaySets(S).map(x => setRow(gameOf(x.id), x.done)) : GAMES.filter(g => !g.always).map(g => setRow(g))).join('') + '</div>'
    + (S.placed || tester() ? '<h3 class="evh">Always open</h3><div class="esets">' + setRow(gameOf('vault'), false, vaultLine(S)) + '</div>' : '') + '</section>'
    + '<aside class="epanel eside"><div class="eyou"><h3>Your skills</h3>'
    + (overall ? '<p class="esub">You’re <b>Level ' + overall + ': ' + LEVELS[overall - 1] + '</b>. Only you can see this.</p>' : '<p class="esub">The level check sets these. Only you can see them.</p>')
    + SKILLS.map(s => skillRow(s, L[s.k])).join('') + '</div>'
    + '<div class="erules"><h3>How it works</h3>'
    + '<p>Play <b>15 minutes a day</b> to fill your ring and keep your streak.</p>'
    + '<p>After 25 minutes, Adda closes for the day. Your Word Vault stays open.</p>'
    + '<p>No lives, no hearts. Every miss gets a hint first.</p>'
    + '<p>Your level is only yours. Nobody else sees it.</p>'
    + '<p>The leaderboard counts effort, not who is “best at English”.</p></div></aside></div>';
  syncMute();
}
function setRow(g, done, extra){
  const s = skillOf(g.skill), tag = g.built ? 'button' : 'div';
  return '<' + tag + ' class="eset' + (g.built ? ' go' : ' soon') + (done ? ' done' : '') + '"' + (g.built ? ' data-egame="' + g.id + '"' : '') + '><span class="eico" style="--c:' + s.c + '">' + g.icon + '</span>'
    + '<span class="eset-t"><b>' + esc(g.name) + '</b><small><i style="background:' + s.c + '"></i>' + s.name + ' · ' + (extra || 'about ' + g.mins + ' min' + (g.daily ? ' · daily puzzle' : '')) + '</small></span>'
    + '<span class="estate">' + (done ? '<span class="etick">' + ICON.check + '</span>' : g.built ? 'Play ›' : ICON.lock + ' Soon') + '</span></' + tag + '>';
}
function vaultLine(S){ const v = S.vault || {}; return v.total ? (v.due ? v.due + ' due now' : 'nothing due') + ' · ' + plural(v.total, 'word') + ' saved' + (v.mastered ? ' · ' + v.mastered + ' mastered' : '') : 'save words from Real or Fake'; }
function skillRow(s, lv){
  let bars = ''; for (let i = 1; i <= 8; i++) bars += '<i' + (lv && i <= lv ? ' class="on"' : '') + '></i>';
  return '<div class="eskill" style="--c:' + s.c + '"><div class="eskill-h"><b>' + s.name + '</b><span>' + (lv ? 'Lv ' + lv + ' · ' + LEVELS[lv - 1] : '?') + '</span></div><div class="ebars">' + bars + '</div></div>';
}

/* ================= Yapper's voice + listening clips ================= */
// Yapper's lines: clips recorded by scripts/english-voice.py, found by text in the manifest (off when sound is muted).
// Listening clips (Catch It) play even when muted, because hearing them is the task; their file names come from the server.
const Voice = (() => {
  let man = null, au = null, onEnd = null;
  const key = t => String(t).replace(/<[^>]*>/g, '').replace(/\s+/g, '').normalize('NFC');
  fetch('assets/english/voice/manifest.json?v=' + Date.now().toString(36).slice(0, -4)).then(r => r.ok ? r.json() : null).then(j => { man = j; }).catch(() => {});
  const muted = () => typeof SFX !== 'undefined' && SFX.muted;
  function play(src, end){
    stop();
    if (!au) { au = new Audio(); au.preload = 'auto'; }
    au.src = src; onEnd = end || null;
    au.onended = () => { const f = onEnd; onEnd = null; if (f) f('end'); };
    au.onerror = () => { const f = onEnd; onEnd = null; if (f) f('error'); };
    const p = au.play(); if (p && p.catch) p.catch(() => { const f = onEnd; onEnd = null; if (f) f('blocked'); });
  }
  function stop(){ if (au) try { au.pause(); } catch (e) {} const f = onEnd; onEnd = null; if (f) f('stop'); }
  return {
    say(text, end){ if (muted() || !man) return false; const c = man.lines[key(text)]; if (!c) return false; play('assets/english/voice/' + c.f, end); return true; },
    clip(file, end){ play('assets/english/voice/' + file, end); },
    stop
  };
})();

/* ================= "Find your level" (the level check) =================
   Four parts: Real or Fake, Fill the gaps (2 passages), Catch it (4 sentences), Quick story (2 questions).
   No marks and no right/wrong feedback during it. The server picks the second passage and the story, scores everything, and saves the levels once. */
let C = null, CP = null;
const frag = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const UNITS = 36 + 2 + 4 + 1;    // progress bar: 36 words, 2 passages, 4 sentences, 1 story
function openCheck(){
  if (!ME || CP) return;
  sfx('tap'); Voice.stop();
  CP = frag('<div class="eplayer" role="dialog" aria-modal="true" aria-label="Find your level">'
    + '<div class="ep-top"><button class="round press ep-x" aria-label="Leave the warm-up">✕</button><div class="ep-prog"><i></i></div><span class="ep-part"></span></div>'
    + '<div class="ep-body"></div></div>');
  document.body.appendChild(CP); document.body.classList.add('eplaying');
  qs('.ep-x', CP).onclick = askLeave;
  C = { done: 0, rf: [], c1: [], c2: [], catch: [], story: [], t0: Date.now(), items: null, next: null, key: null };
  Adda._play(true);
  loading('Getting your warm-up ready…');
  api('/api/english', { action: 'checkstart', token: ME.token }, 10000).then(r => {
    if (!CP) return;
    if (r.status === 409) { closeCheck(); toast('You’ve already found your level.'); pull(true); return; }
    if (r.status !== 200 || !r.j.ok) return failed(() => { closeCheck(); openCheck(); });
    C.items = r.j.items;
    intro(1, 'Real or Fake', YAPPER_LINES.rf[0], 'Start', () => rfShow(0));
  });
}
function body(){ return qs('.ep-body', CP); }
function progress(part){ if (!CP) return; qs('.ep-prog i', CP).style.width = Math.round(C.done / UNITS * 100) + '%'; if (part) qs('.ep-part', CP).textContent = 'Part ' + part + ' of 4'; }
function loading(msg){ body().innerHTML = '<div class="ep-center">' + yap('thinking', 120, 'eyap bob') + '<p class="esub">' + esc(msg) + '</p></div>'; }
function failed(retry){
  body().innerHTML = '<div class="ep-center">' + yap('oops', 120, 'eyap') + '<p class="esub">Couldn’t reach Game Corner. Check your internet.</p><button class="ebtn" id="ep-retry">Try again</button></div>';
  qs('#ep-retry', CP).onclick = () => { sfx('tap'); retry(); };
}
function intro(part, title, line, btn, go){
  progress(part); C.key = null;
  body().innerHTML = '<div class="ep-intro">' + yap('idle', 150, 'eyap bob') + '<div class="ebubble"><span class="etag">Part ' + part + ' of 4 · ' + esc(title) + '</span><p>' + esc(line) + '</p></div>'
    + '<button class="ebtn" id="ep-go">' + esc(btn) + '</button></div>';
  Voice.say(line);
  const b = qs('#ep-go', CP); b.focus(); b.onclick = () => { sfx('tap'); Voice.stop(); go(); };
}
function askLeave(){
  if (qs('.ep-confirm', CP)) return;
  sfx('tap');
  const box = frag('<div class="ep-confirm"><div class="epanel"><h3>Leave the warm-up?</h3><p class="esub">Your answers so far won’t be saved. It takes about 5 minutes from the start.</p>'
    + '<div class="ep-row"><button class="ebtn ghost sm" data-k="stay">Keep going</button><button class="ebtn sm" data-k="leave">Leave</button></div></div></div>');
  CP.appendChild(box);
  box.onclick = e => { const k = e.target.closest('[data-k]'); if (!k) return; box.remove(); if (k.dataset.k === 'leave') closeCheck(); };
}
function closeCheck(){
  if (!CP) return;
  Voice.stop(); clearTimeout(rfTimer);
  CP.remove(); CP = null; C = null;
  document.body.classList.remove('eplaying');
  Adda._play(false);
  render();
}
document.addEventListener('keydown', e => { if (CP && C && C.key && !qs('.ep-confirm', CP)) C.key(e); });

// ---- part 1: Real or Fake (5 seconds a word; no answer counts as "don't know") ----
let rfTimer = 0;
function rfShow(i){
  const words = C.items.rf;
  if (i >= words.length) { C.key = null; return intro(2, 'Fill the gaps', YAPPER_LINES.c1[0], 'Start', () => passage('c1')); }
  progress(1);
  body().innerHTML = '<div class="erf"><p class="ecount">' + (i + 1) + ' / ' + words.length + '</p>'
    + '<div class="erf-card"><b>' + esc(words[i]) + '</b></div><div class="erf-time"><i></i></div>'
    + '<div class="erf-btns"><button class="ebtn ghost" data-a="0">✗ Fake</button><button class="ebtn purple" data-a="1">✓ Real</button></div>'
    + '<p class="ehint">Not sure? Tap Fake. Guessing makes your level less accurate.</p></div>';
  const card = qs('.erf-card', CP), bar = qs('.erf-time i', CP);
  let answered = false;
  const answer = v => {
    if (answered || !C) return; answered = true; clearTimeout(rfTimer);
    C.rf[i] = v; C.done++;
    sfx(v === null ? 'tap' : 'select');
    card.classList.add(v ? 'go-r' : 'go-l');
    setTimeout(() => { if (C) rfShow(i + 1); }, 180);
  };
  qa('[data-a]', CP).forEach(b => b.onclick = () => answer(b.dataset.a === '1'));
  C.key = e => { if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'r') answer(true); else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'f') answer(false); };
  // swipe the card: right = real, left = fake
  let x0 = null;
  card.onpointerdown = e => { x0 = e.clientX; card.setPointerCapture(e.pointerId); };
  card.onpointermove = e => { if (x0 != null) card.style.transform = 'translateX(' + (e.clientX - x0) + 'px) rotate(' + ((e.clientX - x0) / 20) + 'deg)'; };
  card.onpointerup = e => { const dx = x0 == null ? 0 : e.clientX - x0; x0 = null; card.style.transform = ''; if (dx > 70) answer(true); else if (dx < -70) answer(false); };
  requestAnimationFrame(() => { bar.style.transition = 'width 5s linear'; bar.style.width = '0%'; });
  rfTimer = setTimeout(() => answer(null), 5000);
}

// ---- part 2: Fill the gaps (a C-test: type the missing end of each word) ----
function passage(which){
  const p = which === 'c1' ? C.items.c1 : C.next.c2;
  progress(2);
  let g = 0;
  const text = p.parts.map(x => x.t != null ? esc(x.t)
    : '<span class="egap">' + esc(x.stem) + '<input data-g="' + (g++) + '" maxlength="' + x.n + '" style="--n:' + x.n + '" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Missing ' + x.n + ' letters after ' + esc(x.stem) + '"></span>').join('');
  body().innerHTML = '<div class="epass"><p class="ecount">Passage ' + (which === 'c1' ? 1 : 2) + ' of 2</p><h2 class="ddisplay">Fill the gaps</h2>'
    + '<p class="esub">Type only the missing letters. The boxes show how many.</p><div class="epass-text">' + text + '</div>'
    + '<button class="ebtn" id="ep-done">Done</button></div>';
  const ins = qa('input[data-g]', CP);
  ins.forEach((el, k) => {
    el.oninput = () => { el.value = el.value.replace(/[^A-Za-z]/g, ''); if (el.value.length >= +el.maxLength && ins[k + 1]) ins[k + 1].focus(); };
    el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); (ins[k + 1] || qs('#ep-done', CP)).focus(); } if (e.key === 'Backspace' && !el.value && ins[k - 1]) { e.preventDefault(); ins[k - 1].focus(); } };
  });
  if (ins[0] && matchMedia('(pointer:fine)').matches) ins[0].focus();
  qs('#ep-done', CP).onclick = () => {
    sfx('tap');
    C[which] = ins.map(el => el.value.trim().toLowerCase());
    C.done++;
    if (which === 'c2') return intro(3, 'Catch it', YAPPER_LINES.catch[0], 'Start', () => catchShow(0));
    const go = () => {
      loading('One moment…');
      api('/api/english', { action: 'checknext', token: ME.token, rf: C.rf, c1: C.c1 }, 10000).then(r => {
        if (!CP) return;
        if (r.status !== 200 || !r.j.ok) return failed(go);
        C.next = r.j.items;
        progress(2);
        body().innerHTML = '<div class="ep-intro">' + yap('correct', 130, 'eyap bob') + '<div class="ebubble"><p>' + esc(YAPPER_LINES.c2[0]) + '</p></div><button class="ebtn" id="ep-go">Next passage</button></div>';
        Voice.say(YAPPER_LINES.c2[0]);
        qs('#ep-go', CP).onclick = () => { sfx('tap'); Voice.stop(); passage('c2'); };
      });
    };
    go();
  };
}

// ---- part 3: Catch it (hear a sentence once, type it) ----
function catchShow(i){
  const list = C.items.catch;
  if (i >= list.length) return intro(4, 'Quick story', YAPPER_LINES.story[0], 'Start', storyShow);
  progress(3);
  const it = list[i];
  let plays = 0, playing = false;
  body().innerHTML = '<div class="ecatch"><p class="ecount">Sentence ' + (i + 1) + ' of ' + list.length + '</p>'
    + '<button class="eplay" aria-label="Play the sentence"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>'
    + '<p class="esub eplays">It plays only once. Get ready…</p>'
    + '<input class="field ecatch-in" maxlength="240" placeholder="Type what you hear" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the sentence you heard">'
    + '<p class="ehint">About ' + it.words + ' words. Small spelling slips are okay.</p>'
    + '<button class="ebtn" id="ep-next" disabled>Next</button></div>';
  const btn = qs('.eplay', CP), lab = qs('.eplays', CP), inp = qs('.ecatch-in', CP), nx = qs('#ep-next', CP);
  const play = () => {
    if (playing || plays >= 1) return;
    plays++; playing = true; btn.classList.add('on');
    lab.textContent = 'Listen…';
    Voice.clip(it.clip, why => {
      playing = false; if (!CP) return;
      btn.classList.remove('on');
      if (why === 'blocked' || why === 'error') { plays--; lab.textContent = why === 'error' ? 'Couldn’t load the sound. Tap to try again.' : 'Tap to play.'; return; }
      lab.textContent = 'Done. Type what you heard.';
      btn.disabled = true; nx.disabled = false;
      inp.focus();
    });
  };
  btn.onclick = () => { sfx('tap'); play(); };
  inp.oninput = () => { if (inp.value.trim()) nx.disabled = false; };
  inp.onkeydown = e => { if (e.key === 'Enter' && !nx.disabled) nx.click(); };
  nx.onclick = () => { sfx('tap'); Voice.stop(); C.catch[i] = inp.value.trim(); C.done++; catchShow(i + 1); };
  setTimeout(() => { if (CP && !plays) play(); }, 1200);
}

// ---- part 4: Quick story (2 questions) ----
function storyShow(){
  progress(4);
  const s = C.next.story;
  body().innerHTML = '<div class="estory"><p class="ecount">Read, then answer</p><div class="estory-text">' + esc(s.text) + '</div>'
    + s.q.map((q, qi) => '<div class="eq"><b>' + (qi + 1) + '. ' + esc(q.q) + '</b><div class="eopts">'
      + q.o.map((o, oi) => '<button class="eopt" data-q="' + qi + '" data-o="' + oi + '" aria-pressed="false">' + esc(o) + '</button>').join('') + '</div></div>').join('')
    + '<button class="ebtn" id="ep-fin" disabled>Finish</button></div>';
  C.story = s.q.map(() => null);
  qa('.eopt', CP).forEach(b => b.onclick = () => {
    sfx('select');
    const qi = +b.dataset.q; C.story[qi] = +b.dataset.o;
    qa('.eopt[data-q="' + qi + '"]', CP).forEach(x => x.setAttribute('aria-pressed', x === b));
    qs('#ep-fin', CP).disabled = C.story.some(x => x === null);
  });
  qs('#ep-fin', CP).onclick = () => { sfx('tap'); C.done++; submitCheck(); };
}
function submitCheck(){
  progress(4);
  loading('Yapper is working out your level…');
  const secs = Math.round((Date.now() - C.t0) / 1000);
  api('/api/english', { action: 'checkdone', token: ME.token, rf: C.rf, c1: C.c1, c2: C.c2, catch: C.catch, story: C.story, secs }, 12000).then(r => {
    if (!CP) return;
    if (r.status !== 200 || !r.j.ok) return failed(submitCheck);
    EA = r.j.state; pulledAt = Date.now(); cacheSave();
    result(r.j.levels);
  });
}
function result(L){
  C.done = UNITS; progress(4);
  const ks = SKILLS.map(s => s.k), vals = ks.map(k => L[k]);
  const overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  const hi = Math.max(...vals), lo = Math.min(...vals);
  const best = SKILLS.filter(s => L[s.k] === hi).map(s => s.name), weak = SKILLS.filter(s => L[s.k] === lo).map(s => s.name);
  const line = hi === lo ? 'You’re even across all five skills. We’ll mix everything.'
    : 'Your strongest: <b>' + best.slice(0, 2).join(' and ') + '</b>. We’ll train <b>' + weak.slice(0, 2).join(' and ') + '</b> most.';
  body().innerHTML = '<div class="eresult">' + yap('correct', 140, 'eyap bob') + '<div class="ebubble"><p>' + esc(YAPPER_LINES.done[0]) + '</p></div>'
    + '<h2 class="ddisplay">You’re Level ' + overall + ': ' + LEVELS[overall - 1] + '</h2>'
    + '<div class="epanel eres-skills">' + SKILLS.map(s => skillRow(s, L[s.k])).join('') + '<p class="esub" style="margin:10px 0 0">' + line + ' Only you can see this.</p></div>'
    + '<button class="ebtn" id="ep-home">See today’s games</button></div>';
  Voice.say(YAPPER_LINES.done[0]);
  sfx('levelup'); try { if (!reduced()) confetti(); } catch (e) {}
  qs('#ep-home', CP).onclick = () => { sfx('tap'); closeCheck(); };
}

/* ================= the games: Word Groups, Real or Fake, Jumble, Spot & Fix, Word Vault =================
   One player shell for all of them. The server picks each round at the student's level and sends the answers along,
   so feedback is instant; points and levels come from the server, which re-scores the FIRST attempt at each item. */
let G = null, GP = null;
const newCid = () => (ME ? ME.id : 0) + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const PRAISE = ['Nice!', 'Sharp!', 'Yes!', 'Spot on!', 'Too good!', 'Easy for you!', 'Clean!'];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
const GROUP_C = ['#F5C542', '#4CC38A', '#5B8DEF', '#B07CF0'];
const GROUP_E = ['🟨', '🟩', '🟦', '🟪'];
const capFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

// today's sets in order, each marked done by counting today's finished rounds per game
function todaySets(S){
  const left = Object.assign({}, (S && S.played) || {});
  return ['groups', ...((S && S.circuit) || [])].map(id => { const done = left[id] > 0; if (done) left[id]--; return { id, done }; });
}
function nextGame(){
  const S = st(); if (!S) return null;
  const n = todaySets(S).find(x => !x.done && gameOf(x.id) && gameOf(x.id).built);
  if (n) return n.id;
  return S.vault && S.vault.due > 0 ? 'vault' : null;
}
// after the 5 sets: bonus rounds lean towards the weaker skill
function bonusGame(){
  const S = st(), L = (S && S.levels) || {};
  const sets = GAMES.filter(g => g.built && !g.daily && !g.always).sort((a, b) => ((L[a.skill] || 1) - (L[b.skill] || 1)) || (Math.random() - 0.5));
  return sets.length ? sets[Math.floor(Math.random() * Math.min(2, sets.length))].id : null;
}
function startNext(){
  if (isClosed()) { toast('Adda’s closed for today. Your Word Vault is still open.'); return; }
  openGame(nextGame() || bonusGame());
}

const pb = () => qs('.ep-body', GP);
function gprog(f){ if (GP) qs('.ep-prog i', GP).style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; }
function gload(msg){ pb().innerHTML = '<div class="ep-center">' + yap('thinking', 120, 'eyap bob') + '<p class="esub">' + esc(msg) + '</p></div>'; }
function gfail(msg, retry){
  pb().innerHTML = '<div class="ep-center">' + yap('oops', 120, 'eyap') + '<p class="esub">' + esc(msg || 'Couldn’t reach Game Corner. Check your internet.') + '</p>'
    + '<div class="ep-row">' + (retry ? '<button class="ebtn" id="eg-retry">Try again</button>' : '') + '<button class="ebtn ghost" id="eg-close">Close</button></div></div>';
  if (retry) qs('#eg-retry', GP).onclick = () => { sfx('tap'); retry(); };
  qs('#eg-close', GP).onclick = () => { sfx('tap'); closeGame(); };
}
// Yapper's corner bubble: hints, the "why", praise. Spoken only if a clip exists (fixed lines); the rest is text.
function say(html, pose){
  if (!GP) return;
  const box = qs('.ep-yapper', GP); box.hidden = false;
  qs('.ep-yapper img', GP).src = 'assets/yapper/yapper-' + (pose || 'idle') + '.svg';
  const s = qs('.ep-say', GP); s.innerHTML = html; box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
}
function hush(){ if (GP) qs('.ep-yapper', GP).hidden = true; }
function addPts(){ /* shown at the end; the server decides the real number */ }
function timeLabel(t){ if (!GP) return; const el = qs('.ep-time', GP); if (el) el.textContent = mins(Math.min(t, 5999)) + ' / 15 min'; }

function openGame(game, opt){
  opt = opt || {};
  const g = gameOf(game);
  if (!ME || GP || CP || !g || !g.built) return;
  sfx('tap'); Voice.stop(); hideTip();
  GP = frag('<div class="eplayer eg" role="dialog" aria-modal="true" aria-label="' + esc(g.name) + '">'
    + '<div class="ep-top"><button class="round press ep-x" aria-label="Leave this round">✕</button><div class="ep-prog"><i></i></div><span class="ep-time"></span></div>'
    + '<div class="ep-body"></div>'
    + '<div class="ep-yapper" hidden aria-live="polite">' + yap('idle', 64, 'eyap') + '<div class="ep-say"></div></div></div>');
  document.body.appendChild(GP); document.body.classList.add('eplaying');
  qs('.ep-x', GP).onclick = askLeaveGame;
  G = { game, opt, cid: newCid(), t0: Date.now(), ids: [], ans: [], tries: [], ms: [], combo: 0, missed: [], timer: 0 };
  Adda._play(true, timeLabel); timeLabel(todaySecs());
  gload('Getting your round ready…');
  const req = game === 'vault' ? { action: 'vault', op: 'get', token: ME.token } : { action: 'roundstart', game, token: ME.token, lv: opt.lv, n: opt.n };
  const go = () => api('/api/english', req, 10000).then(r => {
    if (!GP || !G) return;
    if (r.status === 409) { closeGame(); toast('Do the level check first.'); return; }
    if (r.status !== 200 || !r.j.ok) return gfail(null, () => { gload('Trying again…'); go(); });
    if (r.j.closed) return gfail('Adda’s closed for today. Great work! Your Word Vault is still open.');
    if (r.j.already) return gfail('You’ve done today’s Word Groups. A new puzzle comes tomorrow!');
    G.round = r.j.round || { quiz: r.j.quiz };
    gintro(game);
  });
  go();
}
function gintro(game){
  const g = gameOf(game), lines = YAPPER_LINES[game] || [];
  const extra = game === 'jumble' && G.round.lv >= 4 ? lines[1] : '';
  const sub = game === 'groups' && G.round.items ? 'Puzzle #' + G.round.items[0].n : game === 'vault' ? plural(G.round.quiz.length, 'word') + ' to review' : 'Level ' + G.round.lv + ' · ' + LEVELS[G.round.lv - 1];
  pb().innerHTML = '<div class="ep-intro">' + yap('idle', 140, 'eyap bob') + '<div class="ebubble"><span class="etag">' + g.icon + ' ' + esc(g.name) + ' · ' + esc(sub) + '</span>'
    + '<p>' + esc(lines[0] || '') + '</p>' + (extra ? '<p>' + esc(extra) + '</p>' : '') + '</div><button class="ebtn" id="eg-go">Start</button></div>';
  Voice.say(lines[0], why => { if (why === 'end' && extra) Voice.say(extra); });
  const b = qs('#eg-go', GP); b.focus();
  b.onclick = () => { sfx('go'); Voice.stop(); G.t0 = Date.now(); ({ realfake: rfGame, jumble: jbGame, spotfix: sfGame, groups: grGame, vault: vaultGame })[game](); };
}
function askLeaveGame(){
  if (!GP || qs('.ep-confirm', GP)) return;
  sfx('tap');
  const box = frag('<div class="ep-confirm"><div class="epanel"><h3>Leave this round?</h3><p class="esub">This round won’t be saved.</p>'
    + '<div class="ep-row"><button class="ebtn ghost sm" data-k="stay">Keep playing</button><button class="ebtn sm" data-k="leave">Leave</button></div></div></div>');
  GP.appendChild(box);
  box.onclick = e => { const k = e.target.closest('[data-k]'); if (!k) return; box.remove(); if (k.dataset.k === 'leave') closeGame(); };
}
function closeGame(){
  if (!GP) return;
  Voice.stop(); if (G) clearTimeout(G.timer);
  GP.remove(); GP = null; G = null;
  document.body.classList.remove('eplaying');
  Adda._play(false);
  render();
}
document.addEventListener('keydown', e => {
  if (!GP || !G || qs('.ep-confirm', GP)) return;
  if (e.key === 'Escape') return askLeaveGame();
  if (G.key) G.key(e);
});
const nextBtn = (label, fn) => { const b = qs('#eg-next', GP); b.textContent = label || 'Next'; b.hidden = false; b.disabled = false; b.focus({ preventScroll: true }); b.onclick = () => { sfx('tap'); fn(); }; };

/* ---- Real or Fake: 20 words, 5 seconds each ---- */
function rfGame(){
  const items = G.round.items; G.ids = items.map(x => x.id);
  const step = i => {
    hush();
    if (i >= items.length) return finish();
    gprog(i / items.length);
    const it = items[i];
    pb().innerHTML = '<div class="erf"><p class="ecount">' + (i + 1) + ' / ' + items.length + (G.combo >= 3 ? ' · 🔥 ' + G.combo : '') + '</p>'
      + '<div class="erf-card"><b>' + esc(it.w) + '</b></div><div class="erf-time"><i></i></div>'
      + '<p class="erf-fb" aria-live="polite"></p>'
      + '<div class="erf-btns"><button class="ebtn ghost" data-a="0">✗ Fake</button><button class="ebtn purple" data-a="1">✓ Real</button></div></div>';
    const card = qs('.erf-card', GP), bar = qs('.erf-time i', GP), fb = qs('.erf-fb', GP);
    const t0 = Date.now(); let done = false;
    const answer = v => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      G.ans[i] = v; G.tries[i] = 1; G.ms[i] = Date.now() - t0;
      const right = v === it.real;
      G.combo = right ? G.combo + 1 : 0;
      if (it.real && !right) G.missed.push(it.w);
      card.classList.add(right ? 'ok' : 'bad');
      qa('.erf-btns .ebtn', GP).forEach(b => b.disabled = true);
      bar.style.transition = 'none';
      sfx(right ? (G.combo >= 3 ? 'combo' : 'correct') : v === null ? 'softbad' : 'wrong');
      fb.innerHTML = (v === null ? '⏱ Time’s up. ' : right ? '✓ ' : '✗ ') + (it.real ? '<b>' + esc(it.w) + '</b> is real' + (it.m ? ': ' + esc(it.m) : '.') : '<b>' + esc(it.w) + '</b> is made up.');
      fb.className = 'erf-fb ' + (right ? 'ok' : 'bad');
      G.timer = setTimeout(() => step(i + 1), right ? 1100 : 2600);
      card.onclick = () => { clearTimeout(G.timer); step(i + 1); };
    };
    qa('[data-a]', GP).forEach(b => b.onclick = () => answer(b.dataset.a === '1'));
    G.key = e => { if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'r') answer(true); else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'f') answer(false); };
    let x0 = null;
    card.onpointerdown = e => { if (done) return; x0 = e.clientX; card.setPointerCapture(e.pointerId); };
    card.onpointermove = e => { if (x0 != null) card.style.transform = 'translateX(' + (e.clientX - x0) + 'px) rotate(' + ((e.clientX - x0) / 20) + 'deg)'; };
    card.onpointerup = e => { const dx = x0 == null ? 0 : e.clientX - x0; x0 = null; card.style.transform = ''; if (dx > 70) answer(true); else if (dx < -70) answer(false); };
    requestAnimationFrame(() => { bar.style.transition = 'width 5s linear'; bar.style.width = '0%'; });
    G.timer = setTimeout(() => answer(null), 5000);
  };
  step(0);
}

/* ---- Jumble: tap the pieces into order (8 sentences); a hint after the first miss, the answer after the second ---- */
function jbGame(){
  const items = G.round.items; G.ids = items.map(x => x.id);
  const step = i => {
    hush(); G.key = null;
    if (i >= items.length) return finish();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now();
    let placed = [], tries = 0, over = false;
    pb().innerHTML = '<div class="ejb"><p class="ecount">Sentence ' + (i + 1) + ' of ' + items.length + (G.combo >= 2 ? ' · 🔥 ' + G.combo + ' in a row' : '') + '</p>'
      + '<div class="ejb-line" aria-label="Your sentence"></div><div class="ejb-bank" aria-label="Pieces"></div>'
      + (it.x ? '<p class="ehint">One piece doesn’t belong. Leave it out.</p>' : '<p class="ehint">Tap the pieces in order. Tap a placed piece to send it back.</p>')
      + '<div class="ep-row"><button class="ebtn" id="eg-check" disabled>Check</button><button class="ebtn" id="eg-next" hidden>Next</button></div></div>';
    const line = qs('.ejb-line', GP), bank = qs('.ejb-bank', GP), chk = qs('#eg-check', GP);
    const draw = () => {
      line.innerHTML = placed.map((k, p) => '<button class="echunk in" data-p="' + p + '">' + esc(p === 0 ? capFirst(it.chunks[k]) : it.chunks[k]) + '</button>').join('')
        + (placed.length < it.n ? '<span class="eslot"></span>'.repeat(Math.min(3, it.n - placed.length)) : '<span class="ejb-end">' + esc(it.end) + '</span>');
      bank.innerHTML = it.chunks.map((c, k) => placed.includes(k) ? '<span class="echunk ghost">' + esc(c) + '</span>' : '<button class="echunk" data-k="' + k + '">' + esc(c) + '</button>').join('');
      chk.disabled = over || placed.length !== it.n;
    };
    line.onclick = e => { const b = e.target.closest('[data-p]'); if (!b || over) return; sfx('tap'); placed.splice(+b.dataset.p, 1); line.classList.remove('bad'); draw(); };
    bank.onclick = e => { const b = e.target.closest('[data-k]'); if (!b || over || placed.length >= it.n) return; sfx('select'); placed.push(+b.dataset.k); line.classList.remove('bad'); draw(); };
    const show = (o, cls) => { line.innerHTML = '<span class="ejb-done ' + cls + '">' + esc(capFirst(o.join(' ')) + it.end) + '</span>'; bank.innerHTML = ''; };
    chk.onclick = () => {
      const got = placed.map(k => it.chunks[k]);
      tries++; if (tries === 1) G.ans[i] = got; G.tries[i] = tries; G.ms[i] = Date.now() - t0;
      const ok = it.orders.some(o => o.join(' | ') === got.join(' | '));
      if (ok) {
        over = true; G.combo = tries === 1 ? G.combo + 1 : 0;
        sfx(G.combo >= 3 ? 'combo' : 'correct'); show(got, 'ok');
        say((tries === 1 ? praise() : 'Got it!') + (G.combo >= 3 ? ' 🔥 ' + G.combo + ' in a row.' : ''), 'correct');
      } else if (tries === 1) {
        sfx('wrong'); line.classList.add('bad'); draw();
        say('<b>Hint:</b> ' + esc(it.hint), 'thinking');
        return;
      } else {
        over = true; G.combo = 0; sfx('softbad'); show(it.orders[0], 'shown');
        say(esc(it.why), 'oops');
      }
      chk.hidden = true; nextBtn(i + 1 < items.length ? 'Next' : 'Finish', () => step(i + 1));
    };
    G.key = e => { if (e.key === 'Enter' && !chk.disabled && !chk.hidden) chk.click(); };
    draw();
  };
  step(0);
}

/* ---- Spot & Fix: tap the wrong part (or "No error"), then choose the fix ---- */
function sfGame(){
  const items = G.round.items; G.ids = items.map(x => x.id);
  const step = i => {
    hush(); G.key = null;
    if (i >= items.length) return finish();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now();
    let tries = 0, stage = 'find';
    G.ans[i] = { p: null, f: null };
    pb().innerHTML = '<div class="esf"><p class="ecount">Sentence ' + (i + 1) + ' of ' + items.length + '</p>'
      + (it.ctx === 'formal' ? '<span class="esf-ctx">📧 In a formal email or interview</span>' : '')
      + '<div class="esf-s">' + it.parts.map((p, k) => '<button class="esf-part" data-p="' + k + '">' + esc(p) + '</button>').join(' ') + '</div>'
      + '<button class="ebtn ghost sm esf-none" data-p="-1">✓ No error</button>'
      + '<div class="esf-fixes" hidden></div>'
      + '<p class="ehint esf-tell">Tap the part with the mistake. Or tap “No error”.</p>'
      + '<div class="ep-row"><button class="ebtn" id="eg-next" hidden>Next</button></div></div>';
    const fixesEl = qs('.esf-fixes', GP), tell = qs('.esf-tell', GP);
    const partEl = k => qs('.esf-part[data-p="' + k + '"]', GP);
    const lock = () => qa('.esf-part,.esf-none', GP).forEach(b => b.disabled = true);
    const fixed = f => { const el = partEl(it.err); el.innerHTML = esc(it.parts[it.err].replace(it.bad, it.fixes[f])); };
    const done = () => { lock(); tell.hidden = true; G.ms[i] = Date.now() - t0; nextBtn(i + 1 < items.length ? 'Next' : 'Finish', () => step(i + 1)); };
    const reveal = () => {
      sfx('softbad');
      if (it.err == null) { qs('.esf-none', GP).classList.add('right'); say('This one had <b>no error</b>. ' + esc(it.why), 'oops'); }
      else { partEl(it.err).classList.add('right'); fixed(it.ans); say('Fix: <b>' + esc(it.fixes[it.ans]) + '</b>. ' + esc(it.why), 'oops'); }
      done();
    };
    qa('.esf-part,.esf-none', GP).forEach(b => b.onclick = () => {
      if (stage !== 'find') return;
      const p = +b.dataset.p; tries++; G.tries[i] = tries;
      if (G.ans[i].p === null) G.ans[i].p = p;
      const right = it.err == null ? p === -1 : p === it.err;
      if (right && it.err == null) { sfx('correct'); b.classList.add('right'); say((tries === 1 ? praise() + ' ' : '') + 'No error here. ' + esc(it.why), 'correct'); return done(); }
      if (right) {
        sfx('select'); b.classList.add('found'); stage = 'fix'; lock();
        tell.textContent = 'Found it! Now pick the fix.'; hush();
        fixesEl.hidden = false;
        fixesEl.innerHTML = it.fixes.map((f, k) => '<button class="eopt" data-f="' + k + '">' + esc(f) + '</button>').join('');
        qa('[data-f]', fixesEl).forEach(fb => fb.onclick = () => {
          if (stage !== 'fix') return; stage = 'done';
          const f = +fb.dataset.f; G.ans[i].f = f;
          qa('[data-f]', fixesEl).forEach(x => { x.disabled = true; if (+x.dataset.f === it.ans) x.classList.add('right'); });
          fixed(it.ans); partEl(it.err).classList.add('right');
          if (f === it.ans) { sfx('correct'); say((tries === 1 ? praise() + ' ' : '') + esc(it.why), 'correct'); }
          else { fb.classList.add('bad'); sfx('wrong'); say('Better: <b>' + esc(it.fixes[it.ans]) + '</b>. ' + esc(it.why), 'oops'); }
          done();
        });
        return;
      }
      b.classList.add('miss'); setTimeout(() => b.classList.remove('miss'), 500);
      if (tries === 1) { sfx('wrong'); say('<b>Hint:</b> ' + esc(it.hint), 'thinking'); }
      else { stage = 'done'; reveal(); }
    });
  };
  step(0);
}

/* ---- Word Groups: 16 words, 4 groups of 4, 4 mistakes allowed ---- */
function grGame(){
  const P = G.round.items[0]; G.ids = [P.id]; G.ans = [[]]; G.tries = [0];
  let left = P.words.slice(), sel = new Set(), solved = [], miss = 0, out = false;
  const t0 = Date.now(), tried = new Set();
  gprog(0);
  pb().innerHTML = '<div class="egr"><p class="ecount">Puzzle #' + P.n + ' · find 4 groups of 4</p><div class="egr-solved"></div><div class="egr-grid"></div>'
    + '<div class="egr-miss" aria-label="Mistakes left"></div>'
    + '<div class="ep-row egr-ctl"><button class="ebtn ghost sm" id="egr-mix">Shuffle</button><button class="ebtn ghost sm" id="egr-clear">Deselect</button><button class="ebtn sm" id="egr-go" disabled>Submit</button></div>'
    + '<div class="ep-row"><button class="ebtn" id="eg-next" hidden>Next</button></div></div>';
  const grid = qs('.egr-grid', GP), sol = qs('.egr-solved', GP), go = qs('#egr-go', GP);
  const groupOf = w => P.groups.findIndex(g => g.words.includes(w));
  const draw = () => {
    sol.innerHTML = solved.map(gi => { const g = P.groups[gi]; return '<div class="egr-row" style="--g:' + GROUP_C[gi] + '"><b>' + esc(g.name) + '</b><span>' + g.words.map(esc).join(', ') + '</span></div>'; }).join('');
    grid.innerHTML = left.map(w => '<button class="egr-tile' + (sel.has(w) ? ' on' : '') + '" data-w="' + esc(w) + '" aria-pressed="' + sel.has(w) + '">' + esc(w) + '</button>').join('');
    qs('.egr-miss', GP).innerHTML = 'Mistakes left: ' + '<i></i>'.repeat(Math.max(0, 4 - miss)) + '<i class="off"></i>'.repeat(Math.min(4, miss));
    go.disabled = out || sel.size !== 4;
    gprog(solved.length / 4);
  };
  grid.onclick = e => {
    const b = e.target.closest('[data-w]'); if (!b || out) return;
    const w = b.dataset.w;
    if (sel.has(w)) sel.delete(w); else if (sel.size < 4) sel.add(w); else return;
    sfx('select'); draw();
  };
  qs('#egr-mix', GP).onclick = () => { sfx('whoosh'); for (let i = left.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [left[i], left[j]] = [left[j], left[i]]; } draw(); };
  qs('#egr-clear', GP).onclick = () => { sfx('tap'); sel.clear(); draw(); };
  const end = win => {
    out = true; qs('.egr-ctl', GP).hidden = true; grid.innerHTML = '';
    G.tries[0] = G.ans[0].length; G.ms[0] = Date.now() - t0; G.share = 'English Adda #' + P.n + '\n' + G.ans[0].map(gs => gs.map(w => GROUP_E[groupOf(w)]).join('')).join('\n');
    if (win) { sfx('fanfare'); say((miss ? 'Solved!' : 'Perfect, no mistakes!') + ' 🎉', 'correct'); try { if (!reduced()) confetti(); } catch (e) {} }
    nextBtn('See result', () => finish());
  };
  // out of mistakes: reveal the remaining groups one at a time, each with its "why"
  const revealNext = () => {
    const gi = P.groups.findIndex((g, k) => !solved.includes(k));
    if (gi < 0) return end(false);
    solved.push(gi); left = left.filter(w => !P.groups[gi].words.includes(w)); sel.clear();
    sfx('reveal'); draw(); say('<b>' + esc(P.groups[gi].name) + ':</b> ' + esc(P.groups[gi].why), 'thinking');
    if (solved.length < 4) nextBtn('Show next group', revealNext); else nextBtn('See result', () => end(false));
  };
  go.onclick = () => {
    const guess = [...sel], key = guess.slice().sort().join('|');
    if (tried.has(key)) { toast('You already tried that one.'); return; }
    tried.add(key); G.ans[0].push(guess);
    const gi = P.groups.findIndex((g, k) => !solved.includes(k) && guess.every(w => g.words.includes(w)));
    if (gi >= 0) {
      solved.push(gi); left = left.filter(w => !guess.includes(w)); sel.clear();
      sfx('correct'); draw(); say('<b>' + esc(P.groups[gi].name) + '.</b> ' + esc(P.groups[gi].why), 'correct');
      if (solved.length === 4) end(true);
      return;
    }
    miss++;
    const close = P.groups.some((g, k) => !solved.includes(k) && guess.filter(w => g.words.includes(w)).length === 3);
    sfx('wrong'); grid.classList.add('shake'); setTimeout(() => grid.classList.remove('shake'), 450);
    draw();
    if (miss >= 4) { out = true; go.disabled = true; qs('.egr-ctl', GP).hidden = true; say('Out of tries. No stress, here are the groups.', 'oops'); nextBtn('Show the groups', revealNext); }
    else say(close ? 'So close! <b>One away.</b>' : 'Not a group. Try another mix.', 'thinking');
  };
  draw();
}

/* ---- Word Vault: review saved words (meaning → word, word → meaning, fill the gap) ---- */
function vaultGame(){
  const quiz = G.round.quiz || [];
  if (!quiz.length) {
    pb().innerHTML = '<div class="ep-center">' + yap('idle', 120, 'eyap bob') + '<h2 class="ddisplay">Your vault is clear</h2><p class="esub">No words due right now. Words you miss in Real or Fake can be saved here, and they come back on a smart schedule.</p><button class="ebtn" id="eg-close">Back to Adda</button></div>';
    qs('#eg-close', GP).onclick = () => { sfx('tap'); closeGame(); };
    return;
  }
  G.results = [];
  const step = i => {
    hush();
    if (i >= quiz.length) return finishVault();
    gprog(i / quiz.length);
    const q = quiz[i];
    const ask = q.fmt === 'w2m' ? 'What does <b class="evw">' + esc(q.q) + '</b> mean?' : q.fmt === 'gap' ? 'Which word fits the gap?' : 'Which word means…';
    const big = q.fmt === 'w2m' ? '' : '<div class="evq">' + (q.fmt === 'gap' ? esc(q.q).replace('_____', '<span class="evgap">_____</span>') : '“' + esc(q.q) + '”') + '</div>';
    pb().innerHTML = '<div class="estory evault"><p class="ecount">Word ' + (i + 1) + ' of ' + quiz.length + '</p><h3 class="evask">' + ask + '</h3>' + big
      + '<div class="eopts">' + q.o.map((o, k) => '<button class="eopt" data-o="' + k + '">' + esc(o) + '</button>').join('') + '</div>'
      + '<div class="ep-row"><button class="ebtn" id="eg-next" hidden>Next</button></div></div>';
    const t0 = Date.now();
    qa('[data-o]', GP).forEach(b => b.onclick = () => {
      const k = +b.dataset.o, ok = k === q.ans;
      G.results.push({ w: q.w, ok }); G.ms.push(Date.now() - t0);
      qa('[data-o]', GP).forEach(x => { x.disabled = true; if (+x.dataset.o === q.ans) x.classList.add('right'); });
      if (!ok) b.classList.add('bad');
      sfx(ok ? 'correct' : 'wrong');
      say((ok ? praise() + ' ' : '') + '<b>' + esc(q.w) + '</b>: ' + esc(q.m) + '<br><i>' + esc(q.ex) + '</i>', ok ? 'correct' : 'thinking');
      nextBtn(i + 1 < quiz.length ? 'Next' : 'Finish', () => step(i + 1));
    });
  };
  step(0);
}
function finishVault(){
  gprog(1); hush(); gload('Saving…');
  const secs = Math.round((Date.now() - G.t0) / 1000);
  const send = () => api('/api/english', { action: 'vault', op: 'review', token: ME.token, cid: G.cid, results: G.results, secs }, 10000).then(r => {
    if (!GP) return;
    if (r.status !== 200 || !r.j.ok) return gfail('Couldn’t save your review. Check your internet.', send);
    if (r.j.state) { EA = r.j.state; pulledAt = Date.now(); cacheSave(); }
    const right = G.results.filter(x => x.ok).length, up = (r.j.moves || []).filter(m => m.box > 1).length;
    showResult({ correct: right, items: G.results.length, points: r.j.points || 0, note: up ? plural(up, 'word') + ' moved up a box. They’ll come back later.' : 'Missed words come back tomorrow.' });
  });
  send();
}

/* ---- saving a round + the result screen ---- */
function finish(){
  gprog(1); hush(); G.key = null; gload('Saving…');
  const secs = Math.round((Date.now() - G.t0) / 1000);
  const P = G.game === 'groups' ? G.round.items[0] : null;
  const send = () => api('/api/english', { action: 'round', token: ME.token, cid: G.cid, game: G.game, ids: G.ids, answers: G.ans, tries: G.tries, ms: G.ms, secs, n: P ? P.n : undefined }, 12000).then(r => {
    if (!GP) return;
    if (r.status !== 200 || !r.j.ok) return gfail('Couldn’t save this round. Check your internet.', send);
    if (r.j.state) { EA = r.j.state; pulledAt = Date.now(); cacheSave(); }
    showResult(r.j);
  });
  send();
}
function showResult(j){
  const game = G.game, items = j.items || G.ids.length, acc = items ? Math.round((j.correct || 0) / items * 100) : 0;
  const lu = j.levelUp, sk = lu && skillOf(lu.skill);
  const nxt = nextGame(), closedNow = isClosed();
  let head = game === 'groups' ? ((j.correct ? 'Puzzle solved!' : 'Puzzle done')) : acc >= 80 ? 'Great round!' : acc >= 50 ? 'Good round!' : 'Round done!';
  const missed = [...new Set(G.missed || [])];
  pb().innerHTML = '<div class="eresult egres">' + yap(lu || acc >= 80 ? 'correct' : 'idle', 120, 'eyap bob')
    + (lu ? '<div class="elvup" style="--c:' + sk.c + '">⬆️ ' + esc(sk.name) + ' is now <b>Level ' + lu.lv + ': ' + LEVELS[lu.lv - 1] + '</b>!</div>' : '')
    + '<h2 class="ddisplay">' + esc(head) + '</h2>'
    + '<div class="egstats">' + (game === 'groups' ? '' : '<div><b>' + acc + '%</b><span>first-try right</span></div>') + '<div><b>+' + (j.points || 0) + '</b><span>Adda points</span></div>'
    + '<div><b>' + mins(todaySecs()) + '<small>/15</small></b><span>minutes today</span></div></div>'
    + (j.note ? '<p class="esub">' + esc(j.note) + '</p>' : '')
    + (j.points === 0 && game !== 'vault' && !tester() ? '<p class="esub">No points this time: ' + (game === 'groups' ? 'the daily puzzle pays once a day.' : 'today’s 25 minutes are used up.') + '</p>' : '')
    + (missed.length ? '<div class="epanel evoffer"><h3>Save words to your Word Vault?</h3><p class="esub">They’ll come back for quick reviews, so they stick.</p>'
      + missed.map(w => '<label class="evchk"><input type="checkbox" value="' + esc(w) + '" checked> ' + esc(w) + '</label>').join('') + '<button class="ebtn purple sm" id="eg-save">Save words</button></div>' : '')
    + (G.share ? '<div class="eshare"><pre>' + esc(G.share) + '</pre><button class="ebtn ghost sm" id="eg-share">Copy result</button></div>' : '')
    + '<div class="ep-row">' + (closedNow ? '' : '<button class="ebtn" id="eg-more">' + (nxt ? 'Next: ' + esc(gameOf(nxt).name) : 'Play a bonus round') + '</button>')
    + '<button class="ebtn ghost" id="eg-home">Back to Adda</button></div></div>';
  if (lu) { sfx('levelup'); try { if (!reduced()) confetti(); } catch (e) {} }
  else if (acc >= 80) sfx('star');
  const more = qs('#eg-more', GP);
  if (more) more.onclick = () => { const g = nxt || bonusGame(); closeGame(); openGame(g); };
  qs('#eg-home', GP).onclick = () => { sfx('tap'); closeGame(); };
  const save = qs('#eg-save', GP);
  if (save) save.onclick = () => {
    const words = qa('.evchk input:checked', GP).map(x => x.value);
    if (!words.length) { qs('.evoffer', GP).remove(); return; }
    save.disabled = true; save.textContent = 'Saving…';
    api('/api/english', { action: 'vault', op: 'add', token: ME.token, words, source: 'realfake' }, 10000).then(r => {
      const box = qs('.evoffer', GP); if (!box) return;
      if (r.status === 200 && r.j.ok) { sfx('select'); box.innerHTML = '<p class="esub" style="margin:0">🔐 ' + plural(words.length, 'word') + ' saved. First review tomorrow.</p>'; pull(true); }
      else { save.disabled = false; save.textContent = 'Try again'; }
    });
  };
  const sh = qs('#eg-share', GP);
  if (sh) sh.onclick = () => { try { navigator.clipboard.writeText(G.share).then(() => toast('Copied! Share it with your friends.')); } catch (e) { toast('Couldn’t copy.'); } };
}

/* ================= buttons ================= */
document.addEventListener('click', e => {
  if (e.target.closest('[data-echeck]')) openCheck();
  else if (e.target.closest('[data-ehear]')) {
    const [a, b] = YAPPER_LINES.hello;
    if (typeof SFX !== 'undefined' && SFX.muted) return toast('Sound is off. Turn it on to hear Yapper.');
    Voice.say(a, why => { if (why === 'end') Voice.say(b); });
  }
  else if (e.target.closest('[data-eplay]')) startNext();
  else if (e.target.closest('[data-egame]')) { const g = e.target.closest('[data-egame]').dataset.egame; if (g !== 'vault' && isClosed()) toast('Adda’s closed for today. Your Word Vault is still open.'); else openGame(g); }
  else if (e.target.closest('[data-tip]')) showTip(e.target.closest('[data-tip]'), true);
});

/* ================= Yapper's hover bubble ================= */
// hover (mouse) or tap/focus (phone, keyboard) on Yapper: a speech bubble pops up above him
let tipEl = null, tipFor = null, tipTimer = 0, tipLast = '';
function showTip(img, tapped){
  const list = TIPS[img.dataset.tip] || TIPS.hi;
  if (tipFor === img && tipEl && tipEl.classList.contains('on')) { if (tapped) { clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2600); } return; }
  let line = list[0];
  if (tipFor === img || tipLast) { const rest = list.filter(x => x !== tipLast); line = rest[Math.floor(Math.random() * rest.length)] || list[0]; }
  tipLast = line; tipFor = img;
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'eyap-tip'; tipEl.setAttribute('role', 'status'); document.body.appendChild(tipEl); }
  tipEl.textContent = line;
  const r = img.getBoundingClientRect();
  tipEl.classList.remove('on', 'below');
  tipEl.style.left = '0px'; tipEl.style.top = '0px';
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 10, below = false;
  if (y < 8) { y = r.bottom + 10; below = true; }
  x = Math.max(8, Math.min(innerWidth - w - 8, x));
  tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  tipEl.style.setProperty('--ax', (r.left + r.width / 2 - x) + 'px');
  tipEl.classList.toggle('below', below);
  requestAnimationFrame(() => tipEl && tipEl.classList.add('on'));
  img.classList.add('wiggle'); setTimeout(() => img.classList.remove('wiggle'), 600);
  clearTimeout(tipTimer); if (tapped) tipTimer = setTimeout(hideTip, 2600);
}
function hideTip(){ clearTimeout(tipTimer); if (tipEl) tipEl.classList.remove('on'); }
document.addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && e.pointerType === 'mouse') showTip(t, false); });
document.addEventListener('pointerout', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && e.pointerType === 'mouse' && !t.contains(e.relatedTarget)) hideTip(); });
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('[data-tip]')) showTip(e.target, false); });
document.addEventListener('focusout', e => { if (e.target.matches && e.target.matches('[data-tip]')) hideTip(); });
addEventListener('scroll', hideTip, { passive: true });
addEventListener('hashchange', hideTip);

/* ================= hooks for index.html ================= */
// called on every route: shows the tab once the server says this batch can open English Adda
let syncAt = 0;
function sync(){
  if (!ME) { const t = qs('#tab-english'); if (t) t.hidden = true; return; }
  if (OPEN === null) OPEN = openLoad();
  const t = qs('#tab-english'); if (t) t.hidden = OPEN !== true;
  if (Date.now() - syncAt > 60000) { syncAt = Date.now(); pull(); }
}
function leave(){ playing = false; flush(); }
function reset(){ flush(true); playing = false; pend = 0; EA = null; OPEN = null; pulledAt = 0; syncAt = 0; const r = qs('#english-root'); if (r) r.innerHTML = ''; const t = qs('#tab-english'); if (t) t.hidden = true; }
window.Adda = {
  render, leave, reset, sync,
  // test accounts only: jump straight into a game, e.g. Adda.open('jumble', 6) or Adda.open('groups', 0, 12) for puzzle #12
  open(game, lv, n){ if (!tester()) return 'Test accounts only'; openGame(game, { lv, n }); return 'Opening ' + game; },
  _state: st, _todaySecs: todaySecs,
  _play(on, hook){ playing = !!on; secondHook = on ? hook || null : null; lastAct = Date.now(); if (!on) flush(); }
};
// the page's first route() ran before this file loaded
if (typeof view !== 'undefined' && view === 'english') render();
sync();
})();
