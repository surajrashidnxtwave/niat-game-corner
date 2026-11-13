/* English Adda: a daily 15-minute English workout made of short games, inside Game Corner. Host: Mithu the parakeet (art: scripts/mithu-art.py).
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
  { id: 'pairup',  name: 'Dive',         skill: 'voc', icon: '🐟', mins: 2, built: true },
  { id: 'realfake',name: 'Real or Fake', skill: 'voc', icon: '🥚', mins: 3, built: true },
  { id: 'echo',    name: 'Echo',         skill: 'lis', icon: '🦇', mins: 3, built: true },
  { id: 'catch',   name: 'Catch It',     skill: 'lis', icon: '🎧', mins: 2, built: false },
  { id: 'rewind',  name: 'Story Rewind', skill: 'lis', icon: '📻', mins: 3, built: false },
  { id: 'flick',   name: 'Hop',          skill: 'gra', icon: '🐿️', mins: 2, built: true },
  { id: 'express', name: 'Express',      skill: 'gra', icon: '🚂', mins: 2, built: true },
  { id: 'post',    name: 'Pigeon Post',  skill: 'rea', icon: '🕊️', mins: 3, built: true },
  { id: 'reels',   name: 'Reel Reader',  skill: 'rea', icon: '📱', mins: 3, built: false },
  { id: 'vanish',  name: 'Vanish',       skill: 'rea', icon: '💨', mins: 3, built: false },
  { id: 'munch',   name: 'Munch',        skill: 'wri', icon: '🐐', mins: 2, built: true },
  { id: 'email',   name: 'Fix My Email', skill: 'wri', icon: '✉️', mins: 3, built: false },
  { id: 'vault',   name: 'Word Vault',   skill: 'voc', icon: '🔐', mins: 1, built: true, always: true }
];
const gameOf = id => GAMES.find(g => g.id === id);
// Everything Mithu says out loud. After ANY change here, run: python scripts/english-voice.py
/*MITHU_LINES*/const MITHU_LINES = {
  hello: ['I’m Mithu. I hear everything on this campus. And no, I don’t repeat. I remix.',
          'This is English Adda: 15 minutes a day of quick word games. First, a short warm-up so I can pick your games. No marks, no pressure.'],
  rf: ['Part one: Real or Fake. Tap Real only if you know the word. Some words are made up, so don’t guess!'],
  c1: ['Part two: Fill the gaps. Each word has lost its ending. Type the missing letters.'],
  c2: ['Nice! One more short passage.'],
  catch: ['Part three: Catch it. Listen, then type exactly what you hear. Each sentence plays only once, so stay sharp!'],
  story: ['Last part! Read this quick story, then answer two questions.'],
  done: ['Done! Here’s where you start. I’ll pick your games from this.'],
  realfake: ['A koel hid fake eggs in the crow’s nest. Help the crow! Every egg has a word on it.', 'A real word is a real egg. A wrong spelling or a made-up word is a fake egg.'],
  pairup: ['Dive! The kingfisher is hungry. Read the sign next to him. Then tap the leaf with the right word. A fish hides under it.'],
  flick: ['The squirrel wants to cross the river. He needs your help. The stones make a sentence.', 'If the sentence is right, tap Hop. If one stone is wrong, tap Wait. Then tap the wrong stone.'],
  express: ['Express! Some coaches are already on the train. Tap the missing ones in order, and the train leaves.', 'Careful: one coach doesn’t belong. Leave it in the yard.'],
  munch: ['Munch! This goat is hungry, but he eats only extra words. One word in each sentence is extra.', 'Tap that word and he eats it. Then the sentence is right.'],
  post: ['Pigeon Post! The pigeon brings a note. Read it, then tap the house with the right answer.'],
  echo: ['Echo! It’s dark in the cave, and the bat finds his way by sound. Earphones in?', 'You hear each sentence only once. Tap the missing words, and each right word lights a lamp.'],
  vault: ['Word Vault time! Let’s see which of your saved words stuck.']
};/*END_MITHU_LINES*/
const skillOf = k => SKILLS.find(s => s.k === k);

/* ================= small helpers ================= */
const qs = (s, el) => (el || document).querySelector(s);
const qa = (s, el) => [...(el || document).querySelectorAll(s)];
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const istDay = t => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t ? new Date(t) : new Date());
const sfx = name => { try { SFX.play(name); } catch (e) {} };
const mins = s => Math.floor(s / 60);
const tester = () => !!(typeof ME !== 'undefined' && ME && ME.pilot === 'DEMO');
const yap = (pose, size, cls, tip) => '<img class="' + (cls || 'eyap') + '" src="assets/mithu/mithu-' + pose + '.svg" width="' + size + '" height="' + size + '" alt="" decoding="async"' + (tip ? ' data-tip="' + tip + '" tabindex="0" role="button" aria-label="Mithu says hi"' : '') + '>';
// what Mithu says when you hover over (or tap) him. Text only, no sound.
const TIPS = {
  hi: ['I’m Mithu. Ready when you are.', 'I don’t repeat. I remix.', 'I heard that. I hear everything.'],
  home: ['I’m Mithu. Ready when you are.', '15 minutes. Shorter than the mess queue.', 'Today’s games are picked for you.', 'Nice streak. Keep it going 🔥'],
  done: ['Goal done. I’m impressed, and I’m hard to impress.', 'Done for today. Bonus round?'],
  closed: ['Adda’s closed. See you tomorrow.', 'Go rest. I’ll be here.'],
  wait: ['Not open for you yet. Soon.']
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
  profTabSync();
}
// My Profiles: show or hide the English Profile tab (drive.js runs the tabs)
function profTabSync(){ if (typeof view !== 'undefined' && view === 'muscles' && window.Drive) Drive.profileTab(); }
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
  if (!S) { root.innerHTML = '<div class="eload">' + yap('thinking', 150, 'eyap bob') + '<p>Opening the adda…</p></div>'; return; }
  if (!S.placed && !tester()) return renderWelcome(root);
  renderHome(root, S);
}
function renderNotOpen(root){
  root.innerHTML = '<section class="ewelcome"><div class="ewel-yap">' + yap('idle', 200, 'eyap bob', 'wait') + '</div><div class="ewel-talk">'
    + '<h1 class="ddisplay">English Adda</h1><p class="ewel-sub">Not open for your batch yet. Mithu is still warming up. Check back soon!</p>'
    + '<button class="ebtn ghost" data-go="home">Back to Brain Gym</button></div></section>';
}
/* the level check is required: until it's done, English Adda shows only this start screen. Mithu introduces himself here. */
function renderWelcome(root){
  root.innerHTML = '<section class="ewelcome"><div class="ewel-yap">' + yap('idle', 240, 'eyap bob', 'hi') + '</div>'
    + '<div class="ewel-talk"><span class="etag">New · English Adda</span><h1 class="ddisplay">Hey, I’m Mithu.</h1>'
    + '<div class="ebubble">' + MITHU_LINES.hello.map(t => '<p>' + esc(t) + '</p>').join('') + '<button class="ehear" data-ehear aria-label="Hear Mithu">🔊 Hear me</button></div>'
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
    + yap(closed ? 'idle' : done ? 'correct' : 'idle', 180, 'eyap ehero-yap', closed ? 'closed' : done ? 'done' : 'home') + '</section>'
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

/* ================= Mithu's voice + listening clips ================= */
// Mithu's lines: clips recorded by scripts/english-voice.py, found by text in the manifest (off when sound is muted).
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
    intro(1, 'Real or Fake', MITHU_LINES.rf[0], 'Start', () => rfShow(0));
  });
}
function body(){ return qs('.ep-body', CP); }
function progress(part){ if (!CP) return; qs('.ep-prog i', CP).style.width = Math.round(C.done / UNITS * 100) + '%'; if (part) qs('.ep-part', CP).textContent = 'Part ' + part + ' of 4'; }
function loading(msg){ body().innerHTML = '<div class="ep-center">' + yap('thinking', 150, 'eyap bob') + '<p class="esub">' + esc(msg) + '</p></div>'; }
function failed(retry){
  body().innerHTML = '<div class="ep-center">' + yap('oops', 150, 'eyap') + '<p class="esub">Couldn’t reach Game Corner. Check your internet.</p><button class="ebtn" id="ep-retry">Try again</button></div>';
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
  if (i >= words.length) { C.key = null; return intro(2, 'Fill the gaps', MITHU_LINES.c1[0], 'Start', () => passage('c1')); }
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
    if (which === 'c2') return intro(3, 'Catch it', MITHU_LINES.catch[0], 'Start', () => catchShow(0));
    const go = () => {
      loading('One moment…');
      api('/api/english', { action: 'checknext', token: ME.token, rf: C.rf, c1: C.c1 }, 10000).then(r => {
        if (!CP) return;
        if (r.status !== 200 || !r.j.ok) return failed(go);
        C.next = r.j.items;
        progress(2);
        body().innerHTML = '<div class="ep-intro">' + yap('correct', 170, 'eyap bob') + '<div class="ebubble"><p>' + esc(MITHU_LINES.c2[0]) + '</p></div><button class="ebtn" id="ep-go">Next passage</button></div>';
        Voice.say(MITHU_LINES.c2[0]);
        qs('#ep-go', CP).onclick = () => { sfx('tap'); Voice.stop(); passage('c2'); };
      });
    };
    go();
  };
}

// ---- part 3: Catch it (hear a sentence once, type it) ----
function catchShow(i){
  const list = C.items.catch;
  if (i >= list.length) return intro(4, 'Quick story', MITHU_LINES.story[0], 'Start', storyShow);
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
  loading('Mithu is working out your level…');
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
  body().innerHTML = '<div class="eresult">' + yap('correct', 180, 'eyap bob') + '<div class="ebubble"><p>' + esc(MITHU_LINES.done[0]) + '</p></div>'
    + '<h2 class="ddisplay">You’re Level ' + overall + ': ' + LEVELS[overall - 1] + '</h2>'
    + '<div class="epanel eres-skills">' + SKILLS.map(s => skillRow(s, L[s.k])).join('') + '<p class="esub" style="margin:10px 0 0">' + line + ' Only you can see this.</p></div>'
    + '<button class="ebtn" id="ep-home">See today’s games</button></div>';
  Voice.say(MITHU_LINES.done[0]);
  sfx('levelup'); try { if (!reduced()) confetti(); } catch (e) {}
  qs('#ep-home', CP).onclick = () => { sfx('tap'); closeCheck(); };
}

