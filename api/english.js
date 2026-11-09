// POST /api/english — English Adda (own points, timer, streak and levels; separate from Brain Gym and Drive School)
//   { action: "state", token }             -> { ok, state }
//   { action: "tick",  token, secs }       -> { ok, today }     (active seconds, sent in batches of up to 2 minutes)
// Who can open it: batches listed in ENGLISH_BATCHES (comma separated, default "DEMO"; "ALL" opens it to everyone).
// Rules the server enforces (the page shows the same rules, but this is the copy that counts):
//   - the daily ring fills with active seconds; a tick can't add more time than has really passed since the last one
//   - a goal day = 15+ active minutes; the streak forgives one missed day per 7 days (a "freeze")
//   - fresh content closes at 25 minutes a day (test accounts, batch DEMO, have no limit)
import { db, studentFor, limited, ipOf, int, dbReady } from './_lib/db.js';

export const GOAL = 900;          // 15 minutes
export const CAP = 1500;          // 25 minutes of fresh content a day
const DAY_MAX = 6 * 3600;         // sanity cap on one day's active seconds
const SKILLS = ['voc', 'gra', 'lis', 'rea', 'wri'];

const batches = () => (process.env.ENGLISH_BATCHES || 'DEMO').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
export const allowed = me => { const b = batches(); return b.includes('ALL') || b.includes(String(me.pilot || '').toUpperCase()); };
export const tester = me => me.pilot === 'DEMO';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!dbReady(res)) return;
  const b = req.body || {};
  try {
    if (limited('e:' + ipOf(req), 180)) return res.status(429).json({ ok: false, error: 'slow down' });
    const me = await studentFor(b.token);
    if (!me) return res.status(401).json({ ok: false, error: 'not joined' });
    if (!allowed(me)) return res.status(403).json({ ok: false, open: false, error: 'not open for your batch yet' });
    if (b.action === 'state') return res.status(200).json({ ok: true, state: await state(me) });
    if (b.action === 'tick') return await tick(res, me, b);
    return res.status(400).json({ ok: false, error: 'bad action' });
  } catch (e) {
    console.error('[english]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}

const IST_TODAY = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;

async function ensure(sql, me) {
  await sql.query(`INSERT INTO english_students (student_id, started_on) VALUES ($1, ${IST_TODAY}) ON CONFLICT (student_id) DO NOTHING`, [me.id]);
}

async function state(me) {
  const sql = db();
  await ensure(sql, me);
  const [st, days, today] = await Promise.all([
    sql`SELECT to_char(started_on, 'YYYY-MM-DD') AS started_on, points, levels, placed_at FROM english_students WHERE student_id = ${me.id}`,
    sql.query(`SELECT to_char(day, 'YYYY-MM-DD') AS d, active FROM english_daily WHERE student_id = $1 AND day > ${IST_TODAY} - 400 ORDER BY day DESC`, [me.id]),
    sql.query(`SELECT to_char(${IST_TODAY}, 'YYYY-MM-DD') AS d`)
  ]);
  const t = today[0].d, s = st[0];
  const todaySecs = (days.find(x => x.d === t) || {}).active || 0;
  const goalDates = days.filter(x => x.active >= GOAL).map(x => x.d);
  return {
    open: true, tester: tester(me), today: t, startedOn: s.started_on, points: s.points,
    levels: cleanLevels(s.levels), placed: !!s.placed_at,
    todaySecs, goal: GOAL, cap: CAP, closed: !tester(me) && todaySecs >= CAP,
    streak: streak(goalDates, t), goalDays: goalDates.length
  };
}
const cleanLevels = l => { const o = {}; for (const k of SKILLS) o[k] = int(l && l[k], 1, 8) ? l[k] : null; return o; };

// Goal days in a row, ending today (or yesterday while today's goal isn't met yet).
// One missed day is forgiven per 7 days (a freeze); a second miss inside that window ends the streak.
export function streak(goalDates, today) {
  const have = new Set(goalDates);
  const step = d => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
  let d = have.has(today) ? today : step(today), n = 0, i = 0, lastFreeze = -99, frozen = [];
  for (; i < 400; i++, d = step(d)) {
    if (have.has(d)) { n++; continue; }
    // a lone missed day is frozen if the streak continues behind it (i === 0: yesterday was missed and today isn't done yet)
    if ((n > 0 || i === 0) && i - lastFreeze >= 7 && have.has(step(d))) { lastFreeze = i; frozen.push(d); continue; }
    break;
  }
  return { n, frozen };
}

// adds active seconds to today's row; never more than the time that has passed since the last tick (+10 s slack)
async function tick(res, me, b) {
  if (!int(b.secs, 1, 120)) return res.status(400).json({ ok: false, error: 'bad tick' });
  const r = await db().query(
    `INSERT INTO english_daily (student_id, day, active, updated_at) VALUES ($1, ${IST_TODAY}, $2, now())
     ON CONFLICT (student_id, day) DO UPDATE SET
       active = LEAST(english_daily.active + LEAST($2, GREATEST(0, EXTRACT(EPOCH FROM now() - english_daily.updated_at)::int + 10)), $3),
       updated_at = now()
     RETURNING active`, [me.id, b.secs, DAY_MAX]);
  return res.status(200).json({ ok: true, today: r[0].active });
}
