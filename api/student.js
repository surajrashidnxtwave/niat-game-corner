// POST /api/student
//   { action: "join", roll (NIAT ID), name (first name) } -> { ok, token, student }
//   { action: "me", token }                          -> { ok, student, progress }
//   { action: "sync", token, games: {...}, plays: [...] } -> { ok }
// Progress values only ever go up, so a stale device can't erase newer progress.
import { db, GAME_IDS, newToken, hashToken, studentFor, limited, ipOf, int, text, dbReady } from './_lib/db.js';

const NAME_RE = /^[A-Za-z][A-Za-z .'-]{0,39}$/;
const ROLL_RE = /^[A-Za-z0-9_/-]{3,30}$/;
const squash = s => s.trim().replace(/\s+/g, ' ');
const pub = s => ({ id: s.id, name: s.name, roll: s.roll, pilot: s.pilot });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!dbReady(res)) return;
  const b = req.body || {};
  try {
    if (b.action === 'join') return await join(req, res, b);
    if (limited('s:' + ipOf(req), 120)) return res.status(429).json({ ok: false, error: 'slow down' });
    const me = await studentFor(b.token);
    if (!me) return res.status(401).json({ ok: false, error: 'not joined' });
    if (b.action === 'me') return await getMe(res, me);
    if (b.action === 'sync') return await sync(res, me, b);
    return res.status(400).json({ ok: false, error: 'bad action' });
  } catch (e) {
    console.error('[student]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}

// Log in with NIAT ID + first name. Only students on the uploaded roster can get in.
async function join(req, res, b) {
  if (limited('j:' + ipOf(req), 10)) return res.status(429).json({ ok: false, error: 'Too many tries. Wait a minute and try again.' });
  const first = typeof b.name === 'string' ? squash(b.name) : '';
  const roll = typeof b.roll === 'string' ? b.roll.trim().toUpperCase() : '';
  if (!ROLL_RE.test(roll)) return res.status(400).json({ ok: false, error: 'Please enter your NIAT ID.' });
  if (!NAME_RE.test(first)) return res.status(400).json({ ok: false, error: 'Please enter your first name using letters only.' });
  if (limited('jr:' + roll, 8, 10 * 60_000)) return res.status(429).json({ ok: false, error: 'Too many tries for this NIAT ID. Wait 10 minutes and try again.' });

  const sql = db();
  const s = (await sql`SELECT id, name, roll, pilot FROM students WHERE roll = ${roll}`)[0];
  if (!s) return res.status(404).json({ ok: false, error: 'We couldn’t find that NIAT ID. Check it, or ask your mentor.' });
  if (firstName(s.name) !== firstName(first)) return res.status(401).json({ ok: false, error: 'That name doesn’t match this NIAT ID. Use your first name as in college records.' });

  const token = newToken();
  await sql`INSERT INTO sessions (token_hash, student_id) VALUES (${hashToken(token)}, ${s.id})`;
  await sql`UPDATE students SET joined_at = COALESCE(joined_at, now()), last_seen = now() WHERE id = ${s.id}`;
  return res.status(200).json({ ok: true, token, student: pub(s) });
}
// first word, lower case, letters only: "  Sai Teja " and "SAI" both give "sai"
const firstName = n => (String(n).trim().split(/\s+/)[0] || '').toLowerCase().replace(/[^a-z]/g, '');

async function getMe(res, me) {
  const sql = db();
  const [rows, days, extra] = await Promise.all([
    sql`SELECT game_id, active, best, best_pct, plays, vol FROM progress WHERE student_id = ${me.id}`,
    sql`SELECT to_char(day, 'YYYY-MM-DD') AS day, active FROM daily WHERE student_id = ${me.id} AND day > current_date - 60`,
    sql`UPDATE students SET last_seen = now() WHERE id = ${me.id} RETURNING badges`
  ]);
  const progress = {}, hist = {};
  for (const r of rows) progress[r.game_id] = { active: r.active, best: r.best, bestPct: r.best_pct, plays: r.plays, vol: r.vol };
  for (const d of days) hist[d.day] = d.active;
  return res.status(200).json({ ok: true, student: pub(me), progress, hist, badges: extra[0]?.badges || [] });
}

async function sync(res, me, b) {
  const sql = db();
  // running totals: [game, active, best, bestPct, plays, vol]
  const g = b.games && typeof b.games === 'object' ? b.games : {};
  const rows = Object.entries(g).filter(([id, v]) => GAME_IDS.includes(id) && v && typeof v === 'object'
    && int(v.active, 0, 1_000_000) && int(v.best, 0, 100_000) && int(v.bestPct, 0, 100) && int(v.plays, 0, 100_000) && int(v.vol, 0, 10_000_000));
  if (rows.length) {
    const col = i => rows.map(([id, v]) => [id, v.active, v.best, v.bestPct, v.plays, v.vol][i]);
    await sql.query(
      `INSERT INTO progress (student_id, game_id, active, best, best_pct, plays, vol)
       SELECT $1, * FROM unnest($2::text[], $3::int[], $4::int[], $5::int[], $6::int[], $7::int[])
       ON CONFLICT (student_id, game_id) DO UPDATE SET
         active = GREATEST(progress.active, EXCLUDED.active), best = GREATEST(progress.best, EXCLUDED.best),
         best_pct = GREATEST(progress.best_pct, EXCLUDED.best_pct), plays = GREATEST(progress.plays, EXCLUDED.plays),
         vol = GREATEST(progress.vol, EXCLUDED.vol), updated_at = now()`,
      [me.id, col(0), col(1), col(2), col(3), col(4), col(5)]);
  }
  // finished rounds; client_id makes a retried upload harmless
  const p = Array.isArray(b.plays) ? b.plays.slice(0, 50).filter(x => x && text(x.cid, 40) && GAME_IDS.includes(x.game)
    && int(x.score, 0, 100_000) && int(x.pct, 0, 100) && int(x.lift, 0, 100) && int(x.at, 1_600_000_000_000, Date.now() + 86_400_000)) : [];
  if (p.length) {
    await sql.query(
      `INSERT INTO plays (client_id, student_id, game_id, score, pct, lift, played_at)
       SELECT c, $1, g, s, p, l, to_timestamp(t / 1000.0) FROM unnest($2::text[], $3::text[], $4::int[], $5::int[], $6::int[], $7::bigint[]) AS u(c, g, s, p, l, t)
       ON CONFLICT (client_id) DO NOTHING`,
      [me.id, p.map(x => me.id + ':' + x.cid), p.map(x => x.game), p.map(x => x.score), p.map(x => x.pct), p.map(x => x.lift), p.map(x => x.at)]);
  }
  // active seconds per day (last 14 days only); like totals, they only go up
  const h = b.hist && typeof b.hist === 'object' ? b.hist : {};
  const recent = Date.now() - 15 * 86_400_000;
  const dayRows = Object.entries(h).filter(([d, s]) => DAY_RE.test(d) && Date.parse(d) >= recent && Date.parse(d) <= Date.now() + 86_400_000 && int(s, 0, 86_400));
  if (dayRows.length) {
    await sql.query(
      `INSERT INTO daily (student_id, day, active) SELECT $1, d::date, a FROM unnest($2::text[], $3::int[]) AS u(d, a)
       ON CONFLICT (student_id, day) DO UPDATE SET active = GREATEST(daily.active, EXCLUDED.active), updated_at = now()`,
      [me.id, dayRows.map(r => r[0]), dayRows.map(r => r[1])]);
  }
  // badges from reward chests are only ever added
  const badges = Array.isArray(b.badges) ? b.badges.filter(x => typeof x === 'string' && /^[a-z0-9-]{2,30}$/.test(x)).slice(0, 50) : [];
  if (badges.length) await sql`UPDATE students SET badges = ARRAY(SELECT DISTINCT unnest(badges || ${badges}::text[])), last_seen = now() WHERE id = ${me.id}`;
  else await sql`UPDATE students SET last_seen = now() WHERE id = ${me.id}`;
  return res.status(200).json({ ok: true });
}
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
