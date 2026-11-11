// GET /api/admin?view=summary           -> pilot report as JSON
// GET /api/admin?view=csv&table=<name>  -> CSV download (students | plays | feedback | progress | starts | drive_students | drive_events | drive_ratings)
// GET /api/admin?view=drive             -> Drive School report as JSON (test batch DEMO left out)
// Needs header  x-admin-key: <ADMIN_KEY>. Read-only: the roster is loaded directly into the database.
import { db, sameSecret, limited, ipOf, dbReady } from './_lib/db.js';
import { DRIVE_LAST_BUILT } from './drive.js';

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
  'trust-or-check': 'ai', 'source-check': 'ai', 'taste-test': 'ai', 'right-tool': 'ai', 'hint-ladder': 'ai', 'code-review': 'ai', 'you-or-ai': 'ai'
};
const SKILL_KEYS = ['creativity', 'insight', 'memory', 'focus', 'reasoning', 'flexibility', 'planning', 'ai'];
// median from counts: hist = Map(value -> how many). Middle two averaged, 1 decimal. null when empty.
function medHist(hist){
  const v = [...hist].filter(([, n]) => n > 0).sort((a, b) => a[0] - b[0]), n = v.reduce((a, [, c]) => a + c, 0);
  if (!n) return null;
  const at = i => { let t = 0; for (const [x, c] of v) { t += c; if (t > i) return x; } return 0; };
  return Math.round((at((n - 1) >> 1) + at(n >> 1)) / 2 * 10) / 10;
}
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
             FROM progress p JOIN students s ON s.id = p.student_id ORDER BY s.pilot, s.roll, p.game_id`,
  drive_students: `SELECT s.name, s.roll AS niat_id, s.pilot AS batch, ds.started_on, ds.points,
                     COUNT(dd.day)::int AS days_done, MAX(dd.day) AS last_day, MAX(dd.completed_at) AS last_done_at,
                     (COALESCE(SUM(LEAST(dd.secs, 3600)), 0) + COALESCE((SELECT SUM(LEAST((e.data->>'secs')::int, 3600)) FROM drive_events e WHERE e.student_id = ds.student_id AND e.kind = 'time'), 0)) / 60 AS minutes,
                     ds.memo
                   FROM drive_students ds JOIN students s ON s.id = ds.student_id LEFT JOIN drive_days dd ON dd.student_id = ds.student_id
                   GROUP BY s.id, ds.student_id ORDER BY s.pilot, days_done DESC, s.name`,
  drive_ratings: `SELECT e.created_at, s.name, s.roll AS niat_id, s.pilot AS batch, e.day, (e.data->>'stars')::int AS stars,
                   e.data->'why' AS what_got_in_the_way_or_make_it_better, e.data->'best' AS best_part, e.data->>'text' AS comment, (e.data->>'late')::boolean AS rated_later
                 FROM drive_events e JOIN students s ON s.id = e.student_id WHERE e.kind = 'rate' ORDER BY e.created_at`,
  drive_events: `SELECT e.created_at, s.name, s.roll AS niat_id, s.pilot AS batch, e.day, e.kind, e.screen, e.replay, e.data
                 FROM drive_events e JOIN students s ON s.id = e.student_id ORDER BY e.created_at`
};

// Day 0 scales: a student's score = mean of the items on 1-5, reverse-scored items flipped (higher = more "can grow" / more stick-with-it).
// Only each student's first answer counts (replays are skipped by the query).
function scaleScores(rows){
  const per = { mindset: [], grit: [] }, items = { mindset: [], grit: [] };
  for (const r of rows) {
    const d = r.data || {}, raw = d.raw, rev = d.reverse || [], top = (d.points || 5) + 1;
    if (!per[d.scale] || !Array.isArray(raw) || !raw.length || raw.some(v => !Number.isInteger(v) || v < 1 || v >= top)) continue;
    const vals = raw.map((v, i) => rev[i] ? top - v : v);
    per[d.scale].push({ uni: uniOf(r.pilot), score: vals.reduce((a, b) => a + b, 0) / vals.length });
    raw.forEach((v, i) => { const c = items[d.scale][i] = items[d.scale][i] || Array(top - 1).fill(0); c[v - 1]++; });
  }
  const out = {};
  for (const k of Object.keys(per)) {
    const groups = new Map([['All universities', []]]);
    for (const x of per[k]) { groups.get('All universities').push(x.score); if (!groups.has(x.uni)) groups.set(x.uni, []); groups.get(x.uni).push(x.score); }
    out[k] = {
      unis: [...groups].map(([uni, v]) => ({ uni, n: v.length, med: v.length ? (() => { const s = v.slice().sort((a, b) => a - b), m = s.length >> 1; return +(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2).toFixed(2); })() : null,
        low: v.filter(x => x < 2.5).length, mid: v.filter(x => x >= 2.5 && x < 3.5).length, high: v.filter(x => x >= 3.5).length })),
      items: items[k]                                  // per item: how many picked option 1..5 (raw, before flipping)
    };
  }
  return out;
}

// Drive School report. Test accounts (batch DEMO) are left out everywhere.
async function driveReport(sql){
  const REAL = `s.pilot NOT LIKE 'DEMO%'`;
  const DD = `dd AS (SELECT student_id, COUNT(*) FILTER (WHERE day > 0)::int AS lessons, BOOL_OR(day = 0) AS setup, MAX(completed_at) AS last FROM drive_days GROUP BY student_id)`;
  const RATE = `e.kind = 'rate' AND ${REAL}`, STARS = `(e.data->>'stars')::int`;
  // lesson time: first finishes (drive_days.secs) + replays ('time' events). Each lesson capped at 60 minutes,
  // so a tab left open overnight doesn't count as hours. Time in lessons left unfinished isn't recorded.
  const TIME = `t AS (SELECT d.student_id, d.completed_at AS at, LEAST(d.secs, 3600) AS secs FROM drive_days d WHERE d.secs IS NOT NULL
                 UNION ALL SELECT e.student_id, e.created_at, LEAST((e.data->>'secs')::int, 3600) FROM drive_events e WHERE e.kind = 'time'),
           tt AS (SELECT t.* FROM t JOIN students s ON s.id = t.student_id WHERE ${REAL})`;
  const IST = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;
  const [kpi, funnel, daily, acc, scales, study, hours, stands, texts, unis, students, week, rates, rateTexts, chips, lessonHist, rateHist, mins, minsDaily] = await Promise.all([
    sql.query(`WITH ${DD}
      SELECT COUNT(*)::int AS started, COUNT(*) FILTER (WHERE dd.setup)::int AS setup_done, COUNT(*) FILTER (WHERE dd.lessons > 0)::int AS lesson1,
             COUNT(*) FILTER (WHERE dd.lessons >= ${DRIVE_LAST_BUILT})::int AS all_done,
             COUNT(*) FILTER (WHERE dd.last > now() - interval '7 days')::int AS active7,
             COUNT(*) FILTER (WHERE dd.last > now() - interval '1 day')::int AS active1,
             COALESCE(SUM(ds.points), 0)::int AS points
      FROM drive_students ds JOIN students s ON s.id = ds.student_id LEFT JOIN dd ON dd.student_id = ds.student_id WHERE ${REAL}`),
    // per day: who opened it, who finished it, median minutes and points of first finishes
    sql.query(`WITH op AS (SELECT e.day, COUNT(DISTINCT e.student_id)::int AS opened FROM drive_events e JOIN students s ON s.id = e.student_id WHERE e.kind = 'open' AND ${REAL} GROUP BY e.day),
           fi AS (SELECT d.day, COUNT(*)::int AS finished, ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY d.secs) / 60.0)::numeric, 1)::float AS med_min,
                         ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY d.points))::numeric)::int AS med_pts
                  FROM drive_days d JOIN students s ON s.id = d.student_id WHERE ${REAL} GROUP BY d.day)
      SELECT g.day, COALESCE(op.opened, 0) AS opened, COALESCE(fi.finished, 0) AS finished, fi.med_min, fi.med_pts
      FROM generate_series(0, ${DRIVE_LAST_BUILT}) AS g(day) LEFT JOIN op ON op.day = g.day LEFT JOIN fi ON fi.day = g.day ORDER BY g.day`),
    // per India calendar day, last 14 days: active = did anything in Drive School (opened or finished a lesson);
    // finished = finished a lesson for the first time; minutes = their lesson time that day (first finishes; replay time isn't recorded)
    sql.query(`WITH act AS (SELECT DISTINCT (e.created_at AT TIME ZONE 'Asia/Kolkata')::date AS day, e.student_id FROM drive_events e JOIN students s ON s.id = e.student_id
                            WHERE ${REAL} AND e.created_at > now() - interval '15 days'),
                fin AS (SELECT d.ist_date AS day, d.student_id, COUNT(*)::int AS lessons, SUM(d.secs) AS secs FROM drive_days d JOIN students s ON s.id = d.student_id
                            WHERE ${REAL} AND d.ist_date > current_date - 15 GROUP BY 1, 2),
                u AS (SELECT COALESCE(act.day, fin.day) AS day, COALESCE(act.student_id, fin.student_id) AS sid, fin.lessons, fin.secs
                      FROM act FULL JOIN fin ON fin.day = act.day AND fin.student_id = act.student_id)
      SELECT to_char(day, 'YYYY-MM-DD') AS day, COUNT(*)::int AS active, COUNT(lessons)::int AS students, COALESCE(SUM(lessons), 0)::int AS lessons,
             ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY secs) / 60.0)::numeric, 1)::float AS med_min
      FROM u WHERE day > (now() AT TIME ZONE 'Asia/Kolkata')::date - 14 GROUP BY day ORDER BY day`),
    // first-try answers per question (replays left out)
    sql.query(`SELECT e.day, e.screen, MIN(e.data->>'dim') AS dim, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE (e.data->>'correct')::boolean)::int AS correct
      FROM drive_events e JOIN students s ON s.id = e.student_id
      WHERE e.kind = 'attempt' AND e.replay = false AND ${REAL} GROUP BY e.day, e.screen ORDER BY e.day, e.screen`),
    sql.query(`SELECT DISTINCT ON (e.student_id, e.data->>'scale') s.pilot, e.data FROM drive_events e JOIN students s ON s.id = e.student_id
      WHERE e.kind = 'scale' AND e.replay = false AND ${REAL} ORDER BY e.student_id, e.data->>'scale', e.created_at`),
    sql.query(`SELECT x.habit, COUNT(DISTINCT e.student_id)::int AS n
      FROM drive_events e JOIN students s ON s.id = e.student_id CROSS JOIN LATERAL jsonb_array_elements_text(e.data->'picked') AS x(habit)
      WHERE e.kind = 'study' AND e.data->>'key' = 'study' AND e.replay = false AND ${REAL} GROUP BY 1 ORDER BY 2 DESC`),
    sql.query(`WITH h AS (SELECT DISTINCT ON (e.student_id) (e.data->>'value')::float AS v FROM drive_events e JOIN students s ON s.id = e.student_id
                        WHERE e.kind = 'study' AND e.data->>'key' = 'studyHours' AND e.replay = false AND ${REAL} ORDER BY e.student_id, e.created_at),
                a AS (SELECT COUNT(DISTINCT e.student_id)::int AS n FROM drive_events e JOIN students s ON s.id = e.student_id
                        WHERE e.kind = 'study' AND e.data->>'key' = 'study' AND e.replay = false AND ${REAL})
      SELECT COUNT(*)::int AS n, ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY v))::numeric, 1)::float AS med,
             COUNT(*) FILTER (WHERE v = 0)::int AS zero, COUNT(*) FILTER (WHERE v >= 10)::int AS ten_plus, (SELECT n FROM a) AS answered_habits FROM h`),
    sql.query(`SELECT e.day, e.data->>'sideName' AS side, COUNT(DISTINCT e.student_id)::int AS n,
             COUNT(DISTINCT e.student_id) FILTER (WHERE e.data->'self'->>'choice' = 'revise')::int AS revised
      FROM drive_events e JOIN students s ON s.id = e.student_id WHERE e.kind = 'stand' AND e.replay = false AND ${REAL} GROUP BY 1, 2 ORDER BY 1, 3 DESC`),
    // what students wrote: reflections, plans, stands (latest 300)
    sql.query(`SELECT e.created_at, s.name, s.roll AS niat_id, s.pilot AS batch, e.day, e.kind, e.data
      FROM drive_events e JOIN students s ON s.id = e.student_id
      WHERE e.kind IN ('reflect', 'plan', 'stand') AND e.replay = false AND ${REAL} ORDER BY e.created_at DESC LIMIT 300`),
    sql.query(`WITH ${DD},
           rt AS (SELECT e.student_id, COUNT(*)::int AS n, COUNT(*) FILTER (WHERE ${STARS} >= 7)::int AS hi
                  FROM drive_events e WHERE e.kind = 'rate' GROUP BY e.student_id), ${TIME},
           tm AS (SELECT student_id, SUM(secs) AS secs FROM tt GROUP BY student_id)
      SELECT s.pilot, (COALESCE(SUM(tm.secs), 0) / 60)::int AS minutes, COUNT(*)::int AS started, COUNT(*) FILTER (WHERE dd.setup)::int AS setup_done, COUNT(*) FILTER (WHERE dd.lessons > 0)::int AS lesson1,
             COALESCE(SUM(dd.lessons), 0)::int AS lessons, COUNT(*) FILTER (WHERE dd.last > now() - interval '7 days')::int AS active7,
             COALESCE(SUM(rt.n), 0)::int AS rated, COALESCE(SUM(rt.hi), 0)::int AS rated_hi
      FROM drive_students ds JOIN students s ON s.id = ds.student_id LEFT JOIN dd ON dd.student_id = ds.student_id LEFT JOIN rt ON rt.student_id = ds.student_id
           LEFT JOIN tm ON tm.student_id = ds.student_id
      WHERE ${REAL} GROUP BY s.pilot`),
    sql.query(`WITH ${DD},
           rt AS (SELECT e.student_id, ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY ${STARS}))::numeric, 1)::float AS stars FROM drive_events e WHERE e.kind = 'rate' GROUP BY e.student_id),
           ${TIME}, tm AS (SELECT student_id, SUM(secs) AS secs FROM tt GROUP BY student_id)
      SELECT s.name, s.roll AS niat_id, s.pilot AS batch, ds.points, to_char(ds.started_on, 'YYYY-MM-DD') AS started_on,
             COALESCE(dd.lessons, 0) AS lessons, COALESCE(dd.setup, false) AS setup, dd.last AS last_at, rt.stars, (COALESCE(tm.secs, 0) / 60)::int AS minutes
      FROM drive_students ds JOIN students s ON s.id = ds.student_id LEFT JOIN dd ON dd.student_id = ds.student_id LEFT JOIN rt ON rt.student_id = ds.student_id
           LEFT JOIN tm ON tm.student_id = ds.student_id
      WHERE ${REAL} ORDER BY lessons DESC, ds.points DESC, s.name LIMIT 3000`),
    // this week (last 7 days) vs the 7 days before, for the trend arrows
    sql.query(`SELECT
        (SELECT COUNT(DISTINCT e.student_id) FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${REAL} AND e.created_at > now() - interval '7 days')::int AS active_w,
        (SELECT COUNT(DISTINCT e.student_id) FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${REAL} AND e.created_at <= now() - interval '7 days' AND e.created_at > now() - interval '14 days')::int AS active_pw,
        (SELECT COUNT(*) FROM drive_days d JOIN students s ON s.id = d.student_id WHERE ${REAL} AND d.day > 0 AND d.completed_at > now() - interval '7 days')::int AS lessons_w,
        (SELECT COUNT(*) FROM drive_days d JOIN students s ON s.id = d.student_id WHERE ${REAL} AND d.day > 0 AND d.completed_at <= now() - interval '7 days' AND d.completed_at > now() - interval '14 days')::int AS lessons_pw,
        (SELECT COUNT(*) FROM drive_students ds JOIN students s ON s.id = ds.student_id WHERE ${REAL} AND ds.started_on > current_date - 7)::int AS new_w,
        (SELECT ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY x.n))::numeric, 1)::float FROM (
           SELECT a.student_id, (SELECT COUNT(*) FROM drive_days d WHERE d.student_id = a.student_id AND d.day > 0 AND d.completed_at > now() - interval '7 days') AS n
           FROM (SELECT DISTINCT e.student_id FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${REAL} AND e.created_at > now() - interval '7 days') a) x) AS med_lessons_w,
        (SELECT COUNT(*) FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${RATE} AND e.created_at > now() - interval '7 days')::int AS rated_w,
        (SELECT COUNT(*) FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${RATE} AND ${STARS} >= 7 AND e.created_at > now() - interval '7 days')::int AS hi_w,
        (SELECT COUNT(*) FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${RATE} AND e.created_at <= now() - interval '7 days' AND e.created_at > now() - interval '14 days')::int AS rated_pw,
        (SELECT COUNT(*) FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${RATE} AND ${STARS} >= 7 AND e.created_at <= now() - interval '7 days' AND e.created_at > now() - interval '14 days')::int AS hi_pw`),
    // end-of-lesson 11-star ratings: how many of each star level, per day
    sql.query(`SELECT e.day, ${STARS} AS stars, COUNT(*)::int AS n FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${RATE} GROUP BY 1, 2 ORDER BY 1, 2`),
    // ratings that came with words or picked reasons (latest 300)
    sql.query(`SELECT e.created_at, s.name, s.roll AS niat_id, s.pilot AS batch, e.day, e.data
      FROM drive_events e JOIN students s ON s.id = e.student_id
      WHERE ${RATE} AND (COALESCE(e.data->>'text', '') <> '' OR jsonb_array_length(COALESCE(e.data->'why', '[]')) > 0 OR jsonb_array_length(COALESCE(e.data->'best', '[]')) > 0)
      ORDER BY e.created_at DESC LIMIT 300`),
    // the tap-to-pick reasons: what got in the way (1-4), what would make it a 7 (5-6), best part (5+)
    sql.query(`SELECT x.k, x.chip, CASE WHEN ${STARS} >= 7 THEN 'high' WHEN ${STARS} >= 5 THEN 'mid' ELSE 'low' END AS band, COUNT(*)::int AS n
      FROM drive_events e JOIN students s ON s.id = e.student_id
      CROSS JOIN LATERAL (SELECT 'why' AS k, w AS chip FROM jsonb_array_elements_text(COALESCE(e.data->'why', '[]')) w
                          UNION ALL SELECT 'best', b FROM jsonb_array_elements_text(COALESCE(e.data->'best', '[]')) b) x
      WHERE ${RATE} GROUP BY 1, 2, 3 ORDER BY 4 DESC`),
    // per batch: how many students finished 0, 1, 2... lessons, and how many ratings of each star level (for per-university medians)
    sql.query(`WITH ${DD} SELECT s.pilot, COALESCE(dd.lessons, 0) AS v, COUNT(*)::int AS n
      FROM drive_students ds JOIN students s ON s.id = ds.student_id LEFT JOIN dd ON dd.student_id = ds.student_id WHERE ${REAL} GROUP BY 1, 2`),
    sql.query(`SELECT s.pilot, ${STARS} AS v, COUNT(*)::int AS n FROM drive_events e JOIN students s ON s.id = e.student_id WHERE ${RATE} GROUP BY 1, 2`),
    // minutes in lessons: today (IST), last 7 days, the 7 before, all time, and the median per student this week
    sql.query(`WITH ${TIME},
           wk AS (SELECT student_id, SUM(secs) AS secs FROM tt WHERE at > now() - interval '7 days' GROUP BY student_id)
      SELECT (COALESCE(SUM(secs) FILTER (WHERE (at AT TIME ZONE 'Asia/Kolkata')::date = ${IST}), 0) / 60)::int AS today,
             COUNT(DISTINCT student_id) FILTER (WHERE (at AT TIME ZONE 'Asia/Kolkata')::date = ${IST})::int AS students_today,
             (COALESCE(SUM(secs) FILTER (WHERE at > now() - interval '7 days'), 0) / 60)::int AS week,
             (COALESCE(SUM(secs) FILTER (WHERE at <= now() - interval '7 days' AND at > now() - interval '14 days'), 0) / 60)::int AS prev_week,
             (COALESCE(SUM(secs), 0) / 60)::int AS total,
             (SELECT ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY secs) / 60.0)::numeric)::int FROM wk) AS med_week
      FROM tt`),
    // minutes per India calendar day, last 14 days
    sql.query(`WITH ${TIME}
      SELECT to_char((at AT TIME ZONE 'Asia/Kolkata')::date, 'YYYY-MM-DD') AS day, (SUM(secs) / 60)::int AS minutes
      FROM tt WHERE at > now() - interval '15 days' GROUP BY 1`)
  ]);
  const um = new Map();                                // batches -> universities
  for (const p of unis) {
    const name = uniOf(p.pilot), u = um.get(name) || { uni: name, started: 0, setup_done: 0, lesson1: 0, lessons: 0, active7: 0 };
    for (const k of ['started', 'setup_done', 'lesson1', 'lessons', 'active7', 'rated', 'rated_hi', 'minutes']) u[k] = (u[k] || 0) + p[k];
    um.set(name, u);
  }
  const medBy = rows => {                              // batches -> university histograms -> median
    const h = new Map();
    for (const r of rows) { const u = uniOf(r.pilot), m = h.get(u) || new Map(); m.set(r.v, (m.get(r.v) || 0) + r.n); h.set(u, m); }
    return u => h.has(u) ? medHist(h.get(u)) : null;
  };
  const medL = medBy(lessonHist), medS = medBy(rateHist);
  for (const u of um.values()) { u.med_lessons = medL(u.uni); u.med_stars = medS(u.uni); }
  for (const st of students) st.uni = uniOf(st.batch);
  for (const t of texts) t.uni = uniOf(t.batch);
  for (const t of rateTexts) t.uni = uniOf(t.batch);
  return { ok: true, built: DRIVE_LAST_BUILT, kpi: kpi[0], week: week[0], mins: mins[0], minsDaily, funnel, daily, acc, scales: scaleScores(scales), study, hours: hours[0], stands, texts,
           rates, rateTexts, chips, unis: [...um.values()].sort((a, b) => b.started - a.started), students };
}

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
      res.setHeader('Content-Disposition', `attachment; filename="${t.startsWith('drive_') ? 'drive-school-' + t.slice(6) : 'brain-gym-' + t}.csv"`);
      return res.status(200).send('\uFEFF' + body);
    }

    if (q.get('view') === 'drive') return res.status(200).json(await driveReport(sql));

    const [pilots, games, daily, comments, unfair, students, moods, bugs, goal, stars, ideas, best, week] = await Promise.all([
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
      sql`SELECT s.pilot, p.student_id, p.game_id, p.best_pct FROM progress p JOIN students s ON s.id = p.student_id WHERE p.plays > 0`,
      // this week (last 7 India days) vs the 7 days before, for the Summary page's trend arrows
      sql`SELECT COUNT(DISTINCT d.student_id) FILTER (WHERE d.day > current_date - 7)::int AS active_w,
                 COUNT(DISTINCT d.student_id) FILTER (WHERE d.day <= current_date - 7)::int AS active_pw,
                 (COALESCE(SUM(d.active) FILTER (WHERE d.day > current_date - 7), 0) / 60)::int AS minutes_w,
                 (COALESCE(SUM(d.active) FILTER (WHERE d.day <= current_date - 7), 0) / 60)::int AS minutes_pw,
                 (SELECT ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY w.secs) / 60.0)::numeric)::int FROM (
                    SELECT d2.student_id, SUM(d2.active) AS secs FROM daily d2 JOIN students s3 ON s3.id = d2.student_id
                    WHERE d2.active > 0 AND d2.day > current_date - 7 AND s3.pilot NOT LIKE 'DEMO%' GROUP BY 1) w) AS med_min_w,
                 (SELECT COUNT(*) FROM feedback f JOIN students s2 ON s2.id = f.student_id WHERE f.kind = 'session' AND s2.pilot NOT LIKE 'DEMO%' AND f.created_at > now() - interval '7 days')::int AS rated_w,
                 (SELECT COUNT(*) FROM feedback f JOIN students s2 ON s2.id = f.student_id WHERE f.kind = 'session' AND f.rating >= 7 AND s2.pilot NOT LIKE 'DEMO%' AND f.created_at > now() - interval '7 days')::int AS hi_w,
                 (SELECT COUNT(*) FROM feedback f JOIN students s2 ON s2.id = f.student_id WHERE f.kind = 'session' AND s2.pilot NOT LIKE 'DEMO%' AND f.created_at <= now() - interval '7 days' AND f.created_at > now() - interval '14 days')::int AS rated_pw,
                 (SELECT COUNT(*) FROM feedback f JOIN students s2 ON s2.id = f.student_id WHERE f.kind = 'session' AND f.rating >= 7 AND s2.pilot NOT LIKE 'DEMO%' AND f.created_at <= now() - interval '7 days' AND f.created_at > now() - interval '14 days')::int AS hi_pw,
                 (SELECT COUNT(*) FROM feedback f WHERE f.kind = 'bug' AND f.created_at > now() - interval '7 days')::int AS bugs_w
          FROM daily d JOIN students s ON s.id = d.student_id
          WHERE d.active > 0 AND d.day > current_date - 14 AND s.pilot NOT LIKE 'DEMO%'`
    ]);
    for (const p of pilots) p.uni = uniOf(p.pilot);
    for (const st of students) st.uni = uniOf(st.batch);
    const skills = skillProfiles(best);
    return res.status(200).json({ ok: true, pilots, games, daily, comments, unfair, students, moods, bugs, goal, stars, ideas, skills, week: week[0] });
  } catch (e) {
    console.error('[admin]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}
