// GET /api/admin?view=summary           -> pilot report as JSON
// GET /api/admin?view=csv&table=<name>  -> CSV download (students | plays | feedback | progress)
// Needs header  x-admin-key: <ADMIN_KEY>. Read-only: the roster is loaded directly into the database.
import { db, sameSecret, limited, ipOf, dbReady } from './_lib/db.js';

// Batch name (students.pilot) -> university, longest prefix first. Used to group the report by university.
const UNIS = [
  ['YENEPOYA BA', 'Yenepoya University, Bangalore'], ['YENEPOYA KA', 'Yenepoya University, Mangalore'],
  ['MALLA REDDY TIRUPATI', 'Malla Reddy Tirupati'], ['SPIHER BENGALURU', 'SPIHER University, Bengaluru'], ['SPIHER CHENNAI', 'SPIHER University, Chennai'],
  ['NIAT CHEVELLA', 'NIAT Chevella'], ['ADYPU', 'A Dy Patil University'], ['ALARD', 'Alard University'], ['AMET', 'AMET University'],
  ['ANNAMACHARYA', 'Annamacharya University'], ['AURORA', 'Aurora University'], ['BEST', 'BEST University'], ['BHARATH', 'Bharath University'],
  ['CDU', 'Chaitanya Deemed-to-be University'], ['CITY', 'Chalapathy (CITY)'], ['CRESCENT', 'Crescent University'], ['GEETA', 'Geeta University'],
  ['GMRIT', 'GMRIT'], ['JOY', 'Joy University'], ['KKH', 'NIAT KKH (Nxtwave Institute of Advanced Technologies)'], ['LIMAT', 'LIMAT'],
  ['LINGAYAS', "Lingaya's Vidyapeeth"], ['MRU', 'Malla Reddy University'], ['MVR', 'MVR College of Engineering'], ['NIU', 'Noida International University'],
  ['NRI', 'NRI Institute'], ['NSRIT', 'NSRIT University'], ['P K DAS', 'P K Das University'], ['SANDIP', 'Sandip University'],
  ['SANSKRITI', 'Sanskriti University'], ['SGSU', 'Scope Global Skills University'], ['SGU', 'Sanjay Ghodawat University'], ['SMRU', 'SMR University'],
  ['SNS', 'SNS College of Technology'], ['SRI SRI', 'Sri Sri University'], ['SUBHARTI', 'Subharti University'], ['SUSHANT', 'Sushant University'],
  ['SVYASA', 'S-VYASA'], ['TAKSHASILA', 'Takshasila University'], ['TS MISHRA', 'T S Mishra University'], ['VGU', 'Vivekananda Global University'],
  ['DEMO', 'Demo']
].sort((a, b) => b[0].length - a[0].length);
const uniOf = pilot => (UNIS.find(([p]) => pilot.startsWith(p)) || [, 'Other'])[1];

// Game -> brain muscle. Keep in step with the `skill` field of each game in public/index.html.
const GAME_SKILL = {
  'word-spread': 'creativity', 'beat-the-7': 'creativity',
  'missing-link': 'insight', 'link-grid': 'insight', 'wiki-hop': 'insight',
  'recall-rebuild': 'memory', 'back-track': 'memory', 'seen-it': 'memory',
  'symbol-sprint': 'focus', 'color-clash': 'focus', 'bug-tracker': 'focus',
  'fallacy-hunt': 'reasoning', 'argue-back': 'reasoning',
  'rule-switch': 'flexibility',
  'robot-path': 'planning',
  'trust-or-check': 'ai', 'source-check': 'ai', 'taste-test': 'ai', 'rush-hour': 'ai', 'sure-or-not': 'ai', 'hint-ladder': 'ai', 'ship-or-test': 'ai', 'you-or-ai': 'ai'
};
const SKILL_KEYS = ['creativity', 'insight', 'memory', 'focus', 'reasoning', 'flexibility', 'planning', 'ai'];
const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2); };

// Skill profile per university: a student's score on a muscle = their best % on any game for that muscle
// (same as the Brain muscles page). Each university gets the median of those scores, plus how many students it is based on.
function skillProfiles(rows){
  const per = new Map();                                   // student -> { uni, skill -> best }
  for (const r of rows) {
    const k = GAME_SKILL[r.game_id]; if (!k) continue;
    const st = per.get(r.student_id) || { uni: uniOf(r.pilot), s: {} };
    st.s[k] = Math.max(st.s[k] ?? 0, r.best_pct);
    per.set(r.student_id, st);
  }
  const groups = new Map([['All universities', []]]);
  for (const st of per.values()) {
    if (st.uni === 'Demo') continue;
    groups.get('All universities').push(st);
    if (!groups.has(st.uni)) groups.set(st.uni, []);
    groups.get(st.uni).push(st);
  }
  return [...groups].map(([uni, list]) => {
    const out = { uni, students: list.length, quad: quadrants(list) };
    for (const k of SKILL_KEYS) { const v = list.map(st => st.s[k]).filter(x => x != null); out[k] = { median: median(v), n: v.length }; }
    return out;
  });
}

