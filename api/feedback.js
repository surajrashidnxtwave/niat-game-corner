// POST /api/feedback { token, kind: "game" | "verdict" | "general" | "mood" | "bug" | "session", game?, rating?, difficulty?, fair?, comment?, meta? }
//   mood: meta.mood is tired | okay | sharp.  bug: comment (what went wrong) is required.
//   session: end-of-session "11-star" rating; rating 1-11 is required (every other kind rates 1-5).
// Student text is stored as plain text and only ever shown escaped on the admin page.
import { db, GAME_IDS, studentFor, limited, int, dbReady } from './_lib/db.js';

const KINDS = ['game', 'verdict', 'general', 'mood', 'bug', 'session'], DIFF = ['easy', 'right', 'hard'], MOODS = ['tired', 'okay', 'sharp'];

// Voice note from the feedback sheet ("Tap to record"): { kind: "voice", product: bg|dv|en, secs: 1-60, mime, audio: base64 } -> { ok, id }
// 1 minute at most (the page stops recording at 60 s; the size cap below also bounds the length). At most 15 a day per student.
// The rating that follows stores { voice: { id, secs } }; the admin page plays it through /api/admin?view=voice&id=...
const VOICE_PRODUCTS = ['bg', 'dv', 'en'], VOICE_MIME = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/mpeg'];
const VOICE_MAX_BYTES = 600_000, VOICE_DAY_MAX = 15;
async function voice(res, me, b) {
  const mime = String(b.mime || '').split(';')[0].trim().toLowerCase();
  if (!VOICE_PRODUCTS.includes(b.product) || !int(b.secs, 1, 60) || !VOICE_MIME.includes(mime) || typeof b.audio !== 'string'
      || b.audio.length > Math.ceil(VOICE_MAX_BYTES * 4 / 3) + 4 || !/^[A-Za-z0-9+/]+=*$/.test(b.audio)) return res.status(400).json({ ok: false, error: 'bad voice note' });
  const bytes = Buffer.from(b.audio, 'base64');
  if (bytes.length < 400 || bytes.length > VOICE_MAX_BYTES) return res.status(400).json({ ok: false, error: 'bad voice note' });
  const sql = db();
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM feedback_voice WHERE student_id = ${me.id} AND created_at > now() - interval '1 day'`;
  if (n >= VOICE_DAY_MAX) return res.status(429).json({ ok: false, error: 'too many voice notes today' });
  const [row] = await sql`INSERT INTO feedback_voice (student_id, product, secs, mime, audio)
    VALUES (${me.id}, ${b.product}, ${b.secs}, ${mime}, decode(${bytes.toString('hex')}, 'hex')) RETURNING id`;
  return res.status(200).json({ ok: true, id: Number(row.id) });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!dbReady(res)) return;
  const b = req.body || {};
  try {
    const me = await studentFor(b.token);
    if (!me) return res.status(401).json({ ok: false, error: 'not joined' });
    if (limited('f:' + me.id, 30)) return res.status(429).json({ ok: false, error: 'slow down' });

    if (b.kind === 'voice') return await voice(res, me, b);
    if (!KINDS.includes(b.kind)) return res.status(400).json({ ok: false, error: 'bad kind' });
    const game = b.game == null ? null : GAME_IDS.includes(b.game) ? b.game : undefined;
    const rating = b.rating == null ? null : int(b.rating, 1, b.kind === 'session' ? 11 : 5) ? b.rating : undefined;
    const difficulty = b.difficulty == null ? null : DIFF.includes(b.difficulty) ? b.difficulty : undefined;
    const fair = b.fair == null ? null : typeof b.fair === 'boolean' ? b.fair : undefined;
    const comment = b.comment == null || b.comment === '' ? null : typeof b.comment === 'string' && b.comment.length <= (b.kind === 'bug' ? 1000 : 500) ? b.comment.trim() : undefined;
    const meta = b.meta == null ? null : typeof b.meta === 'object' && JSON.stringify(b.meta).length <= 6000 ? b.meta : undefined;
    if ([game, rating, difficulty, fair, comment, meta].includes(undefined)) return res.status(400).json({ ok: false, error: 'bad field' });
    if (b.kind === 'mood' && !MOODS.includes(meta?.mood)) return res.status(400).json({ ok: false, error: 'bad mood' });
    if (b.kind === 'bug' && !comment) return res.status(400).json({ ok: false, error: 'Please tell us what went wrong.' });
    if (b.kind === 'session' && rating == null) return res.status(400).json({ ok: false, error: 'Pick a star rating.' });
    if (b.kind !== 'mood' && rating == null && difficulty == null && fair == null && !comment) return res.status(400).json({ ok: false, error: 'empty' });

    await db()`INSERT INTO feedback (student_id, kind, game_id, rating, difficulty, fair, comment, meta)
               VALUES (${me.id}, ${b.kind}, ${game}, ${rating}, ${difficulty}, ${fair}, ${comment}, ${meta ? JSON.stringify(meta) : null})`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[feedback]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}
