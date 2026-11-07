// Prints (as JSON) every line Turbo says in Drive School, so scripts/turbo-voice.py can record them.
// Sources: each lesson file (talk bubbles, guides, end lines) + the TURBO_LINES block in public/drive/drive.js.
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../public/', import.meta.url);
const ctx = { window: { DRIVE_LESSONS: {} } };
vm.createContext(ctx);
const dir = new URL('content/drive/', root);
for (const f of readdirSync(dir).filter(f => /^day\d+\.js$/.test(f)).sort())
  vm.runInContext(readFileSync(new URL(f, dir), 'utf8'), ctx, { filename: f });

const lines = new Set();
const add = t => { if (typeof t === 'string' && t.trim()) lines.add(t.trim()); };
for (const lesson of Object.values(ctx.window.DRIVE_LESSONS)) {
  for (const s of lesson.screens) {
    if (s.type === 'info') (s.body || []).forEach(add);
    if (s.type === 'wrap') (s.lines || []).forEach(add);
    add(s.guide); add(s.endGuide); add(s.doneGuide);
    if (s.type === 'reviewSet') s.items.forEach(q => add(q.guide));
    if (s.type === 'story') Object.values(s.nodes).forEach(n => { add(n.text); add(n.guide); });
  }
}
// fixed lines the player itself says
const js = readFileSync(new URL('drive/drive.js', root), 'utf8');
const m = js.match(/\/\*TURBO_LINES\*\/([\s\S]*?)\/\*END_TURBO_LINES\*\//);
if (!m) throw new Error('TURBO_LINES block not found in drive.js');
const engine = vm.runInNewContext(m[1].replace(/^\s*const\s+TURBO_LINES\s*=\s*/, '').replace(/;\s*$/, ''));
engine.forEach(add);
process.stdout.write(JSON.stringify([...lines], null, 1));
