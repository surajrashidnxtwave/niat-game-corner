// Prints (as JSON) every clip English Adda needs, so scripts/english-voice.py can record them.
//   { t: text, v: Kokoro voice, s: speed, secret: true|undefined }
// Public lines (Yapper talking) go in the manifest so the page can find them by text.
// Secret lines (sentences a student must type, e.g. Catch It) are NOT in the manifest: the server sends only the file name.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { CATCH, VOICE } from '../api/_lib/english-check.js';

const out = new Map();
const add = (t, v = VOICE, s = 1, secret) => { if (typeof t === 'string' && t.trim()) out.set(v + '|' + s + '|' + t.trim(), { t: t.trim(), v, s, ...(secret ? { secret: true } : {}) }); };

// Yapper's fixed lines in the page
const js = readFileSync(new URL('../public/english/english.js', import.meta.url), 'utf8');
const m = js.match(/\/\*YAPPER_LINES\*\/([\s\S]*?)\/\*END_YAPPER_LINES\*\//);
if (!m) throw new Error('YAPPER_LINES block not found in english.js');
const lines = vm.runInNewContext('(' + m[1].replace(/^\s*const\s+YAPPER_LINES\s*=\s*/, '').replace(/;\s*$/, '') + ')');
Object.values(lines).flat().forEach(t => add(t));

// level check: Catch It sentences
for (const c of CATCH) add(c.text, VOICE, c.speed, true);

process.stdout.write(JSON.stringify([...out.values()], null, 1));
