// Prints (as JSON) every clip English Adda needs, so scripts/english-voice.py can record them.
//   { t: text, v: Kokoro voice, s: speed, secret: true|undefined }
// Public lines (Mithu talking) go in the manifest so the page can find them by text.
// Secret lines (sentences a student must type, e.g. Catch It) are NOT in the manifest: the server sends only the file name.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { CATCH, VOICE } from '../api/_lib/english-check.js';
import { ECHO } from '../api/_lib/english/echo.js';
import { echoParse, echoSpeed } from '../api/_lib/english-games.js';

// Mithu talks in a male Kokoro voice (owner's choice, Nov 2026). Listening sentences keep the level check's voice.
export const MITHU_VOICE = 'am_puck';
const out = new Map();
const add = (t, v = VOICE, s = 1, secret) => { if (typeof t === 'string' && t.trim()) out.set(v + '|' + s + '|' + t.trim(), { t: t.trim(), v, s, ...(secret ? { secret: true } : {}) }); };

// Mithu's fixed lines in the page
const js = readFileSync(new URL('../public/english/english.js', import.meta.url), 'utf8');
const m = js.match(/\/\*MITHU_LINES\*\/([\s\S]*?)\/\*END_MITHU_LINES\*\//);
if (!m) throw new Error('MITHU_LINES block not found in english.js');
const lines = vm.runInNewContext('(' + m[1].replace(/^\s*const\s+MITHU_LINES\s*=\s*/, '').replace(/;\s*$/, '') + ')');
Object.values(lines).flat().forEach(t => add(t, MITHU_VOICE));

// level check: Catch It sentences
for (const c of CATCH) add(c.text, VOICE, c.speed, true);

// Echo (game): the whole sentence with the right words, secret like Catch It
for (const e of ECHO) add(echoParse(e).text, VOICE, echoSpeed(e), true);

process.stdout.write(JSON.stringify([...out.values()], null, 1));