// Thinking profiles, same four as the Thinking Profile campus report:
//   own thinking  = median of the student's non-AI muscles (60+ = strong)
//   leans on AI   = "Using AI well" score below 60, i.e. they trust AI without catching its mistakes
// Independent thinker: strong, checks AI · Autopilot thinker: strong, trusts AI
// Still building: weak, checks AI · Offloader: weak, trusts AI
// Only students with 3+ non-AI muscles and 1+ AI game count.
const QUAD_AT = 60, QUAD_MIN_OWN = 3;
function quadrants(list){
  const q = { qualified: 0, independent: 0, autopilot: 0, still_building: 0, offloader: 0 };
  for (const st of list) {
    const own = SKILL_KEYS.filter(k => k !== 'ai' && st.s[k] != null).map(k => st.s[k]);
    if (own.length < QUAD_MIN_OWN || st.s.ai == null) continue;
    const strong = median(own) >= QUAD_AT, leansOnAI = st.s.ai < QUAD_AT;
    q.qualified++;
    q[strong ? (leansOnAI ? 'autopilot' : 'independent') : (leansOnAI ? 'offloader' : 'still_building')]++;
  }
  return q;
}

const CSV = {
  students: `SELECT s.id, s.name, s.roll AS niat_id, s.pilot AS batch, s.joined_at, s.last_seen,
               COALESCE(SUM(p.active), 0) / 60 AS minutes, COALESCE(SUM(p.plays), 0) AS rounds, COALESCE(SUM(p.vol), 0) AS kg_lifted,
               COALESCE(SUM(FLOOR(p.active / 6) + p.plays * 10), 0) AS points
             FROM students s LEFT JOIN progress p ON p.student_id = s.id GROUP BY s.id ORDER BY s.pilot, points DESC, s.name`,
  plays: `SELECT pl.played_at, s.name, s.roll AS niat_id, s.pilot AS batch, pl.game_id, pl.score, pl.pct, pl.lift, pl.secs, pl.meta
          FROM plays pl JOIN students s ON s.id = pl.student_id ORDER BY pl.played_at`,
  feedback: `SELECT f.created_at, s.name, s.roll AS niat_id, s.pilot AS batch, f.kind, f.game_id, f.rating, f.difficulty, f.fair, f.comment, f.meta
             FROM feedback f JOIN students s ON s.id = f.student_id ORDER BY f.created_at`,
  starts: `SELECT st.started_at, s.name, s.roll AS niat_id, s.pilot AS batch, st.game_id
           FROM starts st JOIN students s ON s.id = st.student_id ORDER BY st.started_at`,
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
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  if (limited('a:' + ipOf(req), 30)) return res.status(429).json({ ok: false, error: 'slow down' });
  if (!sameSecret(req.headers['x-admin-key'], process.env.ADMIN_KEY)) return res.status(401).json({ ok: false, error: 'wrong key' });
  if (!dbReady(res)) return;
  res.setHeader('Cache-Control', 'no-store');
  const q = new URL(req.url, 'http://x').searchParams;
  const sql = db();
  try {
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

    const [pilots, games, daily, comments, unfair, students, moods, bugs, goal, stars, ideas, best] = await Promise.all([
      sql`WITH pr AS (SELECT student_id, SUM(active)::int AS active, SUM(plays)::int AS plays FROM progress GROUP BY student_id)
          SELECT s.pilot, COUNT(*)::int AS on_roster, COUNT(s.joined_at)::int AS joined,
                 COUNT(*) FILTER (WHERE s.last_seen > now() - interval '7 days')::int AS active7,
                 COUNT(*) FILTER (WHERE s.last_seen > now() - interval '1 day')::int AS active1,
                 (COALESCE(SUM(pr.active), 0) / 60)::int AS minutes, COALESCE(SUM(pr.plays), 0)::int AS rounds
          FROM students s LEFT JOIN pr ON pr.student_id = s.id GROUP BY s.pilot ORDER BY s.pilot`,
      sql`WITH pr AS (SELECT game_id, COUNT(*) FILTER (WHERE plays > 0)::int AS players, SUM(plays)::int AS rounds,
                             (SUM(active) / 60)::int AS minutes,
                             ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY best_pct) FILTER (WHERE plays > 0))::numeric)::int AS med_best
                      FROM progress GROUP BY game_id),
               fb AS (SELECT game_id, ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY rating))::numeric, 1)::float AS rating, COUNT(rating)::int AS ratings,
                             COUNT(*) FILTER (WHERE difficulty = 'easy')::int AS easy, COUNT(*) FILTER (WHERE difficulty = 'right')::int AS just_right,
                             COUNT(*) FILTER (WHERE difficulty = 'hard')::int AS hard,
                             COUNT(*) FILTER (WHERE kind = 'verdict' AND fair = false)::int AS unfair
                      FROM feedback WHERE game_id IS NOT NULL GROUP BY game_id),
               st AS (SELECT game_id, COUNT(*)::int AS starts FROM starts GROUP BY game_id),
               tm AS (SELECT game_id, ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY secs))::numeric)::int AS med_secs
                      FROM plays WHERE secs IS NOT NULL GROUP BY game_id)
          SELECT COALESCE(pr.game_id, fb.game_id) AS game_id, pr.players, pr.rounds, pr.minutes, pr.med_best,
                 fb.rating, fb.ratings, fb.easy, fb.just_right, fb.hard, fb.unfair, st.starts, tm.med_secs
          FROM pr FULL JOIN fb ON fb.game_id = pr.game_id LEFT JOIN st ON st.game_id = COALESCE(pr.game_id, fb.game_id)
               LEFT JOIN tm ON tm.game_id = COALESCE(pr.game_id, fb.game_id) ORDER BY pr.minutes DESC NULLS LAST`,
      sql`SELECT to_char(played_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day, COUNT(*)::int AS rounds,
                 COUNT(DISTINCT student_id)::int AS students
          FROM plays WHERE played_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1`,
      sql`SELECT f.created_at, s.name, s.roll AS niat_id, f.kind, f.game_id, f.rating, f.difficulty, f.comment
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.comment IS NOT NULL AND f.kind NOT IN ('bug', 'session') ORDER BY f.created_at DESC LIMIT 200`,
      sql`SELECT f.created_at, s.name, f.game_id, f.meta, f.comment
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.kind = 'verdict' AND f.fair = false ORDER BY f.created_at DESC LIMIT 100`,
      sql.query(CSV.students.replace('GROUP BY s.id', 'WHERE s.joined_at IS NOT NULL GROUP BY s.id') + ' LIMIT 3000'),
      sql`SELECT to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
                 COUNT(*) FILTER (WHERE meta->>'mood' = 'tired')::int AS tired, COUNT(*) FILTER (WHERE meta->>'mood' = 'okay')::int AS okay,
                 COUNT(*) FILTER (WHERE meta->>'mood' = 'sharp')::int AS sharp
          FROM feedback WHERE kind = 'mood' AND created_at > now() - interval '14 days' GROUP BY 1 ORDER BY 1 DESC`,
      sql`SELECT f.created_at, s.name, s.roll AS niat_id, f.game_id, f.comment, f.meta
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.kind = 'bug' ORDER BY f.created_at DESC LIMIT 200`,
      // the attention metric: who trained, who hit the daily goal (15 minutes, same as DAY_GOAL in the page), median minutes of those who trained
      sql`SELECT to_char(day, 'YYYY-MM-DD') AS day, COUNT(*) FILTER (WHERE active > 0)::int AS trained,
                 COUNT(*) FILTER (WHERE active >= 900)::int AS hit_goal,
                 ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY active) FILTER (WHERE active > 0) / 60.0)::numeric, 1)::float AS med_min
          FROM daily WHERE day > current_date - 14 GROUP BY day ORDER BY day DESC`,
      // end-of-session "11-star" ratings: how many sessions got each star level
      sql`SELECT rating AS stars, COUNT(*)::int AS n FROM feedback WHERE kind = 'session' GROUP BY rating ORDER BY rating`,
      // what students said would make it a 7 or an 11, or what got in the way
      sql`SELECT f.created_at, s.name, s.roll AS niat_id, f.rating AS stars, f.comment, f.meta
          FROM feedback f JOIN students s ON s.id = f.student_id
          WHERE f.kind = 'session' AND (f.comment IS NOT NULL OR jsonb_array_length(COALESCE(f.meta->'why', '[]'::jsonb)) > 0)
          ORDER BY f.created_at DESC LIMIT 200`,
      // every student's best % per game, for the skill profiles
      sql`SELECT s.pilot, p.student_id, p.game_id, p.best_pct FROM progress p JOIN students s ON s.id = p.student_id WHERE p.plays > 0`
    ]);
    for (const p of pilots) p.uni = uniOf(p.pilot);
    for (const st of students) st.uni = uniOf(st.batch);
    const skills = skillProfiles(best);
    return res.status(200).json({ ok: true, pilots, games, daily, comments, unfair, students, moods, bugs, goal, stars, ideas, skills });
  } catch (e) {
    console.error('[admin]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}