/* ================= the games: Word Groups, Real or Fake, Flick, Express, Word Vault =================
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
  return ((S && S.circuit) || []).map(id => { const done = left[id] > 0; if (done) left[id]--; return { id, done }; });
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
function gload(msg){ pb().innerHTML = '<div class="ep-center">' + yap('thinking', 150, 'eyap bob') + '<p class="esub">' + esc(msg) + '</p></div>'; }
function gfail(msg, retry){
  pb().innerHTML = '<div class="ep-center">' + yap('oops', 150, 'eyap') + '<p class="esub">' + esc(msg || 'Couldn’t reach Game Corner. Check your internet.') + '</p>'
    + '<div class="ep-row">' + (retry ? '<button class="ebtn" id="eg-retry">Try again</button>' : '') + '<button class="ebtn ghost" id="eg-close">Close</button></div></div>';
  if (retry) qs('#eg-retry', GP).onclick = () => { sfx('tap'); retry(); };
  qs('#eg-close', GP).onclick = () => { sfx('tap'); closeGame(); };
}
// Mithu's corner bubble: hints, the "why", praise. Spoken only if a clip exists (fixed lines); the rest is text.
function say(html, pose){
  if (!GP) return;
  const box = qs('.ep-yapper', GP); box.hidden = false;
  qs('.ep-yapper img', GP).src = 'assets/mithu/mithu-' + (pose || 'idle') + '.svg';
  const s = qs('.ep-say', GP); s.innerHTML = html; box.classList.remove('epopin'); void box.offsetWidth; box.classList.add('epopin');
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
    + '<div class="ep-yapper" hidden aria-live="polite">' + yap('idle', 84, 'eyap') + '<div class="ep-say"></div></div></div>');
  document.body.appendChild(GP); document.body.classList.add('eplaying');
  qs('.ep-x', GP).onclick = askLeaveGame;
  const S0 = st();
  G = { game, opt, cid: newCid(), t0: Date.now(), ids: [], ans: [], tries: [], ms: [], combo: 0, missed: [], timer: 0,
        mode: opt.mode === 'rush' ? 'rush' : 'chill', score: 0, streak: 0, bestStreak: 0, missIdx: [], replay: null, rushWas: !!(S0 && S0.rush && S0.rush[game]) };
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
    // "Play again" on a run game starts at once, with no intro
    if (opt.auto && RUN_GAMES[game]) { sfx('go'); G.t0 = Date.now(); RUN_GAMES[game](); } else gintro(game);
  });
  go();
}
function gintro(game){
  const g = gameOf(game), lines = MITHU_LINES[game] || [];
  const extra = (game === 'express' && G.round.lv >= 4) || ['flick', 'realfake', 'munch', 'echo'].includes(game) ? lines[1] : '';
  const run = !!RUN_GAMES[game], S = st(), canRush = tester() || !!(S && S.rush && S.rush[game]), best = (S && S.best && S.best[game]) || {};
  const sub = game === 'groups' && G.round.items ? 'Puzzle #' + G.round.items[0].n : game === 'vault' ? plural(G.round.quiz.length, 'word') + ' to review' : 'Level ' + G.round.lv + ' · ' + LEVELS[G.round.lv - 1];
  pb().innerHTML = '<div class="ep-intro">' + yap('idle', 180, 'eyap bob') + '<div class="ebubble"><span class="etag">' + g.icon + ' ' + esc(g.name) + ' · ' + esc(sub) + '</span>'
    + '<p>' + esc(lines[0] || '') + '</p>' + (extra ? '<p>' + esc(extra) + '</p>' : '') + '</div>'
    + (run ? '<div class="erun-modes"><button class="ebtn" id="eg-go" data-m="chill">Chill<small>no clock</small></button>'
        + '<button class="ebtn purple" id="eg-rush" data-m="rush"' + (canRush ? '' : ' disabled') + '>⚡ Rush<small>' + (canRush ? 'beat the clock' : 'get 80% in Chill to open') + '</small></button></div>'
        + (best.chill || best.rush ? '<p class="esub">Your best: ' + [best.chill ? 'Chill ' + fmt(best.chill) : '', best.rush ? 'Rush ' + fmt(best.rush) : ''].filter(Boolean).join(' · ') + '</p>' : '')
      : '<button class="ebtn" id="eg-go">Start</button>') + '</div>';
  Voice.say(lines[0], why => { if (why === 'end' && extra) Voice.say(extra); });
  const b = qs('#eg-go', GP); b.focus();
  const start = m => { sfx('go'); Voice.stop(); G.t0 = Date.now(); if (m) G.mode = m; ({ realfake: rfGame, flick: flGame, express: exGame, pairup: puGame, munch: muGame, post: poGame, echo: ecGame, groups: grGame, vault: vaultGame })[game](); };
  b.onclick = () => start(run ? 'chill' : '');
  const rb = qs('#eg-rush', GP); if (rb) rb.onclick = () => start('rush');
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
  Voice.stop(); if (G) { clearTimeout(G.timer); clearInterval(G.tick); }
  GP.remove(); GP = null; G = null;
  document.body.classList.remove('eplaying');
  Adda._play(false);
  render();
  // back on the Adda home after a few rounds: ask for today's rating (once a day; never on top of another sheet)
  if (rateDue()) setTimeout(() => { if (!GP && !CP && view === 'english' && !modalOpen()) rateDay(); }, 300);
}
document.addEventListener('keydown', e => {
  if (!GP || !G || qs('.ep-confirm', GP)) return;
  if (e.key === 'Escape') return askLeaveGame();
  if (G.key) G.key(e);
});
const nextBtn = (label, fn) => { const b = qs('#eg-next', GP); b.textContent = label || 'Next'; b.hidden = false; b.disabled = false; b.focus({ preventScroll: true }); b.onclick = () => { sfx('tap'); fn(); }; };

// the example sentence with the word in bold
const exBold = (ex, w) => esc(ex).replace(new RegExp('\\b(' + w + ')\\b'), '<b>$1</b>');

/* ================= run games (Hop, Express, Dive, Real or Fake, Munch, Pigeon Post, Echo): one action, a live score, Chill or Rush =================
   Score = 100 per right answer x the streak multiplier, plus a speed bonus in Rush (the same sum as runScore on the server;
   the saved number is the server's). There is no Next button: the game moves on by itself, and a miss shows its fix on the
   item for a moment. Misses are kept for Miss Replay on the end card. */
const RUN_GAMES = { flick: flGame, express: exGame, pairup: puGame, realfake: rfGame, munch: muGame, post: poGame, echo: ecGame };
const streakMult = n => Math.min(5, 1 + Math.floor((n - 1) / 3));
const fmt = n => Number(n || 0).toLocaleString('en-IN');
// the items of this run and where its answers go. In Miss Replay: only the missed items, nothing recorded.
function runCtx(){
  if (G.replay) return { items: G.replay, rec(){} };
  const items = G.round.items; G.ids = items.map(x => x.id);
  return { items, rec(i, a, tries, ms){ G.ans[i] = a; G.tries[i] = tries; G.ms[i] = ms; } };
}
function runHud(){
  if (G.replay) return '<div class="erun-hud"><span class="erun-mode">Miss Replay · no score</span></div>';
  return '<div class="erun-hud"><span class="erun-mode' + (G.mode === 'rush' ? ' rush' : '') + '">' + (G.mode === 'rush' ? '⚡ Rush' : 'Chill') + '</span>'
    + '<span class="erun-mult" hidden></span><span class="erun-score"><b>0</b><small>score</small></span></div>';
}
function runPaint(gain){
  const sc = qs('.erun-score', GP), mu = qs('.erun-mult', GP); if (!sc) return;
  qs('b', sc).textContent = fmt(G.score);
  const next = streakMult(G.streak + 1);   // what the next right answer is worth
  mu.hidden = G.streak < 2; mu.textContent = '🔥 ' + G.streak + (next > 1 ? ' · x' + next : '');
  if (gain) {
    const f = document.createElement('i'); f.className = 'erun-gain'; f.textContent = '+' + gain; sc.appendChild(f); setTimeout(() => f.remove(), 800);
    sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
  }
}
function runHit(ms, lim){
  if (G.replay) return sfx('correct');
  G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak);
  const mult = streakMult(G.streak);
  const gain = 100 * mult + (G.mode === 'rush' && lim ? Math.round(50 * Math.max(0, 1 - ms / lim)) : 0);
  G.score += gain;
  sfx(mult > 1 && (G.streak - 1) % 3 === 0 ? 'combo' : 'correct');
  runPaint(gain);
}
function runMiss(i, sound, consolation){
  sfx(sound || 'wrong');
  if (G.replay) return;
  G.streak = 0; G.score += consolation || 0;
  if (!G.missIdx.includes(i)) G.missIdx.push(i);
  runPaint(consolation);
}
// after a miss: move on after `ms`, or at once on a tap, Enter or Space. In Miss Replay it waits for the tap.
function holdThen(ms, fn){
  let done = false; const body = pb();
  const go = () => { if (done || !G) return; done = true; clearTimeout(G.timer); body.removeEventListener('click', go); G.key = null; fn(); };
  setTimeout(() => { if (!done) body.addEventListener('click', go); }, 250);   // not the same tap that answered
  G.key = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  if (!G.replay) G.timer = setTimeout(go, ms);
}
const endRun = () => G.replay ? showRun(G.lastJ) : finish();
const TAP = '<i class="erun-tap">Tap to go on</i>';
// each run game IS its scene: Hop = stepping stones and a squirrel, Express = a train, Dive = a kingfisher and a pond,
// Real or Fake = a crow's nest with real and fake eggs, Munch = a goat at a hedge, Pigeon Post = a pigeon and a street,
// Echo = a bat in a dark cave
const SKY = '<div class="esky" aria-hidden="true"><i></i><i></i><i></i></div>';

/* ---- Hop (game id: flick): a squirrel wants to cross the river and needs the student's help. The sentence is a path
        of stepping stones, one stone per phrase. Sentence right -> Hop (swipe right): he bounces across and banks a nut.
        One stone wrong -> Wait (swipe left), then TAP THE WRONG STONE: it sinks, the right one rises, and he crosses.
        Hop onto a wrong sentence and he falls in at exactly the wrong stone, so the mistake shows itself. 20 sentences. ---- */
const SQUIRREL = '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M13 31Q-3 27 3 12Q8 0 20 7Q11 12 15 23Z" fill="#B5651D"/><path d="M9 26Q2 20 7 11" fill="none" stroke="#E9B983" stroke-width="3" stroke-linecap="round"/>'
  + '<ellipse cx="26" cy="27" rx="12" ry="10" fill="#C98A4B"/><ellipse cx="29" cy="30" rx="6" ry="5" fill="#F6E3C6"/>'
  + '<path d="M17 21Q26 15 35 21" fill="none" stroke="#5A3A1E" stroke-width="2.4" stroke-linecap="round"/><path d="M17 24.5Q26 18.5 35 24.5" fill="none" stroke="#F6E3C6" stroke-width="1.8" stroke-linecap="round"/>'
  + '<circle cx="34" cy="8.5" r="3.4" fill="#B5651D"/><circle cx="37" cy="17" r="8" fill="#C98A4B"/><circle cx="40" cy="15.5" r="1.8" fill="#1E1B2E"/><circle cx="45" cy="18.5" r="1.4" fill="#5A3A1E"/>'
  + '<path d="M22 37h6M31 37h6" stroke="#8A5A2B" stroke-width="3" stroke-linecap="round"/></svg>';
function flGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay, HOP = reduced() ? 0 : 135;
  let nuts = 0;
  pb().innerHTML = '<div class="ehp">' + runHud()
    + '<div class="ehp-river"><div class="ehp-water" aria-hidden="true"></div><p class="ehp-ctx" hidden>📧 In a formal email or interview</p><div class="ehp-path"></div>'
    + '<div class="ehp-sq"><div class="ehp-sqi">' + SQUIRREL + '</div></div></div>'
    + '<div class="efl-fuse"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<p class="efl-why" aria-live="polite"></p>'
    + '<div class="efl-btns"><button class="efl-b off" data-a="0"><b>✋ Wait</b>a stone is wrong</button><button class="efl-b ok" data-a="1"><b>Hop ➜</b>all stones are right</button></div>'
    + '<p class="ehint efl-help">Help the squirrel cross. Swipe right to hop, left to wait.</p></div>';
  const river = qs('.ehp-river', GP), path = qs('.ehp-path', GP), sq = qs('.ehp-sq', GP), sqi = qs('.ehp-sqi', GP), ctx = qs('.ehp-ctx', GP);
  const fuse = qs('.efl-fuse i', GP), why = qs('.efl-why', GP), btns = qa('.efl-b', GP);
  const wait = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  // where the squirrel sits on a stone (or a bank), measured inside the river
  const put = (el, jump) => {
    const r = el.getBoundingClientRect(), q = river.getBoundingClientRect();
    sq.style.transition = jump ? '' : 'none';
    sq.style.transform = 'translate(' + (r.left - q.left + r.width / 2 - 22) + 'px,' + (r.top - q.top - 27) + 'px)';
    if (jump) { sqi.classList.remove('j'); void sqi.offsetWidth; sqi.classList.add('j'); }
  };
  const step = i => {
    clearTimeout(G.timer); G.key = null;
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now(); let done = false, x0 = null;
    const live = () => !!GP && !!G && path.dataset.i === String(i);
    why.textContent = ''; why.className = 'efl-why'; ctx.hidden = it.ctx !== 'formal';
    path.dataset.i = i;
    path.innerHTML = '<span class="ehp-bank a"></span>'
      + it.parts.map((p, k) => '<span class="ehp-stone" style="--d:' + (k * 45) + 'ms">' + esc(p) + '</span>').join('')
      + '<span class="ehp-bank b"><b>🌰 ' + nuts + '</b></span>';
    const stones = qa('.ehp-stone', path), A = qs('.ehp-bank.a', path), B = qs('.ehp-bank.b', path), bad = it.good ? null : stones[it.err];
    sq.classList.remove('splash'); put(A);
    btns.forEach(b => { b.disabled = false; });
    const hopTo = async el => { if (!live()) return; put(el, true); sfx('tap'); await wait(HOP); };
    const cross = async () => { for (const s of stones) await hopTo(s); await hopTo(B); if (live()) { nuts++; qs('b', B).textContent = '🌰 ' + nuts; B.classList.add('got'); } };
    // the wrong stone sinks and the right one comes up in its place
    const fix = async () => { bad.classList.add('sink'); await wait(230); if (!live()) return; bad.className = 'ehp-stone fixed'; bad.textContent = it.fixPart; await wait(200); };
    const tell = right => {
      why.className = 'efl-why show ' + (right ? 'ok' : 'bad');
      why.innerHTML = '<b>' + (it.good ? (right ? '✓ Yes, the sentence is right.' : 'Every stone was fine. This sentence is right.') : (right ? '✓ Yes, that stone was wrong.' : pick != null ? 'Not that stone.' : 'One stone was wrong.') + ' Say “' + esc(it.fix) + '”.') + '</b> ' + esc(it.why) + TAP;
      holdThen(3600, () => step(i + 1));
    };
    // Wait: now the student must tap the stone that is wrong
    let picking = false;
    const ask = () => {
      if (done || picking || !G) return; picking = true;
      btns.forEach(b => { b.disabled = true; }); path.classList.add('choosing'); sfx('select');
      why.className = 'efl-why show ask'; why.innerHTML = '<b>Which stone is wrong?</b> Tap it.';
      stones.forEach((s, k) => { s.onclick = () => answer({ p: k }); });
      G.key = e => { const k = +e.key - 1; if (k >= 0 && k < stones.length) answer({ p: k }); };
    };
    const answer = async v => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      const ms = Date.now() - t0, pick = v && typeof v === 'object' ? v.p : null;
      const right = it.good ? v === true : pick === it.err;
      R.rec(i, v, 1, ms);
      btns.forEach(b => { b.disabled = true; }); path.classList.remove('choosing'); stones.forEach(s => { s.onclick = null; });
      why.textContent = ''; why.className = 'efl-why';
      if (rush) { const w = getComputedStyle(fuse).width; fuse.style.transition = 'none'; fuse.style.width = w; }
      if (right) {
        runHit(ms, it.lim);
        if (bad) await fix();
        await cross();
        if (!live()) return;
        if (G.replay) return tell(true);
        path.classList.add('out');
        G.timer = setTimeout(() => { path.classList.remove('out'); step(i + 1); }, reduced() ? 40 : 170);
        return;
      }
      runMiss(i, v === null ? 'softbad' : 'wrong');
      if (v === true) {
        // hopped onto a wrong sentence: he gets as far as the wrong stone, and it gives way
        for (const s of stones.slice(0, it.err)) await hopTo(s);
        await hopTo(bad); if (!live()) return;
        bad.classList.add('sink'); sq.classList.add('splash'); sfx('bump'); await wait(380); if (!live()) return;
        bad.className = 'ehp-stone fixed'; bad.textContent = it.fixPart; put(A); sq.classList.remove('splash');
      } else {
        if (pick != null && stones[pick] !== bad) { stones[pick].classList.add('no'); await wait(420); if (!live()) return; }   // tapped a stone that was fine
        if (bad) await fix();                                    // the real wrong stone sinks and the right one comes up
        else stones.forEach(s => s.classList.add('solid'));      // the sentence was right: every stone was fine
      }
      if (live()) tell(false);
    };
    btns.forEach(b => { b.onclick = () => b.dataset.a === '1' ? answer(true) : ask(); });
    G.key = e => { if (e.key === 'ArrowRight') answer(true); else if (e.key === 'ArrowLeft') ask(); };
    river.onpointerdown = e => { if (!done && !picking) x0 = e.clientX; };
    river.onpointerup = e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (dx > 60) answer(true); else if (dx < -60) ask(); };
    river.onpointercancel = () => { x0 = null; };
    if (rush) {
      fuse.style.transition = 'none'; fuse.style.width = '100%'; void fuse.offsetWidth;
      fuse.style.transition = 'width ' + it.lim + 'ms linear'; fuse.style.width = '0%';
      G.timer = setTimeout(() => answer(null), it.lim);
    }
  };
  step(0);
}

/* ---- Express: sentence pieces are coaches in the yard. Tap them in order; a wrong coach bounces back; a full train leaves (8 trains) ---- */
function exGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay;
  pb().innerHTML = '<div class="eex">' + runHud()
    + '<div class="eex-scene">' + SKY + '<span class="eex-signal" aria-hidden="true"></span><div class="eex-train"></div></div>'
    + '<div class="eex-clock"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<p class="eex-note" aria-live="polite"></p><div class="eex-yard" aria-label="Coaches in the yard"></div>'
    + '<p class="ehint eex-help">Some coaches are already on the train. Tap the rest in order, left to right.</p></div>';
  const train = qs('.eex-train', GP), yard = qs('.eex-yard', GP), note = qs('.eex-note', GP), clock = qs('.eex-clock i', GP), sig = qs('.eex-signal', GP);
  const step = i => {
    clearTimeout(G.timer); G.key = null;
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now(); let placed = [], wrong = 0, over = false; const taps = [];
    // places 0..n-1 on the train: some coaches are already there (it.fixed); the empty places fill from left to right
    const gaps = Array.from({ length: it.n }, (_, p) => p).filter(p => !it.fixed.includes(p)), main = it.orders[0];
    note.className = 'eex-note'; note.textContent = G.replay ? 'Hint: ' + it.hint : it.x ? 'One coach doesn’t belong. Leave it in the yard.' : '';
    sig.className = 'eex-signal';
    const draw = () => {
      train.innerHTML = '<span class="eex-eng" aria-hidden="true"><i class="eex-puff"></i><i class="eex-puff b"></i>🚂</span>'
        + Array.from({ length: it.n }, (_, p) => {
            const g = gaps.indexOf(p), txt = c => esc(p === 0 ? capFirst(c) : c);
            const coach = g < 0 ? '<span class="eex-coach fixed">' + txt(main[p]) + '</span>'
              : g < placed.length ? '<span class="eex-coach' + (g === placed.length - 1 && !over ? ' new' : '') + '">' + txt(placed[g]) + '</span>'
              : '<span class="eex-coach slot' + (g === placed.length && !over ? ' next' : '') + '"></span>';
            // the full stop or question mark stays with the last coach when the train wraps
            return p === it.n - 1 ? '<span class="eex-last">' + coach + '<span class="eex-end">' + esc(it.end) + '</span></span>' : coach;
          }).join('');
    };
    yard.innerHTML = it.chunks.map((c, k) => '<button class="eex-coach yard" data-k="' + k + '">' + esc(c) + '</button>').join('');
    train.className = 'eex-train arrive'; draw();
    const leave = () => { sfx('whoosh'); train.classList.remove('arrive'); train.classList.add('go'); G.timer = setTimeout(() => step(i + 1), reduced() ? 60 : 480); };
    const end = completed => {
      over = true; clearTimeout(G.timer);
      const ms = Date.now() - t0, clean = completed && !wrong;
      R.rec(i, taps, 1 + wrong, ms);
      if (rush) { const w = getComputedStyle(clock).width; clock.style.transition = 'none'; clock.style.width = w; }
      qa('button', yard).forEach(b => { b.disabled = true; });
      if (!completed) { placed = gaps.map(p => main[p]); qa('button', yard).forEach(b => b.classList.toggle('used', placed.includes(it.chunks[+b.dataset.k]))); }
      draw();
      train.classList.remove('arrive'); train.classList.add(clean ? 'ok' : completed ? 'meh' : 'late');
      sig.classList.add(clean ? 'green' : 'red');
      if (clean) runHit(ms, it.lim); else runMiss(i, completed ? 'softok' : 'softbad', completed ? 40 : 0);
      if (clean && !G.replay) { note.className = 'eex-note ok'; note.textContent = praise(); G.timer = setTimeout(leave, 520); return; }
      note.className = 'eex-note show ' + (clean ? 'ok' : 'bad');
      note.innerHTML = '<b>' + (clean ? '✓ ' : completed ? 'Built it. ' : '⏱ Time’s up. Here’s the sentence. ') + '</b>' + esc(it.why) + TAP;
      holdThen(3600, leave);
    };
    yard.onclick = e => {
      const b = e.target.closest('[data-k]'); if (!b || over || b.classList.contains('used')) return;
      const text = it.chunks[+b.dataset.k], next = [...placed, text];
      taps.push(text);
      if (it.orders.some(o => next.every((c, j) => o[gaps[j]] === c))) {
        placed.push(text); b.classList.add('used'); sfx('select'); draw();
        if (placed.length === gaps.length) end(true);
      } else {
        // wrong coach: it bounces back. A hint after the second wrong tap.
        wrong++; sfx('wrong'); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
        if (wrong === 2 && !G.replay) { note.className = 'eex-note'; note.textContent = 'Hint: ' + it.hint; }
        if (taps.length >= 38) end(false);
      }
    };
    if (rush) {
      clock.style.transition = 'none'; clock.style.width = '100%'; void clock.offsetWidth;
      clock.style.transition = 'width ' + it.lim + 'ms linear'; clock.style.width = '0%';
      G.timer = setTimeout(() => end(false), it.lim);
    }
  };
  step(0);
}

/* ---- Dive (game id: pairup): a hungry kingfisher sits on a branch above a pond. The sign next to him shows a word and
        what to look for (opposite of, same as, goes with, or a picture). Four fish swim below, each carrying a word.
        Tap the right fish and he dives and catches it; tap a wrong one and it darts away. 20 dives. ---- */
const DIVE_ASK = { pic: 'What is this?', opp: 'Opposite of', mean: 'Same as', go: 'Goes with' };
const KINGFISHER = '<svg viewBox="0 0 60 46" aria-hidden="true"><path d="M9 30 0 39l13-3z" fill="#1565C0"/><ellipse cx="22" cy="27" rx="15" ry="12" fill="#FF8A3D"/>'
  + '<path d="M7 25Q9 10 26 12Q37 14 37 27Q24 20 7 25Z" fill="#1E88E5"/><circle cx="36" cy="15" r="10" fill="#1E88E5"/><path d="M29 20q7 6 13 0v5q-6 4-13 0z" fill="#fff"/>'
  + '<circle cx="39" cy="13" r="2.6" fill="#fff"/><circle cx="39.7" cy="13" r="1.4" fill="#1E1B2E"/><path d="M44 12.5 60 16l-16 4z" fill="#37474F"/>'
  + '<path d="M18 38v6M26 38v6" stroke="#E64A19" stroke-width="2.4" stroke-linecap="round"/></svg>';
