// GET /api/admin?view=summary           -> pilot report as JSON
// GET /api/admin?view=csv&table=<name>  -> CSV download (students | plays | feedback | progress)
// POST /api/admin { action: "roster", rows: [{ line, roll, name, batch }] } -> adds or updates students
// Needs header  x-admin-key: <ADMIN_KEY>.
import { db, sameSecret, limited, ipOf, dbReady, BATCH_RE, cleanName } from './_lib/db.js';

const ROLL_RE = /^[A-Z0-9_/-]{3,30}$/, FULL_RE = /^[A-Za-z][A-Za-z .'-]{0,59}$/;

const CSV = {
  students: `SELECT s.id, s.name, s.roll AS niat_id, s.pilot AS batch, s.joined_at, s.last_seen,
               COALESCE(SUM(p.active), 0) / 60 AS minutes, COALESCE(SUM(p.plays), 0) AS rounds, COALESCE(SUM(p.vol), 0) AS kg_lifted,
               COALESCE(SUM(FLOOR(p.active / 6) + p.plays * 10), 0) AS points
             FROM students s LEFT JOIN progress p ON p.student_id = s.id GROUP BY s.id ORDER BY s.pilot, points DESC, s.name`,
  plays: `SELECT pl.played_at, s.name, s.roll AS niat_id, s.pilot AS batch, pl.game_id, pl.score, pl.pct, pl.lift
          FROM plays pl JOIN students s ON s.id = pl.student_id ORDER BY pl.played_at`,
  feedback: `SELECT f.created_at, s.name, s.roll AS niat_id, s.pilot AS batch, f.kind, f.game_id, f.rating, f.difficulty, f.fair, f.comment, f.meta
             FROM feedback f JOIN students s ON s.id = f.student_id ORDER BY f.created_at`,
  progress: `SELECT s.name, s.roll AS niat_id, s.pilot AS batch, p.game_id, p.active / 60 AS minutes, p.plays AS rounds, p.best, p.best_pct, p.vol AS kg_lifted, p.updated_at
             FROM progress p JOIN students s ON s.id = p.student_id ORDER BY s.pilot, s.roll, p.game_id`
};

const cell = v => {
  if (v == null) return '';
  let s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;            // stop spreadsheet formula injection
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ ok: false, error: 'GET or POST only' });
  if (limited('a:' + ipOf(req), 30)) return res.status(429).json({ ok: false, error: 'slow down' });
  if (!sameSecret(req.headers['x-admin-key'], process.env.ADMIN_KEY)) return res.status(401).json({ ok: false, error: 'wrong key' });
  if (!dbReady(res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const q = new URL(req.url, 'http://x').searchParams;
  const sql = db();
  try {
    if (req.method === 'POST') return await roster(res, sql, req.body || {});
    if (q.get('view') === 'csv') {
      const t = q.get('table');
      if (!CSV[t]) return res.status(400).json({ ok: false, error: 'bad table' });
      const rows = await sql.query(CSV[t]);
      const cols = rows.length ? Object.keys(rows[0]) : [];
      const body = [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="brain-gym-${t}.csv"`);
      return res.status(200).send('\uFEFF' + body);
    }

    const [pilots, games, daily, comments, unfair, students, moods, bugs, goal, stars, ideas] = await Promise.all([
      sql`SELECT pilot, COUNT(*)::int AS on_roster, COUNT(joined_at)::int AS joined,
                 COUNT(*) FILTER (WHERE last_seen > now() - interval '7 days')::int AS active7,
                 COUNT(*) FILTER (WHERE last_seen > now() - interval '1 day')::int AS active1
          FROM students GROUP BY pilot ORDER BY pilot`,
      sql`WITH pr AS (SELECT game_id, COUNT(*) FILTER (WHERE plays > 0)::int AS players, SUM(plays)::int AS rounds,
                             (SUM(active) / 60)::int AS minutes, ROUND(AVG(best_pct) FILTER (WHERE plays > 0))::int AS avg_best
                      FROM progress GROUP BY game_id),
               fb AS (SELECT game_id, ROUND(AVG(rating), 1)::float AS rating, COUNT(rating)::int AS ratings,
                             COUNT(*) FILTER (WHERE difficulty = 'easy')::int AS easy, COUNT(*) FILTER (WHERE difficulty = 'right')::int AS just_right,
                             COUNT(*) FILTER (WHERE difficulty = 'hard')::int AS hard,
                             COUNT(*) FILTER (WHERE kind = 'verdict' AND fair = false)::int AS unfair
                      FROM feedback WHERE game_id IS NOT NULL GROUP BY game_id)
          SELECT COALESCE(pr.game_id, fb.game_id) AS game_id, pr.players, pr.rounds, pr.minutes, pr.avg_best,
                 fb.rating, fb.ratings, fb.easy, fb.just_right, fb.hard, fb.unfair
          FROM pr FULL JOIN fb ON fb.game_id = pr.game_id ORDER BY pr.minutes DESC NULLS LAST`,
      sql`SELECT to_char(played_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, COUNT(*)::int AS rounds,
                 COUNT(DISTINCT student_id)::int AS students
          FROM plays WHERE played_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1`,
      sql`SELECT f.created_at, s.name, s.roll AS niat_id, f.kind, f.game_id, f.rating, f.difficulty, f.comment
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.comment IS NOT NULL AND f.kind NOT IN ('bug', 'session') ORDER BY f.created_at DESC LIMIT 200`,
      sql`SELECT f.created_at, s.name, f.game_id, f.meta, f.comment
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.kind = 'verdict' AND f.fair = false ORDER BY f.created_at DESC LIMIT 100`,
      sql.query(CSV.students),
      sql`SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
                 COUNT(*) FILTER (WHERE meta->>'mood' = 'tired')::int AS tired, COUNT(*) FILTER (WHERE meta->>'mood' = 'okay')::int AS okay,
                 COUNT(*) FILTER (WHERE meta->>'mood' = 'sharp')::int AS sharp
          FROM feedback WHERE kind = 'mood' AND created_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1 DESC`,
      sql`SELECT f.created_at, s.name, s.roll AS niat_id, f.game_id, f.comment, f.meta
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.kind = 'bug' ORDER BY f.created_at DESC LIMIT 200`,
      // the attention metric: who trained, who hit the daily goal (15 minutes, same as DAY_GOAL in the page), average minutes
      sql`SELECT to_char(day, 'YYYY-MM-DD') AS day, COUNT(*) FILTER (WHERE active > 0)::int AS trained,
                 COUNT(*) FILTER (WHERE active >= 900)::int AS hit_goal,
                 ROUND(AVG(active) FILTER (WHERE active > 0) / 60.0, 1)::float AS avg_min
          FROM daily WHERE day > current_date - 14 GROUP BY day ORDER BY day DESC`,
      // end-of-session "11-star" ratings: how many sessions got each star level
      sql`SELECT rating AS stars, COUNT(*)::int AS n FROM feedback WHERE kind = 'session' GROUP BY rating ORDER BY rating`,
      // what students said would make it a 7 or an 11, or what got in the way
      sql`SELECT f.created_at, s.name, s.roll AS niat_id, f.rating AS stars, f.comment, f.meta
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.kind = 'session' AND (f.comment IS NOT NULL OR jsonb_array_length(COALESCE(f.meta->'why', '[]'::jsonb)) > 0)
          ORDER BY f.created_at DESC LIMIT 200`
    ]);
    return res.status(200).json({ ok: true, pilots, games, daily, comments, unfair, students, moods, bugs, goal, stars, ideas });
  } catch (e) {
    console.error('[admin]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}

// Add or update roster rows. NIAT ID is the key; a later row with the same ID wins.
// IDs without a digit ("N/A", "NA") are placeholders and are skipped.
async function roster(res, sql, b) {
  if (b.action !== 'roster' || !Array.isArray(b.rows) || b.rows.length > 5000) return res.status(400).json({ ok: false, error: 'Send up to 5,000 rows at a time.' });
  const bad = [], keep = new Map();
  for (const r of b.rows) {
    const roll = String(r?.roll || '').trim().toUpperCase(), name = cleanName(r?.name || '');
    const batch = String(r?.batch || '').trim().toUpperCase() || 'ALL';
    if (!ROLL_RE.test(roll) || !/\d/.test(roll) || !FULL_RE.test(name) || !BATCH_RE.test(batch)) { bad.push(r?.line ?? '?'); continue; }
    keep.set(roll, { roll, name, batch });
  }
  const rows = [...keep.values()];
  let added = 0, updated = 0;
  if (rows.length) {
    const out = await sql.query(
      `INSERT INTO students (roll, name, pilot) SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
       ON CONFLICT (roll) DO UPDATE SET name = EXCLUDED.name, pilot = EXCLUDED.pilot
       RETURNING (xmax = 0) AS inserted`,
      [rows.map(r => r.roll), rows.map(r => r.name), rows.map(r => r.batch)]);
    added = out.filter(r => r.inserted).length; updated = out.length - added;
  }
  return res.status(200).json({ ok: true, added, updated, skipped: bad.length, badLines: bad.slice(0, 50) });
}
