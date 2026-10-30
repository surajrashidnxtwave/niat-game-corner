// Brain Gym 3D world. Loaded only when 3D is on (see "3D world" in index.html).
// - a floating low-poly background behind the app (its own canvas, behind everything)
// - a warp jump for the game countdown, and a celebration burst for results
// - live 3D models inside every .w3d-slot element (one overlay canvas, scissored per slot)
// - 3D confetti
// Models come from assets/3d/world.glb (made by scripts/models-glb.py in Blender).
// A frame-time guard steps down to a lighter mode, then switches the background off, on slow devices.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const html = document.documentElement;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => innerWidth < 640;
const SKY = new THREE.Color('#EEEAFB'), SPACE = new THREE.Color('#0A0720'), STREAK = new THREE.Color('#8C7CFF'), WHITE = new THREE.Color('#ffffff');
const BRAND = ['#5B4BFF', '#9B3BF5', '#FF4D8D', '#C6F432', '#FFB020', '#0F9F8F', '#2F7BF0'];
const TIER = { gold: '#FFB020', diamond: '#5FD8F0', silver: '#C3C9D9', bronze: '#C2763F' };
// models that face the viewer sway; the rest turn all the way round
const SWAY = new Set(['trophy', 'medal', 'star', 'chip', 'target', 'gear', 'brain']);
const FACE = { brain: Math.PI / 2 };   // show the brain from the side, the way people draw it
const ease = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

function renderer(canvas, aa = true) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: aa, alpha: true, powerPreference: 'default' });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  return r;
}
function lights(scene, r) {
  const pm = new THREE.PMREMGenerator(r);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pm.dispose();
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9b0e8', 1.6));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-3, 5, 6); scene.add(key);
}
function canvas(id, z) {
  const c = document.createElement('canvas');
  c.id = id; c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:' + z;
  document.body.appendChild(c);
  return c;
}

const MODELS = {};
function model(name, tier) {
  const src = MODELS[name]; if (!src) return null;
  const o = src.clone();
  if (tier && TIER[tier]) o.traverse(m => {
    if (!m.isMesh) return;
    m.material = (Array.isArray(m.material) ? m.material : [m.material]).map(mt => {
      if (mt.name !== 'tier') return mt;
      const c = mt.clone(); c.color.set(TIER[tier]);
      if (tier === 'diamond') { c.metalness = 0.3; c.roughness = 0.12; }
      if (tier === 'silver') { c.metalness = 0.75; c.roughness = 0.25; }
      return c;
    });
    if (m.material.length === 1) m.material = m.material[0];
  });
  return o;
}