// the words sit on lily pads; a small fish hides under each pad, so the kingfisher is the biggest animal in the scene
const MINI_FISH = '<svg class="edv-mini" viewBox="0 0 34 18" aria-hidden="true"><path d="M8 9 0 2v14z" fill="#F76707"/><ellipse cx="19" cy="9" rx="13" ry="7.5" fill="#FF922B"/><circle cx="26" cy="7" r="1.8" fill="#1E1B2E"/></svg>';
function puGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay;
  let caught = 0;
  pb().innerHTML = '<div class="edv">' + runHud()
    + '<div class="edv-pond"><div class="edv-sky"><span class="edv-branch" aria-hidden="true"></span><span class="edv-bird" aria-hidden="true">' + KINGFISHER + '</span>'
    + '<div class="edv-sign"><small></small><b></b></div><span class="edv-basket" aria-hidden="true">🐟 <b>0</b></span></div>'
    + '<div class="edv-water"><div class="edv-rip" aria-hidden="true"></div><div class="edv-school"></div></div></div>'
    + '<div class="erun-clock"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<p class="edv-note" aria-live="polite"></p>'
    + '<p class="ehint edv-help">The kingfisher is hungry. Read the sign and tap the right leaf. A fish hides under it.</p></div>';
  const pond = qs('.edv-pond', GP), bird = qs('.edv-bird', GP), sign = qs('.edv-sign', GP), school = qs('.edv-school', GP);
  const note = qs('.edv-note', GP), clock = qs('.erun-clock i', GP), basket = qs('.edv-basket', GP);
  const wait = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  // the bird flies down to a fish and back to his branch
  const dive = async fish => {
    if (reduced() || !bird.animate) return;
    const f = fish.getBoundingClientRect(), b = bird.getBoundingClientRect();
    const dx = f.left + f.width / 2 - b.left - b.width / 2, dy = f.top - b.top - 6;
    await bird.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(48deg)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' }).finished;
    const sp = document.createElement('i'); sp.className = 'edv-splash'; const p = pond.getBoundingClientRect();
    sp.style.left = (f.left + f.width / 2 - p.left) + 'px'; sp.style.top = (f.top - p.top) + 'px'; pond.appendChild(sp); setTimeout(() => sp.remove(), 600);
    sfx('whoosh');
  };
  const back = () => { if (!reduced() && bird.animate) bird.animate([{ transform: getComputedStyle(bird).transform }, { transform: 'translate(0,0) rotate(0)' }], { duration: 340, easing: 'ease-out', fill: 'forwards' }); };
  const step = i => {
    clearTimeout(G.timer); G.key = null;
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now(); let done = false;
    const live = () => !!GP && !!G && school.dataset.i === String(i);
    note.textContent = ''; note.className = 'edv-note';
    qs('small', sign).textContent = DIVE_ASK[it.k];
    qs('b', sign).innerHTML = it.k === 'pic' ? '<span class="edv-emo">' + esc(it.a) + '</span>' : esc(it.a);
    sign.classList.remove('flip'); void sign.offsetWidth; sign.classList.add('flip');
    school.dataset.i = i;
    school.innerHTML = it.opts.map((o, k) => '<button class="edv-fish f' + k + '" data-o="' + k + '" style="--d:' + (k * 60) + 'ms"><span class="edv-body">' + esc(o) + '</span>' + MINI_FISH + '</button>').join('');
    const fishes = qa('.edv-fish', school), good = fishes[it.opts.indexOf(it.b)];
    const answer = async (v, fish) => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      const ms = Date.now() - t0, right = v === it.b;
      R.rec(i, v, 1, ms);
      fishes.forEach(f => { f.disabled = true; });
      if (rush) { const w = getComputedStyle(clock).width; clock.style.transition = 'none'; clock.style.width = w; }
      if (fish) await dive(fish);
      if (!live()) return;
      if (right) {
        runHit(ms, it.lim); fish.classList.add('caught'); caught++; qs('b', basket).textContent = caught;
        basket.classList.remove('ebump'); void basket.offsetWidth; basket.classList.add('ebump');
        back(); await wait(360); if (!live()) return;
        if (!G.replay) return step(i + 1);
      } else {
        runMiss(i, v === null ? 'softbad' : 'wrong');
        if (fish) { fish.classList.add('dart'); back(); }       // the wrong fish gets away
        good.classList.add('glow');
      }
      note.className = 'edv-note show ' + (right ? 'ok' : 'bad');
      note.innerHTML = '<b>' + (v === null ? '⏱ Too slow. ' : right ? '✓ ' : '') + (it.k === 'pic' ? esc(it.a) + ' = ' : esc(DIVE_ASK[it.k]) + ' <i>' + esc(it.a) + '</i>: ') + esc(it.b) + '</b>' + TAP;
      holdThen(2600, () => step(i + 1));
    };
    fishes.forEach(f => { f.onclick = () => answer(it.opts[+f.dataset.o], f); });
    G.key = e => { const k = '1234'.indexOf(e.key); if (k >= 0 && fishes[k]) fishes[k].click(); };
    if (rush) {
      clock.style.transition = 'none'; clock.style.width = '100%'; void clock.offsetWidth;
      clock.style.transition = 'width ' + it.lim + 'ms linear'; clock.style.width = '0%';
      G.timer = setTimeout(() => answer(null, null), it.lim);
    }
  };
  step(0);
}

/* ---- Real or Fake: a koel hides its eggs in a crow's nest (koels really do this). Each word is an egg.
        A real word is the crow's own egg: keep it and a chick hatches. A wrong spelling or a made-up word is a koel's
        egg: push it out. Keep a fake egg and a noisy koel chick hatches. After every egg the meaning (or the right
        spelling) stays on screen for a few seconds, because students need time to read it. 20 eggs. ---- */
const CROW = '<svg viewBox="0 0 76 60" aria-hidden="true"><path d="M10 36 0 46l14-2z" fill="#22252B"/><ellipse cx="30" cy="36" rx="20" ry="15" fill="#2B2F36"/><path d="M34 26q14-4 16 8q-6 12-18 10z" fill="#8A9099"/>'
  + '<circle cx="50" cy="20" r="12" fill="#2B2F36"/><circle cx="54" cy="17" r="3" fill="#fff"/><circle cx="55" cy="17" r="1.6" fill="#111"/><path d="M60 17 76 22l-15 5z" fill="#15171B"/>'
  + '<path d="M26 50v8M36 50v8" stroke="#15171B" stroke-width="3" stroke-linecap="round"/></svg>';
const CHICK = '<svg viewBox="0 0 40 36" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="#9AA1AB"/><circle cx="15" cy="16" r="2.4" fill="#111"/><circle cx="25" cy="16" r="2.4" fill="#111"/><path d="M16 21h8l-4 6z" fill="#F0A43A"/><path d="M14 6q6-6 12 0" fill="none" stroke="#9AA1AB" stroke-width="3" stroke-linecap="round"/></svg>';
const KOEL = '<svg viewBox="0 0 40 36" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="#1B2440"/><circle cx="15" cy="16" r="3" fill="#E5484D"/><circle cx="25" cy="16" r="3" fill="#E5484D"/><circle cx="15" cy="16" r="1.2" fill="#111"/><circle cx="25" cy="16" r="1.2" fill="#111"/><path d="M14 21h12l-6 9z" fill="#C9D36A"/></svg>';
function rfGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay;
  let chicks = 0;
  pb().innerHTML = '<div class="enst">' + runHud()
    + '<div class="enst-tree"><span class="enst-leaf a" aria-hidden="true"></span><span class="enst-leaf b" aria-hidden="true"></span><span class="enst-crow" aria-hidden="true">' + CROW + '</span>'
    + '<span class="enst-count" aria-hidden="true">🐥 <b>0</b></span><div class="enst-nest"><div class="enst-slot"></div><span class="enst-bowl" aria-hidden="true"></span></div></div>'
    + '<div class="erun-clock"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<div class="enst-info" aria-live="polite"></div>'
    + '<div class="efl-btns"><button class="efl-b off" data-a="0"><b>✗ Fake egg</b>wrong spelling or not a word</button><button class="efl-b ok" data-a="1"><b>✓ Real egg</b>a real word</button></div>'
    + '<p class="ehint efl-help">Help the crow. Keys: ← fake, → real.</p></div>';
  const slot = qs('.enst-slot', GP), info = qs('.enst-info', GP), clock = qs('.erun-clock i', GP), btns = qa('.efl-b', GP), crow = qs('.enst-crow', GP), count = qs('.enst-count', GP);
  const step = i => {
    clearTimeout(G.timer); G.key = null;
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now(); let done = false;
    info.className = 'enst-info'; info.innerHTML = '';
    slot.innerHTML = '<div class="enst-egg in"><b>' + esc(it.w) + '</b></div>';
    const egg = qs('.enst-egg', slot);
    btns.forEach(b => { b.disabled = false; });
    const answer = v => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      const ms = Date.now() - t0, right = v === it.real;
      R.rec(i, v, 1, ms);
      btns.forEach(b => { b.disabled = true; });
      if (rush) { const w = getComputedStyle(clock).width; clock.style.transition = 'none'; clock.style.width = w; }
      if (right) runHit(ms, it.lim); else { runMiss(i, v === null ? 'softbad' : 'wrong'); if (it.real && !G.replay) G.missed.push(it.w); }
      // what happens to the egg
      egg.classList.remove('in');
      if (v === true) {            // kept: it hatches. A real egg gives a crow chick, a fake one a koel chick
        egg.classList.add('hatch');
        slot.insertAdjacentHTML('beforeend', '<span class="enst-baby' + (it.real ? '' : ' koel') + '">' + (it.real ? CHICK : KOEL) + '</span>');
        if (it.real) { chicks++; qs('b', count).textContent = chicks; count.classList.remove('ebump'); void count.offsetWidth; count.classList.add('ebump'); }
      } else if (v === false) {    // pushed out of the nest
        egg.classList.add(it.real ? 'back' : 'roll'); crow.classList.remove('peck'); void crow.offsetWidth; crow.classList.add('peck');
      } else egg.classList.add(it.real ? 'realglow' : 'fakeglow');
      const head = v === null ? '⏱ Too slow.' : right ? '✓ ' + praise() : v === true ? 'Koo! That egg was fake.' : 'Oh no. That egg was real.';
      let body;
      if (it.real) body = '<p><b>' + esc(it.w) + '</b> is a real word. It means: ' + esc(it.m) + '.</p>' + (it.ex ? '<p class="erf-ex">“' + exBold(it.ex, it.w) + '”</p>' : '');
      else if (it.k === 'spell') body = '<p><b>' + esc(it.w) + '</b> is a wrong spelling.</p><p class="erf-fix">Right spelling: <b>' + esc(it.r) + '</b></p>';
      else body = '<p><b>' + esc(it.w) + '</b> is not a word.</p><p class="erf-fix">Say: <b>' + esc(it.r) + '</b></p>';
      info.className = 'enst-info show ' + (right ? 'ok' : 'bad');
      info.innerHTML = '<p class="erf-head">' + head + '</p>' + body + TAP;
      // time to read: 5 s after a right answer, 7 s after a miss; a tap moves on sooner
      holdThen(right ? 5000 : 7000, () => step(i + 1));
    };
    btns.forEach(b => { b.onclick = () => answer(b.dataset.a === '1'); });
    G.key = e => { if (e.key === 'ArrowRight') answer(true); else if (e.key === 'ArrowLeft') answer(false); };
    if (rush) {
      clock.style.transition = 'none'; clock.style.width = '100%'; void clock.offsetWidth;
      clock.style.transition = 'width ' + it.lim + 'ms linear'; clock.style.width = '0%';
      G.timer = setTimeout(() => answer(null), it.lim);
    }
  };
  step(0);
}

/* ---- Munch (writing): a hungry goat stands under a hedge. The sentence grows on the hedge, one word per leaf, and one
        word is extra. He eats only extra words. Tap the extra leaf: he trots under it, jumps and eats it, and the sentence
        closes up. Tap a needed word: he takes a bite, pulls a face and spits it out, then eats the real extra word, so the
        fixed sentence is always shown. 12 sentences. ---- */
const GOAT = '<svg viewBox="0 0 74 62" aria-hidden="true"><path d="M13 30Q5 22 9 15q3 7 8 11z" fill="#E6DCCB"/>'
  + '<path d="M18 42v15M26 43v14M41 43v14M49 42v15" stroke="#6B5B4E" stroke-width="5" stroke-linecap="round"/>'
  + '<ellipse cx="33" cy="35" rx="23" ry="13.5" fill="#F7F1E6"/><ellipse cx="26" cy="31" rx="9" ry="7" fill="#CC9A68"/><ellipse cx="38" cy="43" rx="14" ry="4" fill="#E6DCCB"/>'
  + '<path d="M47 31q3-11 9-16l7 7q-5 6-7 13z" fill="#F7F1E6"/>'
  + '<path d="M53 11q-4-9 3-11q-3 4 0 11z" fill="#8C7B6B"/><path d="M58 10q-1-9 6-10q-4 4-2 10z" fill="#9C8B7B"/>'
  + '<ellipse cx="60" cy="18" rx="10.5" ry="8.5" fill="#F7F1E6"/><ellipse cx="68" cy="21.5" rx="5.6" ry="5" fill="#EBDCC8"/>'
  + '<path d="M54 15q-10 0-13 7q8 1 13-3z" fill="#CC9A68"/>'
  + '<circle cx="61.5" cy="15.5" r="2.4" fill="#1E1B2E"/><circle cx="62.3" cy="14.7" r=".8" fill="#fff"/><circle cx="70.6" cy="20" r="1.1" fill="#5A3A1E"/>'
  + '<path class="emu-mouth" d="M66 25q2.5 1.8 5 0" fill="none" stroke="#5A3A1E" stroke-width="1.3" stroke-linecap="round"/>'
  + '<path d="M62 25l1.6 8 3.4-6.4z" fill="#E6DCCB"/></svg>';
function muGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay;
  let ate = 0, gx = 0;
  pb().innerHTML = '<div class="emu">' + runHud()
    + '<div class="emu-field"><span class="emu-sun" aria-hidden="true"></span><p class="ehp-ctx emu-ctx" hidden>📧 In a formal email or interview</p>'
    + '<span class="emu-count" aria-hidden="true">🌿 <b>0</b></span>'
    + '<div class="emu-hedge"></div><div class="emu-grass" aria-hidden="true"></div>'
    + '<span class="emu-goat" aria-hidden="true"><span class="emu-goati">' + GOAT + '</span><i class="emu-say"></i></span></div>'
    + '<div class="erun-clock"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<p class="edv-note emu-note" aria-live="polite"></p>'
    + '<p class="ehint emu-help">One word is extra. Tap it, and the goat eats it.</p></div>';
  const field = qs('.emu-field', GP), hedge = qs('.emu-hedge', GP), goat = qs('.emu-goat', GP), gi = qs('.emu-goati', GP), bub = qs('.emu-say', GP);
  const note = qs('.emu-note', GP), clock = qs('.erun-clock i', GP), count = qs('.emu-count', GP), ctx = qs('.emu-ctx', GP);
  const wait = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  const pose = c => { gi.classList.remove('bite', 'bleh', 'yum'); void gi.offsetWidth; if (c) gi.classList.add(c); };
  const speak = t => { bub.textContent = t; bub.classList.remove('on'); void bub.offsetWidth; bub.classList.add('on'); };
  // the goat trots along the grass until his mouth is under the leaf
  const walkTo = async leaf => {
    const r = leaf.getBoundingClientRect(), f = field.getBoundingClientRect(), w = goat.offsetWidth;
    const x = Math.max(4, Math.min(f.width - w - 4, r.left - f.left + r.width / 2 - w * 0.9)), d = Math.abs(x - gx);
    gx = x;
    if (reduced()) { goat.style.transition = 'none'; goat.style.transform = 'translateX(' + x + 'px)'; return; }
    goat.style.transition = 'transform ' + Math.round(Math.min(460, 140 + d * 1.1)) + 'ms ease-in-out';
    goat.style.transform = 'translateX(' + x + 'px)';
    gi.classList.add('trot');
    await wait(Math.min(460, 140 + d * 1.1));
    gi.classList.remove('trot');
  };
  // jump up and bite: the leaf flies into his mouth
  const bite = async leaf => {
    await walkTo(leaf); if (!G) return;
    pose('bite'); sfx('tap');
    const r = leaf.getBoundingClientRect(), g = goat.getBoundingClientRect();
    if (!reduced() && leaf.animate) await leaf.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + (g.right - 10 - r.left - r.width / 2) + 'px,' + (g.top + 18 - r.top - r.height / 2) + 'px) scale(.2) rotate(40deg)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
  };
  // the eaten leaf shrinks to nothing, so the words close up into the fixed sentence
  const swallow = leaf => { leaf.style.width = leaf.offsetWidth + 'px'; void leaf.offsetWidth; leaf.classList.add('gone'); };
  const step = i => {
    clearTimeout(G.timer); G.key = null;
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now(); let done = false;
    const live = () => !!GP && !!G && hedge.dataset.i === String(i);
    note.textContent = ''; note.className = 'edv-note emu-note'; ctx.hidden = it.ctx !== 'formal';
    hedge.dataset.i = i; pose('');
    hedge.innerHTML = it.words.map((w, k) => '<button class="emu-leaf" data-k="' + k + '" style="--d:' + (k * 35) + 'ms;--r:' + ((k * 37 % 9) - 4) + 'deg">' + esc(w) + '</button>').join('');
    const leaves = qa('.emu-leaf', hedge), extra = leaves[it.x];
    const answer = async k => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      const ms = Date.now() - t0, right = k === it.x;
      R.rec(i, k, 1, ms);
      leaves.forEach(l => { l.disabled = true; });
      if (rush) { const w = getComputedStyle(clock).width; clock.style.transition = 'none'; clock.style.width = w; }
      if (right) {
        runHit(ms, it.lim);
        await bite(extra); if (!live()) return;
        swallow(extra); pose('yum'); speak(['Yum!', 'Crunchy.', 'Tasty!', 'More!'][i % 4]);
        ate++; qs('b', count).textContent = ate; count.classList.remove('ebump'); void count.offsetWidth; count.classList.add('ebump');
        await wait(560); if (!live()) return;
        if (!G.replay) return step(i + 1);
      } else {
        runMiss(i, k == null ? 'softbad' : 'wrong');
        if (k != null) {
          // a needed word: he bites, pulls a face and spits it back onto the hedge
          const leaf = leaves[k];
          await bite(leaf); if (!live()) return;
          if (leaf.getAnimations) leaf.getAnimations().forEach(a => a.cancel());
          leaf.classList.add('spat'); pose('bleh'); speak('Bleh! I need that one.'); sfx('bump');
          await wait(700); if (!live()) return;
        }
        extra.classList.add('glow'); await wait(380); if (!live()) return;
        await bite(extra); if (!live()) return;
        swallow(extra); pose('yum');
      }
      note.className = 'edv-note show ' + (right ? 'ok' : 'bad');
      note.innerHTML = '<b>' + (k == null ? '⏱ Too slow. ' : right ? '✓ ' : 'Not “' + esc(it.words[k].replace(/[.,?!]$/, '')) + '”. ') + 'The extra word is “' + esc(it.words[it.x].replace(/[.,?!]$/, '')) + '”.</b> ' + esc(it.why) + TAP;
      holdThen(right ? 2600 : 4600, () => step(i + 1));
    };
    leaves.forEach(l => { l.onclick = () => answer(+l.dataset.k); });
    G.key = e => { const k = +e.key - 1; if (e.key >= '1' && e.key <= '9' && leaves[k]) answer(k); };
    if (rush) {
      clock.style.transition = 'none'; clock.style.width = '100%'; void clock.offsetWidth;
      clock.style.transition = 'width ' + it.lim + 'ms linear'; clock.style.width = '0%';
      G.timer = setTimeout(() => answer(null), it.lim);
    }
  };
  step(0);
}

/* ---- Pigeon Post (reading): a pigeon flies in with a note (a chat, notice, email or poster). The tag on his leg asks
        one question. Three houses stand below, each with an answer on its sign. Tap the right house: he flies there, the
        letter drops through the door and the window lights up. Wrong house: the door stays shut and he flies back.
        8 notes. ---- */
const PIGEON = '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M14 28 0 34l2-9 13-1z" fill="#5C6675"/>'
  + '<ellipse cx="28" cy="28" rx="18" ry="12" fill="#A7B1BF"/><path d="M14 24q12-14 30-4q-10 12-30 4z" fill="#8792A3"/><path d="M22 23q8 3 16-1M20 27q9 3 18-1" stroke="#4E5868" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<path d="M38 22q4-10 10-11l4 9q-5 4-10 9z" fill="#5FA88B"/><path d="M40 27q4-5 10-6l2 4q-6 3-10 7z" fill="#8A6FB8"/>'
  + '<circle cx="49" cy="13" r="8" fill="#8E99A8"/><circle cx="51.5" cy="11.5" r="2.6" fill="#F28C28"/><circle cx="51.9" cy="11.3" r="1.3" fill="#1E1B2E"/>'
  + '<path d="M56 13l7 2.5-7 2z" fill="#3B4250"/><ellipse cx="56.2" cy="12.6" rx="1.8" ry="1.1" fill="#EDEFF3"/>'
  + '<path d="M25 39v6M32 39v6" stroke="#E07A8C" stroke-width="2.4" stroke-linecap="round"/>'
  + '<g class="epo-env"><rect x="54" y="15" width="11" height="8" rx="1.2" fill="#fff" stroke="#C9B48A" stroke-width="1"/><path d="M54.5 15.5l5 4 5-4" fill="none" stroke="#C9B48A" stroke-width="1"/></g></svg>';
const KIND = { chat: '💬 Chat', note: '📝 Note', notice: '📌 Notice', email: '✉️ Email', poster: '📣 Poster' };
function poGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay;
  let sent = 0;
  pb().innerHTML = '<div class="epo">' + runHud()
    + '<div class="epo-sky">' + SKY + '<span class="epo-count" aria-hidden="true">📬 <b>0</b></span>'
    + '<div class="epo-mail"><span class="epo-bird" aria-hidden="true">' + PIGEON + '</span>'
    + '<div class="epo-note"><div class="epo-head"><span class="epo-kind"></span><span class="epo-from"></span></div><p class="epo-text"></p></div></div>'
    + '<p class="epo-q"><span>🏷️</span><b></b></p>'
    + '<div class="epo-street"></div><div class="epo-road" aria-hidden="true"></div></div>'
    + '<div class="erun-clock"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<p class="edv-note epo-why" aria-live="polite"></p>'
    + '<p class="ehint epo-help">Read the note. Then tap the house with the right answer.</p></div>';
  const bird = qs('.epo-bird', GP), noteEl = qs('.epo-note', GP), street = qs('.epo-street', GP), q = qs('.epo-q b', GP);
  const why = qs('.epo-why', GP), clock = qs('.erun-clock i', GP), count = qs('.epo-count', GP);
  const wait = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  // he flies to a house and back to the note
  const fly = async house => {
    if (reduced() || !bird.animate) return;
    const h = house.getBoundingClientRect(), b = bird.getBoundingClientRect();
    const dx = h.left + h.width / 2 - b.left - b.width / 2, dy = h.top - b.top - b.height * 0.55;
    await bird.animate([{ transform: 'none' }, { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 30) + 'px) rotate(8deg)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px)' }], { duration: 520, easing: 'ease-in-out', fill: 'forwards' }).finished.catch(() => {});
  };
  const home = () => { if (!reduced() && bird.animate) bird.animate([{ transform: getComputedStyle(bird).transform }, { transform: 'none' }], { duration: 420, easing: 'ease-out', fill: 'forwards' }); };
  const step = i => {
    clearTimeout(G.timer); G.key = null;
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], t0 = Date.now(); let done = false;
    const live = () => !!GP && !!G && street.dataset.i === String(i);
    why.textContent = ''; why.className = 'edv-note epo-why';
    qs('.epo-kind', noteEl).textContent = KIND[it.kind] || KIND.note;
    qs('.epo-from', noteEl).textContent = 'From: ' + it.from;
    qs('.epo-text', noteEl).textContent = it.text;
    noteEl.classList.remove('in'); void noteEl.offsetWidth; noteEl.classList.add('in');
    bird.classList.remove('arrive'); void bird.offsetWidth; bird.classList.add('arrive'); bird.classList.remove('noenv');
    q.textContent = it.q;
    street.dataset.i = i;
    street.innerHTML = it.opts.map((o, k) => '<button class="epo-house h' + k + '" data-o="' + k + '" style="--d:' + (k * 70) + 'ms"><span class="epo-roof"></span><span class="epo-wall"><span class="epo-win"></span>'
      + '<b class="epo-sign">' + esc(o) + '</b><span class="epo-door"></span></span></button>').join('');
    const houses = qa('.epo-house', street), good = houses[it.opts.indexOf(it.a)];
    const answer = async (v, house) => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      const ms = Date.now() - t0, right = v === it.a;
      R.rec(i, v, 1, ms);
      houses.forEach(h => { h.disabled = true; });
      if (rush) { const w = getComputedStyle(clock).width; clock.style.transition = 'none'; clock.style.width = w; }
      if (house) { sfx('whoosh'); await fly(house); }
      if (!live()) return;
      if (right) {
        runHit(ms, it.lim); house.classList.add('lit'); bird.classList.add('noenv');
        sent++; qs('b', count).textContent = sent; count.classList.remove('ebump'); void count.offsetWidth; count.classList.add('ebump');
        home(); await wait(650); if (!live()) return;
        if (!G.replay) return step(i + 1);
      } else {
        runMiss(i, v == null ? 'softbad' : 'wrong');
        if (house) house.classList.add('shut');
        home(); good.classList.add('glow');
      }
      why.className = 'edv-note show ' + (right ? 'ok' : 'bad');
      why.innerHTML = '<b>' + (v == null ? '⏱ Too slow. ' : right ? '✓ ' : 'Wrong house. ') + 'The answer is “' + esc(it.a) + '”.</b> ' + esc(it.why) + TAP;
      holdThen(right ? 3000 : 6000, () => step(i + 1));
    };
    houses.forEach(h => { h.onclick = () => answer(it.opts[+h.dataset.o], h); });
    G.key = e => { const k = '123'.indexOf(e.key); if (k >= 0 && houses[k]) houses[k].click(); };
    if (rush) {
      clock.style.transition = 'none'; clock.style.width = '100%'; void clock.offsetWidth;
      clock.style.transition = 'width ' + it.lim + 'ms linear'; clock.style.width = '0%';
      G.timer = setTimeout(() => answer(null, null), it.lim);
    }
  };
  step(0);
}

/* ---- Echo (listening): it is dark in the cave, and the bat finds his way by sound. A sentence plays ONCE (owner's rule;
        Miss Replay may play it again). It is written on the cave wall with 1-3 dark gaps. For each gap, tap one of three
        words: a right word lights a lamp, a wrong one shows the right word in red. All lamps lit: the bat flies out.
        10 sentences. In Rush the clock starts when the sound ends. ---- */
