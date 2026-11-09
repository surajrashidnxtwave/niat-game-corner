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
// v1 games (built: false = not playable in this release yet; listed so the plan is visible on test accounts)
const GAMES = [
  { id: 'groups',  name: 'Word Groups',  skill: 'voc', icon: '🧩', mins: 2, built: false, daily: true },
  { id: 'realfake',name: 'Real or Fake', skill: 'voc', icon: '🕵️', mins: 2, built: false },
  { id: 'catch',   name: 'Catch It',     skill: 'lis', icon: '🎧', mins: 2, built: false },
  { id: 'rewind',  name: 'Story Rewind', skill: 'lis', icon: '📻', mins: 3, built: false },
  { id: 'jumble',  name: 'Jumble',       skill: 'gra', icon: '🔀', mins: 2, built: false },
  { id: 'spotfix', name: 'Spot & Fix',   skill: 'gra', icon: '🔍', mins: 2, built: false },
  { id: 'reels',   name: 'Reel Reader',  skill: 'rea', icon: '📱', mins: 3, built: false },
  { id: 'vanish',  name: 'Vanish',       skill: 'rea', icon: '💨', mins: 3, built: false },
  { id: 'email',   name: 'Fix My Email', skill: 'wri', icon: '✉️', mins: 3, built: false },
  { id: 'vault',   name: 'Word Vault',   skill: 'voc', icon: '🔐', mins: 1, built: false, always: true }
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
  done: ['Done! Here’s where you start. I’ll pick your games from this.']
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
  else if (t > 0) { h = 'Keep going'; p = Math.ceil((GOAL - t) / 60) + ' minutes left in today’s Adda.'; btn = '<button class="ebtn" data-eplay>Continue</button>'; }
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
    + '<div class="esets">' + (S.placed && S.circuit && S.circuit.length ? ['groups', ...S.circuit].map(gameOf).filter(Boolean) : GAMES.filter(g => !g.always)).map(g => setRow(g)).join('') + '</div></section>'
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
function setRow(g){
  const s = skillOf(g.skill);
  return '<div class="eset' + (g.built ? '' : ' soon') + '"><span class="eico" style="--c:' + s.c + '">' + g.icon + '</span>'
    + '<div class="eset-t"><b>' + esc(g.name) + '</b><small><i style="background:' + s.c + '"></i>' + s.name + ' · about ' + g.mins + ' min' + (g.daily ? ' · daily puzzle' : '') + '</small></div>'
    + '<span class="estate">' + (g.built ? '' : ICON.lock + ' Soon') + '</span></div>';
}
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

/* ================= buttons ================= */
document.addEventListener('click', e => {
  if (e.target.closest('[data-echeck]')) openCheck();
  else if (e.target.closest('[data-ehear]')) {
    const [a, b] = YAPPER_LINES.hello;
    if (typeof SFX !== 'undefined' && SFX.muted) return toast('Sound is off. Turn it on to hear Yapper.');
    Voice.say(a, why => { if (why === 'end') Voice.say(b); });
  }
  else if (e.target.closest('[data-eplay]')) { sfx('tap'); toast('The games are being built. Coming soon!'); }
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
  _state: st, _todaySecs: todaySecs,
  _play(on, hook){ playing = !!on; secondHook = on ? hook || null : null; lastAct = Date.now(); if (!on) flush(); }
};
// the page's first route() ran before this file loaded
if (typeof view !== 'undefined' && view === 'english') render();
sync();
})();
