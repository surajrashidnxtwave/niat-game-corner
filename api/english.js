// POST /api/english — English Adda (own points, timer, streak and levels; separate from Brain Gym and Drive School)
//   { action: "state", token }             -> { ok, state }
//   { action: "tick",  token, secs }       -> { ok, today }     (active seconds, sent in batches of up to 2 minutes)
//   { action: "checkstart", token }        -> { ok, items }     (level check parts 1-3; no answers inside)
//   { action: "checknext",  token, rf, c1 } -> { ok, items }    (second passage + story, picked from parts 1-2)
//   { action: "checkdone",  token, rf, c1, c2, catch, story, secs } -> { ok, levels, state }   (scored here, saved once; DEMO can redo)
// Who can open it: batches listed in ENGLISH_BATCHES (comma separated, default "DEMO"; "ALL" opens it to everyone).
// Rules the server enforces (the page shows the same rules, but this is the copy that counts):
//   - the daily ring fills with active seconds; a tick can't add more time than has really passed since the last one
//   - a goal day = 15+ active minutes; the streak forgives one missed day per 7 days (a "freeze")
//   - fresh content closes at 25 minutes a day (test accounts, batch DEMO, have no limit)
import { createHash } from 'node:crypto';
import { db, studentFor, limited, ipOf, int, text, dbReady } from './_lib/db.js';
import { startItems, nextItems, score as scoreCheck } from './_lib/english-check.js';

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
    if (b.action === 'checkstart') return await checkStart(res, me);
    if (b.action === 'checknext') return checkNext(res, b);
    if (b.action === 'checkdone') return await checkDone(res, me, b);
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
  const levels = cleanLevels(s.levels);
  return {
    open: true, tester: tester(me), today: t, startedOn: s.started_on, points: s.points,
    levels, placed: !!s.placed_at, circuit: s.placed_at ? circuit(levels, me.id + ':' + t) : [],
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

// ---------- "Find your level" check ----------
async function checkStart(res, me) {
  if (!tester(me)) {
    const r = await db()`SELECT placed_at FROM english_students WHERE student_id = ${me.id}`;
    if (r[0] && r[0].placed_at) return res.status(409).json({ ok: false, error: 'already done' });
  }
  return res.status(200).json({ ok: true, items: startItems() });
}
const okRf = v => Array.isArray(v) && v.length <= 40 && v.every(x => x === true || x === false || x === null);
const okStrs = (v, n, len) => Array.isArray(v) && v.length <= n && v.every(x => x === null || (typeof x === 'string' && x.length <= len));
function checkNext(res, b) {
  if (!okRf(b.rf) || !okStrs(b.c1, 12, 20)) return res.status(400).json({ ok: false, error: 'bad answers' });
  return res.status(200).json({ ok: true, items: nextItems({ rf: b.rf, c1: b.c1 }) });
}
async function checkDone(res, me, b) {
  if (!okRf(b.rf) || !okStrs(b.c1, 12, 20) || !okStrs(b.c2, 12, 20) || !okStrs(b.catch, 4, 240)
    || !(Array.isArray(b.story) && b.story.length <= 2 && b.story.every(x => x === null || int(x, 0, 3)))) return res.status(400).json({ ok: false, error: 'bad answers' });
  const sql = db();
  await ensure(sql, me);
  const r = scoreCheck(b);
  const placement = { levels: r.levels, detail: r.detail, secs: int(b.secs, 0, 7200) ? b.secs : null };
  // first time only (test accounts can redo it); the WHERE keeps a second submit from changing a real student's levels
  const up = await sql.query(
    `UPDATE english_students SET levels = $2::jsonb, placement = $3::jsonb, placed_at = now(), updated_at = now()
     WHERE student_id = $1 AND (placed_at IS NULL OR $4::boolean) RETURNING student_id`,
    [me.id, JSON.stringify(r.levels), JSON.stringify(placement), tester(me)]);
  if (up.length) {
    const answers = { rf: b.rf, c1: b.c1, c2: b.c2, catch: b.catch, story: b.story };
    await sql.query(`INSERT INTO english_events (client_id, student_id, kind, data) VALUES ($1, $2, 'check', $3::jsonb) ON CONFLICT (client_id) DO NOTHING`,
      [me.id + ':check:' + Date.now(), me.id, JSON.stringify({ answers, result: placement })]);
  }
  return res.status(200).json({ ok: true, saved: up.length === 1, levels: r.levels, state: await state(me) });
}

// ---------- today's games ----------
// 5 sets a day, fixed for the day (seeded by student + date). 60% of sets train the 1-2 weakest skills.
// Word Groups (the daily puzzle) always comes first and Word Vault review is separate, so neither is in this list.
const SKILL_GAMES = { voc: ['realfake'], gra: ['jumble', 'spotfix'], lis: ['catch', 'rewind'], rea: ['reels', 'vanish'], wri: ['email'] };
function rng(seed) {
  let h = createHash('sha1').update(seed).digest().readUInt32LE(0);
  return () => { h |= 0; h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function circuit(levels, seed) {
  const rnd = rng(seed), pick = arr => arr[Math.floor(rnd() * arr.length)];
  const skills = SKILLS.slice().sort((a, b) => ((levels[a] || 1) - (levels[b] || 1)) || (rnd() - 0.5));
  const weak = skills.slice(0, 2), rest = skills.slice(2);
  const ra = pick(rest), rb = pick(rest.filter(x => x !== ra));
  const slots = [weak[0], weak[1], weak[0], ra, rb];            // 3 of 5 sets on the weakest skills
  const out = [];
  for (const sk of slots) {
    const g = SKILL_GAMES[sk], fresh = g.filter(x => !out.includes(x));
    out.push(pick(fresh.length ? fresh : g));
  }
  // at least 4 different games: swap a repeat for an unused game, weak skills first
  const pool = [...weak, ...rest].flatMap(sk => SKILL_GAMES[sk]);
  for (let i = 0; i < out.length && new Set(out).size < 4; i++) {
    if (out.indexOf(out[i]) !== i) { const u = pool.find(x => !out.includes(x)); if (u) out[i] = u; }
  }
  // order: shuffle until no game comes twice in a row
  for (let t = 0; t < 30; t++) {
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    if (out.every((g, i) => !i || g !== out[i - 1])) break;
  }
  return out;
}