const BAT = '<svg viewBox="0 0 80 48" aria-hidden="true"><path d="M40 24Q26 4 4 10q8 4 6 10q8-2 10 6q8-4 12 2z" fill="#6E4FA8"/><path d="M40 24Q54 4 76 10q-8 4-6 10q-8-2-10 6q-8-4-12 2z" fill="#6E4FA8"/>'
  + '<path d="M30 14l-3-11 9 7zM50 14l3-11-9 7z" fill="#4E3580"/><ellipse cx="40" cy="25" rx="12" ry="13" fill="#5B3F8C"/>'
  + '<circle cx="35" cy="21" r="4.6" fill="#fff"/><circle cx="45" cy="21" r="4.6" fill="#fff"/><circle cx="35.8" cy="21.6" r="2.3" fill="#1E1B2E"/><circle cx="44.2" cy="21.6" r="2.3" fill="#1E1B2E"/>'
  + '<path d="M36 30q4 3 8 0" fill="none" stroke="#2A1C4A" stroke-width="1.4" stroke-linecap="round"/><path d="M37 30.6l1 2.4 1-2.2M41 30.8l1 2.2 1-2.4" fill="#fff"/>'
  + '<ellipse cx="40" cy="31" rx="6" ry="3" fill="#7E62B8" opacity=".5"/></svg>';
function ecGame(){
  const R = runCtx(), items = R.items, rush = G.mode === 'rush' && !G.replay;
  let lit = 0;
  pb().innerHTML = '<div class="eec">' + runHud()
    + '<div class="eec-cave"><span class="eec-drip a" aria-hidden="true"></span><span class="eec-drip b" aria-hidden="true"></span><span class="eec-drip c" aria-hidden="true"></span>'
    + '<span class="eec-count" aria-hidden="true">💡 <b>0</b></span>'
    + '<div class="eec-batbox" aria-hidden="true"><span class="eec-wave"><i></i><i></i><i></i></span><span class="eec-bat">' + BAT + '</span></div>'
    + '<p class="eec-state" aria-live="polite"></p><div class="eec-wall"></div>'
    + '<button class="ebtn sm eec-play" hidden>🔊 Tap to hear it</button></div>'
    + '<div class="erun-clock"' + (rush ? '' : ' hidden') + '><i></i></div>'
    + '<div class="eec-tiles"></div>'
    + '<p class="edv-note eec-why" aria-live="polite"></p>'
    + '<p class="ehint eec-help">Listen once. Tap the missing words in order.</p></div>';
  const cave = qs('.eec-cave', GP), bat = qs('.eec-batbox', GP), wall = qs('.eec-wall', GP), tiles = qs('.eec-tiles', GP), state = qs('.eec-state', GP);
  const play = qs('.eec-play', GP), why = qs('.eec-why', GP), clock = qs('.erun-clock i', GP), count = qs('.eec-count', GP);
  const wait = ms => new Promise(res => setTimeout(res, reduced() ? 0 : ms));
  const step = i => {
    clearTimeout(G.timer); G.key = null; Voice.stop();
    if (i >= items.length) return endRun();
    gprog(i / items.length);
    const it = items[i], picks = [];
    let tEnd = 0, played = 0, done = false, g = 0;
    const live = () => !!GP && !!G && wall.dataset.i === String(i);
    why.textContent = ''; why.className = 'edv-note eec-why'; play.hidden = true;
    bat.classList.remove('out'); cave.classList.remove('win');
    wall.dataset.i = i;
    wall.innerHTML = it.parts.map(p => p.t != null ? '<span class="eec-t">' + esc(p.t) + '</span>' : '<span class="eec-gap" data-g="' + p.g + '"><i class="eec-lamp"></i><b>' + '&nbsp;'.repeat(6) + '</b></span>').join('');
    const gapEl = k => qs('.eec-gap[data-g="' + k + '"]', wall);
    const startClock = () => {
      if (!rush || done) return;
      clock.style.transition = 'none'; clock.style.width = '100%'; void clock.offsetWidth;
      clock.style.transition = 'width ' + it.lim + 'ms linear'; clock.style.width = '0%';
      G.timer = setTimeout(() => finish(true), it.lim);
    };
    // the sound: once in a scored run; Miss Replay can play it again
    const listen = () => {
      if (!live() || done && !G.replay) return;
      played++; play.hidden = true; cave.classList.add('on'); state.textContent = 'Listen…';
      qa('.eec-tile', tiles).forEach(b => { b.disabled = false; });
      Voice.clip(it.clip, why => {
        if (!live()) return;
        cave.classList.remove('on');
        if (why === 'blocked' || why === 'error') { played--; if (!picks.length) qa('.eec-tile', tiles).forEach(b => { b.disabled = true; }); state.textContent = why === 'error' ? 'Couldn’t load the sound.' : ''; play.hidden = false; play.textContent = why === 'error' ? '🔊 Try again' : '🔊 Tap to hear it'; return; }
        if (why !== 'end') return;
        tEnd = Date.now(); state.textContent = done ? '' : 'Now tap the missing words.';
        if (G.replay) { play.hidden = false; play.textContent = '🔊 Hear it again'; }
        startClock();
      });
      if (!tEnd) tEnd = Date.now();   // in case the answer comes before the sound ends
    };
    play.onclick = () => { sfx('tap'); listen(); };
    // the tiles for the gap that is open now
    const showGap = () => {
      qa('.eec-gap', wall).forEach(x => x.classList.toggle('now', +x.dataset.g === g));
      const o = it.gaps[g].o;
      // the words can be tapped once the sound has started
      tiles.innerHTML = o.map((w, k) => '<button class="eec-tile" data-k="' + k + '" style="--d:' + (k * 50) + 'ms"' + (played ? '' : ' disabled') + '>' + esc(w) + '</button>').join('');
      qa('.eec-tile', tiles).forEach(b => { b.onclick = () => pick(o[+b.dataset.k], b); });
    };
    const pick = (w, btn) => {
      if (done || !G) return;
      const gap = it.gaps[g], el = gapEl(g), ok = w === gap.a;
      picks.push(w);
      qs('b', el).textContent = gap.a;
      el.classList.remove('now'); el.classList.add(ok ? 'on' : 'off');
      if (ok) { sfx('select'); lit++; qs('b', count).textContent = lit; count.classList.remove('ebump'); void count.offsetWidth; count.classList.add('ebump'); }
      else { sfx('wrong'); if (btn) { btn.classList.add('nope'); } }
      g++;
      if (g >= it.gaps.length) return finish(false);
      setTimeout(() => { if (live() && !done) showGap(); }, ok ? 120 : 380);
    };
    const finish = async late => {
      if (done || !G) return; done = true; clearTimeout(G.timer);
      if (late) { for (let k = g; k < it.gaps.length; k++) { picks.push(''); const el = gapEl(k); qs('b', el).textContent = it.gaps[k].a; el.classList.add('off'); } }
      if (rush) { const w = getComputedStyle(clock).width; clock.style.transition = 'none'; clock.style.width = w; }
      const ms = tEnd ? Math.max(0, Date.now() - tEnd) : 0, right = picks.every((w, k) => w === it.gaps[k].a);
      R.rec(i, picks, 1, ms);
      qa('.eec-tile', tiles).forEach(b => { b.disabled = true; });
      state.textContent = '';
      await wait(late ? 0 : 260); if (!live()) return;
      tiles.innerHTML = '';
      if (right) {
        runHit(ms, it.lim); cave.classList.add('win'); bat.classList.add('out'); sfx('whoosh');
        await wait(700); if (!live()) return;
        if (!G.replay) return step(i + 1);
      } else runMiss(i, late ? 'softbad' : 'softok');
      why.className = 'edv-note show ' + (right ? 'ok' : 'bad');
      why.innerHTML = '<b>' + (late ? '⏱ Time’s up. ' : right ? '✓ ' : '') + '“' + it.parts.map(p => p.t != null ? esc(p.t) : '<u>' + esc(it.gaps[p.g].a) + '</u>').join('') + '”</b> ' + esc(it.why) + TAP;
      holdThen(right ? 3000 : 5600, () => step(i + 1));
    };
    G.key = e => { const k = '123'.indexOf(e.key); const b = qa('.eec-tile', tiles)[k]; if (k >= 0 && b && !b.disabled) b.click(); };
    showGap();
    state.textContent = 'Get ready…';
    // a short pause so the student is ready; then the sound plays by itself
    G.timer = setTimeout(() => { if (live() && !played) listen(); }, i === 0 ? 500 : 900);
  };
  step(0);
}

/* ---- end card for run games: score, your best, your last runs as a line, Play again first ---- */
function spark(last){
  if (!last || last.length < 2) return '<p class="esub erun-first">Play again to start your score line.</p>';
  const W = 240, H = 64, lo = Math.min(...last), hi = Math.max(...last), span = hi - lo || 1;
  const pts = last.map((v, i) => [14 + i * (W - 28) / (last.length - 1), H - 12 - (v - lo) / span * (H - 26)]);
  return '<figure class="erun-spark"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Your last ' + last.length + ' scores: ' + last.join(', ') + '">'
    + '<polyline points="' + pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ') + '" fill="none" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    + pts.map((p, i) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 6 : 4) + '" fill="' + (i === pts.length - 1 ? '#F0457A' : '#8B5CF6') + '"/>').join('')
    + '</svg><figcaption>Your last ' + last.length + ' runs</figcaption></figure>';
}
function showRun(j){
  j = j || {}; G.lastJ = j; G.replay = null; G.key = null; clearTimeout(G.timer); hush(); gprog(1);
  const game = G.game, g = gameOf(game), S = st();
  const run = j.run || { score: G.score, best: 0, last: [G.score], mode: G.mode, streak: G.bestStreak };
  const items = j.items || G.ids.length, acc = items ? Math.round((j.correct || 0) / items * 100) : 0;
  const isBest = run.score > 0 && run.score > run.best, first = run.last.length < 2;
  const lu = j.levelUp, sk = lu && skillOf(lu.skill);
  const canRush = tester() || !!(S && S.rush && S.rush[game]), opened = canRush && !G.rushWas && !tester();
  const misses = G.missIdx.length, nxt = nextGame(), closedNow = isClosed(), missed = [...new Set(G.missed || [])];
  pb().innerHTML = '<div class="eresult erun-end">' + yap(isBest || lu ? 'correct' : 'idle', 130, 'eyap bob')
    + (lu ? '<div class="elvup" style="--c:' + sk.c + '">⬆️ ' + esc(sk.name) + ' is now <b>Level ' + lu.lv + ': ' + LEVELS[lu.lv - 1] + '</b>!</div>' : '')
    + '<p class="erun-tag">' + g.icon + ' ' + esc(g.name) + ' · ' + (run.mode === 'rush' ? '⚡ Rush' : 'Chill') + '</p>'
    + '<div class="erun-big"><b id="erun-n">0</b>' + (isBest ? '<span class="erun-nb">' + (first ? 'First score!' : 'New best!') + '</span>' : '<span class="erun-pb">Your best: ' + fmt(run.best) + '</span>') + '</div>'
    + spark(run.last)
    + '<div class="egstats"><div><b>' + acc + '%</b><span>right first time</span></div><div><b>🔥 ' + (run.streak || 0) + '</b><span>best streak</span></div><div><b>+' + (j.points || 0) + '</b><span>Adda points</span></div></div>'
    + (opened ? '<p class="erun-unlock">⚡ Rush is open! Same game, now with a clock.</p>' : '')
    + (missed.length ? '<div class="epanel evoffer"><h3>Save words to your Word Vault?</h3><p class="esub">They’ll come back for quick reviews, so they stick.</p>'
      + missed.map(w => '<label class="evchk"><input type="checkbox" value="' + esc(w) + '" checked> ' + esc(w) + '</label>').join('') + '<button class="ebtn purple sm" id="eg-save">Save words</button></div>' : '')
    + (j.points === 0 && !tester() ? '<p class="esub">No points this time: today’s 25 minutes are used up.</p>' : '')
    + '<div class="erun-btns"><button class="ebtn erun-again" id="eg-again">Play again</button><div class="ep-row">'
    + (canRush ? '<button class="ebtn purple sm" id="eg-switch">' + (run.mode === 'rush' ? 'Play Chill' : 'Try ⚡ Rush') + '</button>' : '')
    + (misses ? '<button class="ebtn ghost sm" id="eg-miss">Replay ' + (misses === 1 ? '1 miss' : misses + ' misses') + '</button>' : '')
    + '</div><div class="ep-row">' + (closedNow || !nxt || nxt === game ? '' : '<button class="ebtn ghost sm" id="eg-more">Next: ' + esc(gameOf(nxt).name) + '</button>')
    + '<button class="ebtn ghost sm" id="eg-home">Back to Adda</button></div></div></div>';
  // the score counts up
  const n = qs('#erun-n', GP), t0 = performance.now(), dur = reduced() ? 0 : 700;
  const tickUp = t => { if (!GP || !n.isConnected) return; const f = dur ? Math.min(1, (t - t0) / dur) : 1; n.textContent = fmt(Math.round(run.score * (1 - Math.pow(1 - f, 3)))); if (f < 1) requestAnimationFrame(tickUp); };
  requestAnimationFrame(tickUp);
  if (!G.shown) { G.shown = true; if (lu) { sfx('levelup'); try { if (!reduced()) confetti(); } catch (e) {} } else if (isBest && !first) { sfx('fanfare'); try { if (!reduced()) confetti(); } catch (e) {} } else sfx('star'); }
  const again = mode => { closeGame(); openGame(game, { mode, auto: true }); };
  qs('#eg-again', GP).onclick = () => again(run.mode);
  const sw = qs('#eg-switch', GP); if (sw) sw.onclick = () => again(run.mode === 'rush' ? 'chill' : 'rush');
  const ms = qs('#eg-miss', GP); if (ms) ms.onclick = () => { sfx('tap'); G.replay = G.missIdx.map(i => G.round.items[i]); RUN_GAMES[game](); };
  const more = qs('#eg-more', GP); if (more) more.onclick = () => { closeGame(); openGame(nxt); };
  qs('#eg-home', GP).onclick = () => { sfx('tap'); closeGame(); };
  const save = qs('#eg-save', GP);
  if (save) save.onclick = () => {
    const words = qa('.evchk input:checked', GP).map(x => x.value);
    if (!words.length) { qs('.evoffer', GP).remove(); return; }
    save.disabled = true; save.textContent = 'Saving…';
    api('/api/english', { action: 'vault', op: 'add', token: ME.token, words, source: 'realfake' }, 10000).then(r => {
      const box = qs('.evoffer', GP); if (!box) return;
      if (r.status === 200 && r.j.ok) { sfx('select'); G.missed = []; box.innerHTML = '<p class="esub" style="margin:0">🔐 ' + plural(words.length, 'word') + ' saved. First review tomorrow.</p>'; pull(true); }
      else { save.disabled = false; save.textContent = 'Try again'; }
    });
  };
  qs('#eg-again', GP).focus({ preventScroll: true });
}

