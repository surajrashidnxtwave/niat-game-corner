// GET /api/leaderboard?pilot=BATCH -> { ok, rows: [{ id, n, p }] }  (only students who have logged in)
// Points use the same formula as the page: 1 per 6 active seconds + 10 per finished round.
// Cached at the CDN for 60 s, so 200 students opening it costs about one query a minute.
import { db, BATCH_RE, dbReady, shortName } from './_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  if (!dbReady(res)) return;
  const pilot = String(req.query?.pilot || new URL(req.url, 'http://x').searchParams.get('pilot') || '').trim().toUpperCase();
  if (!BATCH_RE.test(pilot)) return res.status(400).json({ ok: false, error: 'bad pilot' });
  try {
    const sql = db();
    const [rows, live] = await Promise.all([
      sql`SELECT s.id, s.name, COALESCE(SUM(FLOOR(p.active / 6) + p.plays * 10), 0)::int AS pts
          FROM students s LEFT JOIN progress p ON p.student_id = s.id
          WHERE s.pilot = ${pilot} AND s.joined_at IS NOT NULL
          GROUP BY s.id ORDER BY pts DESC, s.id LIMIT 500`,
      // "training now" = saved progress in the last 5 minutes (the page syncs every 2 minutes while playing)
      sql`SELECT COUNT(*)::int AS n FROM students WHERE pilot = ${pilot} AND last_seen > now() - interval '5 minutes'`
    ]);
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
    return res.status(200).json({ ok: true, live: live[0].n, rows: rows.map(r => ({ id: r.id, n: shortName(r.name), p: r.pts })) });
  } catch (e) {
    console.error('[leaderboard]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}