/* ---------------- background world ---------------- */
const BG = { level: 0, warp: 0, warpUntil: 0, burst: 0, drift: 0.35, items: [], px: 0, py: 0 };
function buildBackground() {
  BG.canvas = canvas('w3d-bg', -1);
  BG.r = renderer(BG.canvas, false);   // soft, fogged and moving: no anti-aliasing needed
  BG.scene = new THREE.Scene();
  BG.scene.fog = new THREE.Fog(SKY.clone(), 14, 52);
  lights(BG.scene, BG.r);
  BG.accent = new THREE.PointLight('#7B61FF', 60, 40, 1.4); BG.accent.position.set(0, 2, 2); BG.scene.add(BG.accent);
  BG.tint = new THREE.Color('#7B61FF');
  BG.cam = new THREE.PerspectiveCamera(55, 1, 0.1, 120); BG.cam.position.set(0, 0, 10);

  const prims = [
    new THREE.IcosahedronGeometry(0.9, 0), new THREE.OctahedronGeometry(0.9, 0),
    new THREE.TorusGeometry(0.75, 0.24, 8, 20), new THREE.BoxGeometry(1.1, 1.1, 1.1)
  ];
  const names = ['brain', 'dumbbell', 'star', 'bulb', 'gear', 'chip', 'target', 'flame', 'medal', 'trophy'];
  const n = phone() ? 12 : 20;
  for (let i = 0; i < n; i++) {
    let o;
    if (i % 3 === 2) {
      const mat = new THREE.MeshStandardMaterial({ color: BRAND[i % BRAND.length], roughness: 0.25, metalness: 0.15, flatShading: true });
      o = new THREE.Mesh(prims[i % prims.length], mat);
    } else o = model(names[i % names.length]);
    if (!o) continue;
    const it = { o, s: 0.55 + Math.random() * 0.75, rx: (Math.random() - 0.5) * 0.6, ry: (Math.random() - 0.5) * 0.9, ph: Math.random() * 6.28 };
    place(it, -Math.random() * 46);
    o.scale.setScalar(it.s);
    o.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    BG.scene.add(o); BG.items.push(it);
  }
  // star streaks: tiny dashes at rest, long lines during the warp
  const N = phone() ? 160 : 260;
  BG.st = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * 6.28, rad = 2.5 + Math.random() * 22;
    BG.st.set([Math.cos(a) * rad, Math.sin(a) * rad * 0.7, -Math.random() * 70 + 10], i * 3);
  }
  BG.lineBuf = new Float32Array(N * 6);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(BG.lineBuf, 3));
  BG.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#8C7CFF', transparent: true, opacity: 0.5, fog: false }));
  BG.lines.frustumCulled = false;
  BG.scene.add(BG.lines);
}
function place(it, z) {
  const side = Math.random() < 0.5 ? -1 : 1, wide = phone() ? 6 : 13;
  it.x = side * (2.2 + Math.random() * wide); it.y = (Math.random() - 0.5) * 15; it.z = z;
  it.o.position.set(it.x, it.y, it.z);
}
function stepBackground(t, dt) {
  const now = performance.now();
  const target = now < BG.warpUntil ? 1 : 0;
  BG.warp += (target - BG.warp) * Math.min(1, dt * (target ? 2.6 : 3.4));
  BG.burst *= Math.pow(0.25, dt);
  const speed = BG.drift + BG.warp * 70;
  const camZ = BG.cam.position.z;
  for (const it of BG.items) {
    it.z += speed * dt;
    if (it.z > camZ - 1) place(it, -46 - Math.random() * 6);
    const spin = 1 + BG.burst * 9;
    it.o.rotation.x += it.rx * dt * spin; it.o.rotation.y += it.ry * dt * spin;
    it.o.position.set(it.x * (1 + BG.burst * 0.25), it.y + Math.sin(t * 0.6 + it.ph) * 0.3, it.z);
  }
  const st = BG.st, lb = BG.lineBuf, len = 0.12 + BG.warp * 9;
  for (let i = 0; i < st.length; i += 3) {
    st[i + 2] += (speed * 1.4) * dt;
    if (st[i + 2] > camZ) st[i + 2] -= 70;
    lb[i * 2] = lb[i * 2 + 3] = st[i];
    lb[i * 2 + 1] = lb[i * 2 + 4] = st[i + 1];
    lb[i * 2 + 2] = st[i + 2]; lb[i * 2 + 5] = st[i + 2] - len;
  }
  BG.lines.geometry.attributes.position.needsUpdate = true;
  BG.lines.material.color.copy(STREAK).lerp(WHITE, BG.warp);
  BG.lines.material.opacity = 0.45 + BG.warp * 0.5;
  // camera: follow the pointer a little, and sink as the page scrolls, for depth parallax
  const sy = Math.min(scrollY * 0.004, 7);
  const cx = BG.px * 1.4, cy = -BG.py * 0.9 - sy;
  BG.cam.position.x += (cx - BG.cam.position.x) * Math.min(1, dt * 3);
  BG.cam.position.y += (cy - BG.cam.position.y) * Math.min(1, dt * 3);
  BG.cam.lookAt(BG.cam.position.x * 0.3, BG.cam.position.y, -20);
  BG.cam.fov = 55 + ease(BG.warp) * 40; BG.cam.updateProjectionMatrix();
  BG.scene.fog.color.copy(SKY).lerp(SPACE, BG.warp);
  BG.r.setClearColor(SPACE, BG.warp * 0.96);
  BG.accent.color.lerp(BG.tint, Math.min(1, dt * 2));
  BG.accent.intensity = 60 + BG.burst * 400 + BG.warp * 200;
  BG.r.render(BG.scene, BG.cam);
}