/* ---- Word Groups: 16 words, 4 groups of 4, 4 mistakes allowed ---- */
function grGame(){
  const P = G.round.items[0]; G.ids = [P.id]; G.ans = [[]]; G.tries = [0];
  let left = P.words.slice(), sel = new Set(), solved = [], miss = 0, out = false;
  const t0 = Date.now(), tried = new Set();
  // the group names as clues: all shown at tiers 1-2; at tier 3 the hint button shows them one at a time
  const shown = new Set(P.names ? [0, 1, 2, 3] : []);
  gprog(0);
  pb().innerHTML = '<div class="egr"><p class="ecount">Puzzle #' + P.n + ' · find 4 groups of 4</p><div class="egr-clues"></div><div class="egr-solved"></div><div class="egr-grid"></div>'
    + '<div class="egr-miss" aria-label="Mistakes left"></div>'
    + '<div class="ep-row egr-ctl"><button class="ebtn ghost sm" id="egr-mix">Shuffle</button><button class="ebtn ghost sm" id="egr-clear">Deselect</button>' + (P.names ? '' : '<button class="ebtn ghost sm" id="egr-hint">💡 Hint</button>') + '<button class="ebtn sm" id="egr-go" disabled>Submit</button></div>'
    + '<div class="ep-row"><button class="ebtn" id="eg-next" hidden>Next</button></div></div>';
  const grid = qs('.egr-grid', GP), sol = qs('.egr-solved', GP), go = qs('#egr-go', GP);
  const groupOf = w => P.groups.findIndex(g => g.words.includes(w));
  const clues = qs('.egr-clues', GP);
  const draw = () => {
    clues.innerHTML = shown.size ? '<span class="egr-cl-t">' + (P.names ? 'The 4 groups:' : 'Clues:') + '</span>' + P.groups.map((g, k) => shown.has(k) ? '<span class="egr-cl' + (solved.includes(k) ? ' done' : '') + '"' + (solved.includes(k) ? ' style="--g:' + GROUP_C[k] + '"' : '') + '>' + esc(g.name) + '</span>' : '').join('') : '';
    const hb = qs('#egr-hint', GP); if (hb) hb.hidden = out || P.groups.every((g, k) => shown.has(k) || solved.includes(k));
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
  const hint = qs('#egr-hint', GP);
  if (hint) hint.onclick = () => { const k = P.groups.findIndex((g, j) => !shown.has(j) && !solved.includes(j)); if (k < 0) return; sfx('reveal'); shown.add(k); draw(); say('Clue: one group is <b>' + esc(P.groups[k].name) + '</b>.', 'thinking'); };
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
    solved.push(gi); shown.add(gi); left = left.filter(w => !P.groups[gi].words.includes(w)); sel.clear();
    sfx('reveal'); draw(); say('<b>' + esc(P.groups[gi].name) + ':</b> ' + esc(P.groups[gi].why), 'thinking');
    if (solved.length < 4) nextBtn('Show next group', revealNext); else nextBtn('See result', () => end(false));
  };
  go.onclick = () => {
    const guess = [...sel], key = guess.slice().sort().join('|');
    if (tried.has(key)) { toast('You already tried that one.'); return; }
    tried.add(key); G.ans[0].push(guess);
    const gi = P.groups.findIndex((g, k) => !solved.includes(k) && guess.every(w => g.words.includes(w)));
    if (gi >= 0) {
      solved.push(gi); shown.add(gi); left = left.filter(w => !guess.includes(w)); sel.clear();
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
    pb().innerHTML = '<div class="ep-center">' + yap('idle', 150, 'eyap bob') + '<h2 class="ddisplay">Your vault is clear</h2><p class="esub">No words due right now. Words you miss in Real or Fake can be saved here, and they come back on a smart schedule.</p><button class="ebtn" id="eg-close">Back to Adda</button></div>';
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
  const send = () => api('/api/english', { action: 'round', token: ME.token, cid: G.cid, game: G.game, ids: G.ids, answers: G.ans, tries: G.tries, ms: G.ms, secs, n: P ? P.n : undefined, mode: RUN_GAMES[G.game] ? G.mode : undefined }, 12000).then(r => {
    if (!GP) return;
    if (r.status !== 200 || !r.j.ok) return gfail('Couldn’t save this round. Check your internet.', send);
    if (r.j.state) { EA = r.j.state; pulledAt = Date.now(); cacheSave(); }
    if (G.game !== 'vault') rateCount(G.game);
    showResult(r.j);
  });
  send();
}
function showResult(j){
  if (RUN_GAMES[G.game]) return showRun(j);
  const game = G.game, items = j.items || G.ids.length, acc = items ? Math.round((j.correct || 0) / items * 100) : 0;
  const lu = j.levelUp, sk = lu && skillOf(lu.skill);
  const nxt = nextGame(), closedNow = isClosed();
  let head = game === 'groups' ? ((j.correct ? 'Puzzle solved!' : 'Puzzle done')) : acc >= 80 ? 'Great round!' : acc >= 50 ? 'Good round!' : 'Round done!';
  const missed = [...new Set(G.missed || [])];
  pb().innerHTML = '<div class="eresult egres">' + yap(lu || acc >= 80 ? 'correct' : 'idle', 150, 'eyap bob')
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

/* ================= "11-star" rating of the day =================
   Same idea as Brain Gym and Drive School (Airbnb's 11-star exercise): 5 means "it did its job", 7-11 say what great looks like.
   Asked once a day, back on the Adda home after 3 saved rounds (or 1 round once the 15 minutes are done). "Not now" asks
   again next time, at most twice a day. Server copy: /api/english action "rate" (one per student per India day). */
const RATE_K = 'ea_rate';
const ADDA_STARS = { 11: '📺 If Netflix calls, tell them I’m ready to check their English subtitles.', 10: '🧑‍🏫 Next English class, I might help the teacher.',
  9: '💼 Bring on the job emails. HR will reply “You’re hired.”', 8: '📲 Friends, send me your WhatsApp messages. I’ll fix the English.',
  7: '🔥 See you tomorrow, Mithu. Same time.', 5: '👍 Fine. Did the job.', 3: '😐 Meh. Even Mithu looked bored.', 1: '🥱 I’d rather count crows on the wall.' };
/* step 2 of the feedback sheet (feedbackSheet in index.html): one question per star choice, [icon, label, follow-up, choices];
   FB_PLAYED = the games played today. 7-10 are saved as best, the rest as why (see fbSplit in index.html). */
const ADDA_SETS = {
  1: ['Ouch. What went wrong?', [
    ['🐞', 'It didn’t work', 'What went wrong?', ['Sound didn’t play', 'Slow to load', 'A button didn’t work', 'Wrong score']],
    ['🧗', 'Way too hard', 'What was hard?', ['New words', 'Grammar', 'The clock', 'Listening']],
    ['😴', 'Boring', 'What felt boring?', ['Same sentences', 'Too long', 'No challenge']],
    ['🎯', 'Not useful for me', 'What would help?', ['English for jobs', 'Emails and chats', 'Exam English']]]],
  3: ['What made even Mithu bored?', [
    ['🥱', 'Too easy', 'Which game?', FB_PLAYED],
    ['🧩', 'Rules were confusing', 'Which game?', FB_PLAYED],
    ['🔁', 'Same sentences again', 'Which game?', FB_PLAYED],
    ['⏳', 'Too long', 'What would help?', ['Fewer items', 'Shorter rounds']]]],
  5: ['Fine is okay. What would make it a 7?', [
    ['🎮', 'More games', 'What kind?', ['Word games', 'Story games', 'Listening games', 'Writing games']],
    ['📚', 'Words I need', 'Which words?', ['Job words', 'College words', 'Daily life words']],
    ['🔥', 'Harder rounds', 'Harder how?', ['Less time', 'Harder words', 'Longer sentences']],
    ['🤝', 'Play with friends', 'How?', ['1 vs 1', 'Batch contest']]]],
  7: ['What will bring you back tomorrow?', [
    ['🔥', 'My streak', 'What about it?', ['Don’t want to break it', 'Want a longer one']],
    ['🦜', 'Mithu', 'What about him?', ['His jokes', 'His voice', 'His tips']],
    ['🎮', 'A game I like', 'Which one?', FB_PLAYED],
    ['📈', 'Levelling up', 'What pulls you?', ['Close to the next level', 'Beating my best', 'Rush mode']]]],
  8: ['What would you tell your friends about?', [
    ['🎮', 'A game I loved', 'Which one?', FB_PLAYED],
    ['📚', 'Useful words', 'Useful for what?', ['Jobs', 'College', 'Chats and emails']],
    ['🦜', 'Mithu', 'What about him?', ['His jokes', 'His voice', 'His tips']],
    ['⏱️', 'Quick and fun', 'What works?', ['Only 15 minutes', 'Feels like a game']]]],
  9: ['Job-ready feels good! What got better today?', [
    ['📚', 'My words', 'Which game helped?', FB_PLAYED],
    ['✍️', 'My grammar', 'Which game helped?', FB_PLAYED],
    ['📖', 'My reading', 'Which game helped?', FB_PLAYED],
    ['👂', 'My listening', 'Which game helped?', FB_PLAYED]]],
  10: ['What was the best moment today?', [
    ['🎉', 'A new best score', 'In which game?', FB_PLAYED],
    ['📈', 'A level up', 'Which skill?', ['Words', 'Grammar', 'Reading', 'Listening', 'Writing']],
    ['💪', 'Getting a hard one right', 'In which game?', FB_PLAYED],
    ['🦜', 'Mithu made me laugh', 'What did he say?', []]]],
  11: ['Netflix-ready! What would make English Adda legendary?', [
    ['🎬', 'Learn from shows', 'From what?', ['Movie clips', 'Song lines', 'Web series']],
    ['💼', 'Interview English', 'For what?', ['Introduce myself', 'Common questions', 'Group discussion']],
    ['🏆', 'Contests', 'What kind?', ['Batch contest', 'College vs college']],
    ['📲', 'A new word every day', 'When?', ['Morning', 'Before class', 'At night']]]]
};
function rateRec(){
  try { const r = JSON.parse(localStorage.getItem(RATE_K)); if (r && ME && r.id === ME.id && r.day === istDay()) return r; } catch (e) {}
  return { id: ME && ME.id, day: istDay(), rounds: 0, games: [], done: false, later: 0 };
}
function rateSave(r){ try { localStorage.setItem(RATE_K, JSON.stringify(r)); } catch (e) {} }
function rateCount(game){ const r = rateRec(); r.rounds++; if (!r.games.includes(game)) r.games.push(game); rateSave(r); }
function rateDue(){ if (!ME) return false; const r = rateRec(); return !r.done && r.later < 2 && (r.rounds >= 3 || (r.rounds >= 1 && todaySecs() >= GOAL)); }
function rateDay(){
  const rec = rateRec(); let sent = false;
  const played = rec.games.map(id => (gameOf(id) || {}).name).filter(Boolean).slice(0, 8);
  const p = openModal('<div id="ea-box"></div>');
  const box = qs('#mbox');
  feedbackSheet(qs('#ea-box'), {
    head: '<p class="small muted" style="margin:0;font-weight:900;letter-spacing:.06em;text-transform:uppercase">English Adda · One quick thing</p>',
    scroller: box, accent: '#14A37F', label: 'Today’s Adda rating', stars: ADDA_STARS, sets: ADDA_SETS, played, product: 'en', host: ['🦜', 'Mithu'],
    title: 'How high does today go?', send: 'Send feedback', skip: 'Not now',
    onSend: async ans => {
      const r = await api('/api/english', Object.assign({ action: 'rate', token: ME.token, stars: ans.stars }, fbSplit(ans),
        { more: ans.more, text: ans.text, voice: ans.voice, rounds: rec.rounds, secs: todaySecs(), games: rec.games.slice(0, 20) }), 10000);
      if (!(r.status === 200 && r.j.ok) && r.status !== 400) return false;
      sent = true; const now = rateRec(); now.done = true; rateSave(now);
      return true;
    },
    after: () => setTimeout(closeModal, 1900)
  });
  p.then(() => { if (!sent) { const now = rateRec(); now.later++; rateSave(now); } });
}

/* ================= buttons ================= */
document.addEventListener('click', e => {
  if (e.target.closest('[data-echeck]')) openCheck();
  else if (e.target.closest('[data-ehear]')) {
    const [a, b] = MITHU_LINES.hello;
    if (typeof SFX !== 'undefined' && SFX.muted) return toast('Sound is off. Turn it on to hear Mithu.');
    Voice.say(a, why => { if (why === 'end') Voice.say(b); });
  }
  else if (e.target.closest('[data-eplay]')) startNext();
  else if (e.target.closest('[data-egame]')) { const g = e.target.closest('[data-egame]').dataset.egame; if (g !== 'vault' && isClosed()) toast('Adda’s closed for today. Your Word Vault is still open.'); else openGame(g); }
  else if (e.target.closest('[data-tip]')) showTip(e.target.closest('[data-tip]'), true);
});

/* ================= Mithu's hover bubble ================= */
// hover (mouse) or tap/focus (phone, keyboard) on Mithu: a speech bubble pops up above him
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

/* ================= English Profile (My Profiles tab) ================= */
// Private to the student: levels, progress to the next level, games, the last 4 weeks. Data from /api/english action 'profile'.
let PROF = null, profAt = 0, profBox = null;
function profile(box){
  profBox = box || profBox; if (!profBox || !ME) return;
  if (Date.now() - profAt > 30000) {
    profAt = Date.now();
    api('/api/english', { action: 'profile', token: ME.token }).then(r => {
      if (r.status === 200 && r.j.ok) { PROF = r.j.profile; if (profBox && !profBox.hidden) renderProfile(profBox); }
      else if (!PROF) { profAt = 0; profBox.innerHTML = '<div class="card eprof-empty"><p class="muted">Couldn’t load your English Profile. Check your internet and open this tab again.</p></div>'; }
    });
  }
  renderProfile(profBox);
}
function renderProfile(box){
  const p = PROF;
  if (!p) { box.innerHTML = '<div class="card eprof-empty"><p class="muted">Loading your English Profile…</p></div>'; return; }
  if (!p.placed) {
    box.innerHTML = '<div class="card eprof-empty">' + yap('thinking', 120, 'eyap') + '<h2>English Profile</h2>'
      + '<p class="muted">Your profile starts after the 5-minute level check in English Adda. It shows your five skills, how close you are to the next level, and your games.</p>'
      + '<button class="ebtn" data-go="english">Go to English Adda</button></div>';
    return;
  }
  const S = p.skills, lvs = SKILLS.map(s => S[s.k].lv || 1);
  const overall = Math.round(lvs.reduce((a, b) => a + b, 0) / lvs.length);
  const hi = Math.max(...lvs), lo = Math.min(...lvs);
  const best = SKILLS.filter(s => (S[s.k].lv || 1) === hi).map(s => s.name), weak = SKILLS.filter(s => (S[s.k].lv || 1) === lo).map(s => s.name);
  const list = a => a.length < 2 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const line = hi === lo ? 'Your five skills are level with each other. Keep going and watch them climb.'
    : 'Strongest: <b>' + esc(list(best)) + '</b>. Building: <b>' + esc(list(weak)) + '</b>. Today’s games give more time to the skills you’re building.';
  const mins = Math.round(p.secs / 60), pct = (a, b) => b ? Math.round(a / b * 100) : null;
  const stat = (v, l) => '<div class="eprof-stat"><b>' + v + '</b><span>' + l + '</span></div>';

  // one row per skill: level bars, where it started, and the road to the next level
  const skillCard = s => {
    const x = S[s.k], lv = x.lv || 1, nr = x.near, acc = pct(x.ok, x.n);
    let next;
    if (lv >= 8) next = '<p class="eprof-next">Top level. Nothing left to unlock here!</p>';
    else {
      const need = 16, have = nr.ok, left = 20 - nr.n;
      const msg = nr.n < 20 ? 'Answer ' + plural(left, 'more question') + ' at this level, then get 16 of your last 20 right.'
        : nr.ok >= need ? (nr.days < 2 ? 'Almost there! Play this skill on one more day to level up.' : 'Ready: your next round can level you up.')
        : 'Get ' + (need - nr.ok) + ' more right in your last 20 to level up.';
      next = '<div class="eprof-road"><span class="eprof-meter" role="progressbar" aria-label="' + s.name + ': right answers in the last 20 at this level" aria-valuemin="0" aria-valuemax="20" aria-valuenow="' + have + '">'
        + '<i style="width:' + (have / 20 * 100) + '%"></i><em style="left:80%"></em></span><b>' + have + '/20</b></div>'
        + '<p class="eprof-next">' + msg + '</p>';
    }
    let bars = ''; for (let i = 1; i <= 8; i++) bars += '<i' + (i <= lv ? ' class="on"' : '') + '></i>';
    const up = x.start && lv > x.start ? ' <span class="eprof-up">▲ ' + (lv - x.start) + ' since your level check</span>' : '';
    return '<div class="eprof-skill" style="--c:' + s.c + '"><div class="eskill-h"><b>' + s.name + '</b><span>Lv ' + lv + ' · ' + LEVELS[lv - 1] + '</span></div>'
      + '<div class="ebars">' + bars + '</div>'
      + '<p class="eprof-meta">' + (acc == null ? 'No answers yet' : acc + '% right over ' + x.n.toLocaleString('en-IN') + ' answers') + up + '</p>' + next + '</div>';
  };

  // the last 4 weeks, oldest first: full = goal met, light = played a little
  const byDay = Object.fromEntries(p.days.map(x => [x.d, x.s]));
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(p.today + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - i);
    const k = d.toISOString().slice(0, 10), s = byDay[k] || 0;
    const cls = s >= GOAL ? 'goal' : s > 0 ? 'some' : '';
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }) + ': ' + (s >= GOAL ? 'goal done' : s > 0 ? Math.max(1, Math.round(s / 60)) + ' min' : 'not played');
    cells.push('<i class="' + cls + (i === 0 ? ' today' : '') + '" title="' + label + '"></i>');
  }

  const played = GAMES.filter(g => g.built && !g.always && p.games[g.id]);
  const gameRow = g => {
    const x = p.games[g.id], s = skillOf(g.skill), a = pct(x.correct, x.items);
    return '<div class="eprof-game"><span class="eico" style="--c:' + s.c + '">' + g.icon + '</span><span class="eprof-gname"><b>' + esc(g.name) + '</b><small>' + plural(x.rounds, 'round') + (a == null ? '' : ' · ' + a + '% right') + '</small></span>'
      + '<span class="eprof-best"><small>Best</small><b>' + (x.chill || 0).toLocaleString('en-IN') + '</b>' + (x.rush ? '<small>Rush ' + x.rush.toLocaleString('en-IN') + '</small>' : '') + '</span></div>';
  };
  const upName = k => (skillOf(k) || {}).name || k;
  const fmtD = d => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

  box.innerHTML = '<section class="eprof-head">' + yap('correct', 120, 'eyap eprof-yap')
    + '<div><span class="etag">Only you can see this</span><h2 class="ddisplay">Your English Profile</h2>'
    + '<p class="eprof-lv">Level ' + overall + ': <b>' + LEVELS[overall - 1] + '</b></p><p>' + line + '</p></div></section>'
    + '<div class="eprof-stats">' + stat('🔥 ' + p.streak, 'day streak') + stat(p.goalDays, plural(p.goalDays, 'goal day').replace(/^\d+ /, '')) + stat(mins, 'minutes played')
    + stat(Object.values(p.games).reduce((a, g) => a + g.rounds, 0), 'rounds') + stat((p.points || 0).toLocaleString('en-IN'), 'Adda points') + stat(p.vault.total, 'words saved' + (p.vault.mastered ? ' · ' + p.vault.mastered + ' mastered' : '')) + '</div>'
    + '<div class="eprof-grid"><section class="epanel"><h3>Your skills</h3><p class="esub">To level up a skill: 16 of your last 20 answers right at your level, on 2 different days. Levels never go down.</p>'
    + SKILLS.map(skillCard).join('') + '</section>'
    + '<div class="eprof-side"><section class="epanel"><h3>Last 4 weeks</h3><p class="esub">Dark = 15-minute goal done. Light = played a little.</p><div class="eprof-cal">' + cells.join('') + '</div></section>'
    + '<section class="epanel"><h3>Your games</h3>' + (played.length ? '<div class="eprof-games">' + played.map(gameRow).join('') + '</div>' : '<p class="esub">Play a game in English Adda and it shows here with your best score.</p>') + '</section>'
    + (p.ups.length ? '<section class="epanel"><h3>Level-ups</h3><ul class="eprof-ups">' + p.ups.map(u => '<li><span style="--c:' + ((skillOf(u.skill) || {}).c || '#8B5CF6') + '"></span><b>' + esc(upName(u.skill)) + '</b> reached Lv ' + u.to + ' · ' + LEVELS[u.to - 1] + '<small>' + fmtD(u.d) + '</small></li>').join('') + '</ul></section>' : '')
    + '</div></div>';
}

