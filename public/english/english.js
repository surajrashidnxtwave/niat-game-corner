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
const skillOf = k => SKILLS.find(s => s.k === k);

/* ================= small helpers ================= */
const qs = (s, el) => (el || document).querySelector(s);
const qa = (s, el) => [...(el || document).querySelectorAll(s)];
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const istDay = t => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t ? new Date(t) : new Date());
const sfx = name => { try { SFX.play(name); } catch (e) {} };
const mins = s => Math.floor(s / 60);
const tester = () => !!(typeof ME !== 'undefined' && ME && ME.pilot === 'DEMO');
const yap = (pose, size, cls) => '<img class="' + (cls || 'eyap') + '" src="assets/yapper/yapper-' + pose + '.svg" width="' + size + '" height="' + size + '" alt="" decoding="async">';
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
  root.innerHTML = '<section class="ewelcome"><div class="ewel-yap">' + yap('idle', 200, 'eyap bob') + '</div><div class="ewel-talk">'
    + '<h1 class="ddisplay">English Adda</h1><p class="ewel-sub">Not open for your batch yet. Yapper is still warming up. Check back soon!</p>'
    + '<button class="ebtn ghost" data-go="home">Back to Brain Gym</button></div></section>';
}
/* the level check is required: until it's done, English Adda shows only this start screen. Yapper introduces himself here. */
function renderWelcome(root){
  root.innerHTML = '<section class="ewelcome"><div class="ewel-yap">' + yap('idle', 240, 'eyap bob') + '</div>'
    + '<div class="ewel-talk"><span class="etag">New · English Adda</span><h1 class="ddisplay">Hey, I’m Yapper!</h1>'
    + '<div class="ebubble"><p>Yes, I talk a lot. This is <b>English Adda</b>: 15 minutes a day of word games, stories and quick challenges.</p>'
    + '<p>First, a quick warm-up so I can pick the right games for you. No marks, no pressure.</p></div>'
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
    + (tester() ? '<p class="etester">🧪 Test account: no daily limit, every game open.</p>' : '') + '</div>'
    + '<div class="echips"><span class="echip" title="Goal days in a row">🔥 ' + plural(sk, 'day') + '</span><span class="echip" title="Adda points">' + ICON.star + ' ' + (S.points || 0).toLocaleString('en-IN') + ' pt</span>'
    + '<button class="round press mute" aria-label="Turn sound off">🔊</button></div></div>'
    + '<section class="ehero' + (closed ? ' closed' : '') + '">' + ring(t, 128)
    + '<div class="ehero-text"><span class="etag">' + tag + '</span><h2 class="ddisplay">' + esc(h) + '</h2><p>' + esc(p) + '</p>'
    + (btn ? '<div class="ehero-row">' + btn + '</div>' : '') + '</div>'
    + yap(closed ? 'idle' : done ? 'correct' : 'idle', 140, 'eyap ehero-yap') + '</section>'
    + '<div class="egrid"><section class="epanel"><h3>Today’s games</h3><p class="esub">' + (S.placed ? 'Picked for your level. More time goes to the skills you’re building.' : 'Your games appear after the level check.') + '</p>'
    + '<div class="esets">' + GAMES.filter(g => !g.always).map(g => setRow(g)).join('') + '</div></section>'
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

/* ================= buttons ================= */
document.addEventListener('click', e => {
  if (e.target.closest('[data-echeck]')) { sfx('tap'); toast('The level check is being built. Coming in the next update!'); }
  else if (e.target.closest('[data-eplay]')) { sfx('tap'); toast('The games are being built. Coming soon!'); }
});

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