/* ---------------- slots: live models inside .w3d-slot elements ----------------
   One small shared WebGL canvas (never on the page) draws each model, then the picture is copied into a
   2D canvas inside the slot. The cost follows the slot size, and the page's own layering (cards, pop-ups,
   the tab bar) just works. */
const FX = { slots: new Map(), drag: null, confetti: null, cw: 0, ch: 0 };
function buildOverlay() {
  FX.canvas = document.createElement('canvas');
  FX.r = renderer(FX.canvas);
  FX.r.setPixelRatio(1);            // sizes below are already in device pixels
  FX.r.autoClear = false;
  FX.r.setScissorTest(true);
  FX.scene = new THREE.Scene();
  lights(FX.scene, FX.r);
  FX.cam = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  FX.cam.position.set(0, 0.15, 5.4); FX.cam.lookAt(0, 0, 0);
}
// grow the shared canvas when a bigger picture is needed
function room(w, h) {
  if (w <= FX.cw && h <= FX.ch) return;
  FX.cw = Math.max(FX.cw, w); FX.ch = Math.max(FX.ch, h);
  FX.r.setSize(FX.cw, FX.ch, false);
}
// draw `scene` into the bottom-left w x h of the shared canvas, then copy it to a 2D context
function blit(scene, cam, w, h, ctx) {
  room(w, h);
  FX.r.setViewport(0, 0, w, h); FX.r.setScissor(0, 0, w, h);
  FX.r.setClearColor(0x000000, 0); FX.r.clear();
  FX.r.render(scene, cam);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(FX.canvas, 0, FX.ch - h, w, h, 0, 0, w, h);
}
function slotFor(el) {
  let s = FX.slots.get(el);
  if (s) return s;
  const o = model(el.dataset.model, el.dataset.tier);
  if (!o) return null;
  const pivot = new THREE.Group(); pivot.add(o); pivot.visible = false; FX.scene.add(pivot);
  const c = document.createElement('canvas');
  c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  el.appendChild(c);
  s = { el, c, ctx: c.getContext('2d'), pivot, o, born: performance.now(), rot: FACE[el.dataset.model] || (SWAY.has(el.dataset.model) ? 0 : -0.5), vel: 0, sway: SWAY.has(el.dataset.model), gear: el.dataset.model === 'gear', ph: Math.random() * 6 };
  FX.slots.set(el, s);
  return s;
}
function dropSlot(el, s) {
  FX.scene.remove(s.pivot);
  s.c.remove();
  FX.slots.delete(el);
}
function stepSlots(t, dt, W, H) {
  const modal = document.querySelector('.modal.open');
  const busy = document.querySelector('.count');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (const [el, s] of FX.slots) if (!el.isConnected) dropSlot(el, s);
  for (const el of document.querySelectorAll('.w3d-slot')) {
    // skip what nobody can see: covered by a pop-up or the countdown, hidden, or off screen
    if (busy || (modal && !modal.contains(el)) || !el.offsetParent) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 4 || b.bottom < 0 || b.top > H || b.right < 0 || b.left > W) continue;
    const s = slotFor(el); if (!s) continue;
    const w = Math.round(b.width * dpr), h = Math.round(b.height * dpr);
    if (s.c.width !== w || s.c.height !== h) { s.c.width = w; s.c.height = h; }
    // motion: grow in with a spin, then sway or turn; drag to spin with inertia
    const age = Math.min(1, (performance.now() - s.born) / 800);
    s.pivot.scale.setScalar(0.6 + 0.4 * (still() ? 1 : back(age)));
    if (FX.drag !== s) { s.rot += s.vel * dt; s.vel *= Math.pow(0.12, dt); }
    const idle = still() ? 0 : (s.sway ? Math.sin(t * 0.9 + s.ph) * 0.45 : t * 0.7);
    s.pivot.rotation.y = s.rot + idle + (1 - ease(age)) * -2.6;
    s.pivot.position.y = still() ? 0 : Math.sin(t * 1.5 + s.ph) * 0.06;
    s.o.rotation.z = s.gear && !still() ? t * 0.8 : 0;
    FX.cam.aspect = w / h; FX.cam.updateProjectionMatrix();
    s.pivot.visible = true;
    blit(FX.scene, FX.cam, w, h, s.ctx);
    s.pivot.visible = false;
  }
  if (FX.confetti) stepConfetti(dt, W, H);
}
// drag a model to spin it
addEventListener('pointerdown', e => {
  const el = e.target.closest && e.target.closest('.w3d-slot'); if (!el) return;
  const s = FX.slots.get(el); if (!s) return;
  FX.drag = s; s.lastX = e.clientX; s.vel = 0;
}, { passive: true });
addEventListener('pointermove', e => {
  BG.px = e.clientX / innerWidth - 0.5; BG.py = e.clientY / innerHeight - 0.5;
  const s = FX.drag; if (!s) return;
  const dx = e.clientX - s.lastX; s.lastX = e.clientX;
  s.rot += dx * 0.012; s.vel = dx * 0.7;
}, { passive: true });
addEventListener('pointerup', () => { FX.drag = null; }, { passive: true });
addEventListener('pointercancel', () => { FX.drag = null; }, { passive: true });