/* ================= hooks for index.html ================= */
// called on every route: shows the tab once the server says this batch can open English Adda
let syncAt = 0;
function sync(){
  if (!ME) { const t = qs('#tab-english'); if (t) t.hidden = true; return; }
  if (OPEN === null) OPEN = openLoad();
  const t = qs('#tab-english'); if (t) t.hidden = OPEN !== true;
  profTabSync();
  if (Date.now() - syncAt > 60000) { syncAt = Date.now(); pull(); }
}
function leave(){ playing = false; flush(); }
function reset(){ flush(true); playing = false; pend = 0; EA = null; OPEN = null; pulledAt = 0; syncAt = 0; PROF = null; profAt = 0; const pb = qs('#m-english'); if (pb) pb.innerHTML = ''; const r = qs('#english-root'); if (r) r.innerHTML = ''; const t = qs('#tab-english'); if (t) t.hidden = true; }
window.Adda = {
  render, leave, reset, sync, profile, isOpen: () => OPEN === true,
  // test accounts only: jump straight into a game, e.g. Adda.open('express', 6) or Adda.open('groups', 0, 12) for puzzle #12
  open(game, lv, n){ if (!tester()) return 'Test accounts only'; openGame(game, { lv, n }); return 'Opening ' + game; },
  _state: st, _todaySecs: todaySecs,
  _play(on, hook){ playing = !!on; secondHook = on ? hook || null : null; lastAct = Date.now(); if (!on) flush(); }
};
// the page's first route() ran before this file loaded
if (typeof view !== 'undefined' && view === 'english') render();
sync();
})();