/* ---------------- 3D confetti (a full-screen 2D canvas that exists only while it falls) ---------------- */
function startConfetti() {
  const n = phone() ? 70 : 120;
  if (!FX.cgeo) {
    FX.cgeo = new THREE.BoxGeometry(0.16, 0.26, 0.02);
    FX.cmat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.45, side: THREE.DoubleSide });
    FX.cscene = new THREE.Scene(); lights(FX.cscene, FX.r);
    FX.ccam = new THREE.PerspectiveCamera(50, 1, 0.1, 50); FX.ccam.position.z = 10;
  }
  if (FX.confetti) { FX.cscene.remove(FX.confetti.mesh); FX.confetti.c.remove(); }
  const mesh = new THREE.InstancedMesh(FX.cgeo, FX.cmat, n);
  const col = new THREE.Color(), p = [];
  for (let i = 0; i < n; i++) {
    col.set(BRAND[i % BRAND.length]); mesh.setColorAt(i, col);
    p.push({ x: (Math.random() - 0.5) * 3, y: -2.5 + Math.random(), z: (Math.random() - 0.5) * 3,
      vx: (Math.random() - 0.5) * 9, vy: 7 + Math.random() * 6, vz: (Math.random() - 0.5) * 4,
      rx: Math.random() * 6, ry: Math.random() * 6, sx: (Math.random() - 0.5) * 14, sy: (Math.random() - 0.5) * 14 });
  }
  FX.cscene.add(mesh);
  const c = canvas('w3d-confetti', 55);
  FX.confetti = { mesh, p, age: 0, c, ctx: c.getContext('2d') };
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
function stepConfetti(dt, W, H) {
  const c = FX.confetti; c.age += dt;
  if (c.age > 3.2) { FX.cscene.remove(c.mesh); c.mesh.dispose(); c.c.remove(); FX.confetti = null; return; }
  c.p.forEach((q, i) => {
    q.vy -= 9.5 * dt; q.vx *= Math.pow(0.5, dt); q.vy = Math.max(q.vy, -4.2);   // flutter: low terminal speed
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    q.rx += q.sx * dt; q.ry += q.sy * dt;
    _q.setFromEuler(_e.set(q.rx, q.ry, 0));
    c.mesh.setMatrixAt(i, _m.compose(_v.set(q.x, q.y, q.z), _q, _one));
  });
  c.mesh.instanceMatrix.needsUpdate = true;
  // half resolution is plenty for fast-moving confetti
  const w = Math.round(W / 2), h = Math.round(H / 2);
  if (c.c.width !== w || c.c.height !== h) { c.c.width = w; c.c.height = h; }
  FX.ccam.aspect = W / H; FX.ccam.updateProjectionMatrix();
  blit(FX.cscene, FX.ccam, w, h, c.ctx);
}

/* ---------------- loop, sizing and the speed guard ---------------- */
let raf = 0, last = 0, frame = 0, slow = 0, samples = 0, sum = 0;
function size() {
  const W = innerWidth, H = innerHeight, d = devicePixelRatio || 1;
  if (BG.r) {
    BG.r.setPixelRatio(Math.min(d, 1) * (BG.level ? 0.6 : phone() ? 0.75 : 1));
    BG.r.setSize(W, H, false);
    BG.cam.aspect = W / H; BG.cam.updateProjectionMatrix();
  }
}
function loop(now) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; frame++;
  const t = still() ? 0 : now / 1000;
  const W = innerWidth, H = innerHeight;
  // background at 30 fps when calm (20 fps in light mode); full speed during the warp or a burst
  if (BG.r) {
    const every = BG.warp > 0.01 || BG.burst > 0.02 ? 1 : BG.level ? 3 : 2;
    if (frame % every === 0) stepBackground(t, still() ? 0 : dt * every);
  }
  stepSlots(t, dt, W, H);
  // speed guard: average frame time over ~2 s; step down once, then drop the background
  if (dt > 0 && dt < 0.25 && !document.hidden) { sum += dt; samples++; }
  if (samples >= 120) {
    const avg = sum / samples; sum = 0; samples = 0;
    slow = avg > 0.034 ? slow + 1 : 0;
    if (slow >= 2 && BG.r) {
      slow = 0;
      if (!BG.level) { BG.level = 1; size(); }
      else { killBackground(); html.classList.add('w3d-lite'); }
    }
  }
}
function killBackground() {
  if (!BG.r) return;
  BG.r.dispose(); BG.r.forceContextLoss(); BG.canvas.remove(); BG.r = null;
}

/* ---------------- public API (used by index.html) ---------------- */
const API = {
  warp(color, ms) { if (!BG.r || still()) return; if (color) BG.tint.set(color); BG.warpUntil = performance.now() + (ms || 2200) - 350; },
  tint(color) { if (color) BG.tint.set(color); },
  celebrate(color) { if (still()) return; if (color) BG.tint.set(color); BG.burst = 1; },
  confetti() { if (still()) return false; startConfetti(); return true; },
  dispose() {
    cancelAnimationFrame(raf); killBackground();
    for (const [el, s] of FX.slots) dropSlot(el, s);
    if (FX.confetti) FX.confetti.c.remove();
    FX.r.dispose(); FX.r.forceContextLoss();
    removeEventListener('resize', size);
    html.classList.remove('w3d', 'w3d-ready', 'w3d-lite', 'warping');
    window.World3D = null;
  }
};

try {
  const gltf = await new GLTFLoader().loadAsync('assets/3d/world.glb');
  gltf.scene.children.forEach(o => { MODELS[o.name] = o; });
  buildOverlay();
  buildBackground();
  size(); addEventListener('resize', size);
  raf = requestAnimationFrame(loop);
  window.World3D = API;
  html.classList.add('w3d-ready');
} catch (e) {
  console.warn('[3D] off:', e && e.message);
  html.classList.remove('w3d', 'w3d-ready');
  window.World3D = null;
}
dispatchEvent(new Event('w3d-change'));
