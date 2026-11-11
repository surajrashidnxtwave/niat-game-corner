// POST /api/drive — Drive School (separate from Brain Gym points and streak)
//   { action: "state",   token }                                  -> { ok, state }
//   { action: "open",    token, day, cid, at }                    -> { ok }          (lesson opened; counts drop-offs)
//   { action: "finish",  token, day, cid, at, pts, secs, events: [...], memo: {...} } -> { ok, first, state }
//   { action: "split",   token, day }                             -> { ok, n, split|null }  (batch side split, only at 20+)
//   { action: "profile", token }                                  -> { ok, profile }
//   { action: "rate",    token, day, stars, why, best, text, secs, late } -> { ok }   (11-star lesson rating, once per student per day)
// Rules the server enforces (the page shows the same rules, but this is the copy that counts):
//   - Day N needs Day N-1 done (Day 0 setup and Day 1 are always open)
//   - at most 3 first completions per India calendar day (Day 0 setup doesn't count)
//   - replays save their answers but give no points and don't count toward the cap
//   - points per lesson are capped, so an edited page can't inflate the leaderboard
import { db, studentFor, limited, ipOf, int, text, dbReady } from './_lib/db.js';

export const DRIVE_LAST_BUILT = 14;     // highest day with content in this release
const DAILY_MAX = 3;
const MAX_PTS = 400;                    // generous cap per lesson; real lessons give about 100–250
const KINDS = ['attempt', 'predict', 'recall', 'plan', 'rewrite', 'reflect', 'stand', 'game', 'scale', 'study', 'pairs', 'theory', 'sort', 'review', 'story', 'practice'];
const DIMS = ['strategy', 'motivation', 'voice'];
const SPLIT_MIN = 20;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!dbReady(res)) return;
  const b = req.body || {};
  try {
    if (limited('d:' + ipOf(req), 120)) return res.status(429).json({ ok: false, error: 'slow down' });
    const me = await studentFor(b.token);
    if (!me) return res.status(401).json({ ok: false, error: 'not joined' });
    if (b.action === 'state') return res.status(200).json({ ok: true, state: await state(me) });
    if (b.action === 'open') return await open(res, me, b);
    if (b.action === 'finish') return await finish(res, me, b);
    if (b.action === 'split') return await split(res, me, b);
    if (b.action === 'profile') return res.status(200).json({ ok: true, profile: await profile(me) });
    if (b.action === 'rate') return await rate(res, me, b);
    return res.status(400).json({ ok: false, error: 'bad action' });
  } catch (e) {
    console.error('[drive]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}

const IST_TODAY = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;
// a client time is trusted only if it is within the last 36 hours (lets an offline finish sync later)
const okAt = at => int(at, Date.now() - 36 * 3_600_000, Date.now() + 5 * 60_000);

async function ensure(sql, me) {
  await sql.query(`INSERT INTO drive_students (student_id, started_on) VALUES ($1, ${IST_TODAY}) ON CONFLICT (student_id) DO NOTHING`, [me.id]);
}

async function state(me) {
  const sql = db();
  await ensure(sql, me);
  const [st, days, today] = await Promise.all([
    sql`SELECT to_char(started_on, 'YYYY-MM-DD') AS started_on, points, memo FROM drive_students WHERE student_id = ${me.id}`,
    sql`SELECT day, completed_at, to_char(ist_date, 'YYYY-MM-DD') AS ist, points FROM drive_days WHERE student_id = ${me.id} ORDER BY day`,
    sql.query(`SELECT to_char(${IST_TODAY}, 'YYYY-MM-DD') AS d`)
  ]);
  const t = today[0].d;
  const done = {};
  for (const d of days) done[d.day] = { at: new Date(d.completed_at).getTime(), ist: d.ist, pts: d.points };
  const firstToday = days.filter(d => d.ist === t && d.day > 0).length;
  return { today: t, startedOn: st[0].started_on, points: st[0].points, memo: st[0].memo || {}, done, firstToday, streak: streak(days.map(d => d.ist), t), lastBuilt: DRIVE_LAST_BUILT, dailyMax: DAILY_MAX };
}

// consecutive India calendar days with at least one completed lesson, ending today (or yesterday, if today has none yet)
function streak(dates, today) {
  const have = new Set(dates);
  const step = d => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
  let d = have.has(today) ? today : step(today), n = 0;
  while (have.has(d)) { n++; d = step(d); }
  return n;
}

async function open(res, me, b) {
  if (!int(b.day, 0, 56) || !text(b.cid, 40)) return res.status(400).json({ ok: false, error: 'bad open' });
  const at = okAt(b.at) ? b.at : Date.now();
  await db().query(`INSERT INTO drive_events (client_id, student_id, day, kind, data, created_at) VALUES ($1, $2, $3, 'open', '{}', to_timestamp($4 / 1000.0)) ON CONFLICT (client_id) DO NOTHING`,
    [me.id + ':' + b.cid, me.id, b.day, at]);
  return res.status(200).json({ ok: true });
}

function cleanEvents(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 200).filter(e => e && KINDS.includes(e.kind) && (e.screen == null || text(e.screen, 40))
    && e.data && typeof e.data === 'object' && JSON.stringify(e.data).length <= 6000);
}
// memo: only these keys, each small; later lessons read them (Day 7 retest, Day 19 plan check, Day 55 stand)
const MEMO_KEYS = /^(predict|recall|pairs|plan_d\d+|stand_d\d+|reason|study|studyHours|scales|bounce)$/;
function cleanMemo(m) {
  const out = {};
  if (!m || typeof m !== 'object') return out;
  for (const [k, v] of Object.entries(m)) if (MEMO_KEYS.test(k) && JSON.stringify(v).length <= 4000) out[k] = v;
  return out;
}

async function finish(res, me, b) {
  const day = b.day;
  if (!int(day, 0, DRIVE_LAST_BUILT) || !text(b.cid, 40)) return res.status(400).json({ ok: false, error: 'bad finish' });
  const sql = db();
  await ensure(sql, me);
  const at = okAt(b.at) ? b.at : Date.now();
  const pts = int(b.pts, 0, 100_000) ? Math.min(b.pts, MAX_PTS) : 0;
  const secs = int(b.secs, 0, 86_400) ? b.secs : null;

  // first completion only if: not done before, the day before is done (Day 0/1 exempt), and under today's cap
  const ins = await sql.query(
    `WITH t AS (SELECT (to_timestamp($3::bigint / 1000.0) AT TIME ZONE 'Asia/Kolkata')::date AS d)
     INSERT INTO drive_days (student_id, day, completed_at, ist_date, points, secs)
     SELECT $1::int, $2::int, to_timestamp($3::bigint / 1000.0), t.d, $4::int, $5::int FROM t
     WHERE $6::boolean OR (
           ($2::int = 0 OR EXISTS (SELECT 1 FROM drive_days WHERE student_id = $1::int AND day = $2::int - 1))
       AND ($2::int = 0 OR (SELECT COUNT(*) FROM drive_days x WHERE x.student_id = $1::int AND x.ist_date = t.d AND x.day > 0) < ${DAILY_MAX}))
     ON CONFLICT (student_id, day) DO NOTHING
     RETURNING day`,
    [me.id, day, at, pts, secs, me.pilot === 'DEMO']);   // test accounts (batch DEMO): no order or daily cap
  const first = ins.length === 1;
  let blocked = null;
  if (!first) {
    const had = await sql`SELECT 1 FROM drive_days WHERE student_id = ${me.id} AND day = ${day}`;
    if (!had.length) blocked = day > 0 ? 'locked-or-cap' : 'cap';
  }
  if (first) {
    const memo = cleanMemo(b.memo);
    await sql`UPDATE drive_students SET points = points + ${pts}, memo = memo || ${JSON.stringify(memo)}::jsonb, updated_at = now() WHERE student_id = ${me.id}`;
  }
  // replay time: first finishes keep their time in drive_days; a replay's time is saved as a 'time' event so admin minutes count it
  if (!first && !blocked && secs) {
    await sql.query(`INSERT INTO drive_events (client_id, student_id, day, kind, data, replay, created_at) VALUES ($1, $2, $3, 'time', $4::jsonb, true, to_timestamp($5 / 1000.0)) ON CONFLICT (client_id) DO NOTHING`,
      [me.id + ':' + b.cid + ':t', me.id, day, JSON.stringify({ secs }), at]);
  }
  // answers are saved even on replays (marked), so the team can see what changed; blocked finishes save nothing
  const ev = blocked ? [] : cleanEvents(b.events);
  if (ev.length) {
    await sql.query(
      `INSERT INTO drive_events (client_id, student_id, day, kind, screen, data, replay, created_at)
       SELECT c, $1, $2, k, s, d::jsonb, $3, to_timestamp($4 / 1000.0) FROM unnest($5::text[], $6::text[], $7::text[], $8::text[]) AS u(c, k, s, d)
       ON CONFLICT (client_id) DO NOTHING`,
      [me.id, day, !first, at, ev.map((e, i) => me.id + ':' + b.cid + ':' + i), ev.map(e => e.kind), ev.map(e => e.screen || null), ev.map(e => JSON.stringify(e.data))]);
  }
  return res.status(200).json({ ok: true, first, blocked, state: await state(me) });
}

// End-of-lesson "11-star" rating, asked once after each first finish (the page doesn't let a student move on without it).
// Stored as a drive_events row (kind 'rate'), one per student per day: a second rating of the same day is ignored.
// Needs the day to be finished first; if the finish is still in the offline queue, the page keeps the rating and resends it later.
const RATE_LIST = v => Array.isArray(v) ? v.filter(x => text(x, 60)).slice(0, 8) : [];
async function rate(res, me, b) {
  if (!int(b.day, 0, DRIVE_LAST_BUILT) || !int(b.stars, 1, 11)) return res.status(400).json({ ok: false, error: 'bad rating' });
  const sql = db();
  const done = await sql`SELECT 1 FROM drive_days WHERE student_id = ${me.id} AND day = ${b.day}`;
  if (!done.length) return res.status(409).json({ ok: false, error: 'finish first' });
  const data = {
    stars: b.stars, why: RATE_LIST(b.why), best: RATE_LIST(b.best),
    text: typeof b.text === 'string' ? b.text.trim().slice(0, 500) : '',
    secs: int(b.secs, 0, 86_400) ? b.secs : null, late: b.late === true
  };
  await sql.query(`INSERT INTO drive_events (client_id, student_id, day, kind, data) VALUES ($1, $2, $3, 'rate', $4::jsonb) ON CONFLICT (client_id) DO NOTHING`,
    [me.id + ':rate:' + b.day, me.id, b.day, JSON.stringify(data)]);
  return res.status(200).json({ ok: true });
}

// how the batch split on a Take a Stand day; null until SPLIT_MIN students have answered (never show made-up numbers)
async function split(res, me, b) {
  if (!int(b.day, 1, 56)) return res.status(400).json({ ok: false, error: 'bad day' });
  const rows = await db()`SELECT e.data->>'side' AS side, COUNT(DISTINCT e.student_id)::int AS n
    FROM drive_events e JOIN students s ON s.id = e.student_id
    WHERE e.kind = 'stand' AND e.day = ${b.day} AND e.replay = false AND s.pilot = ${me.pilot}
    GROUP BY 1`;
  const n = rows.reduce((a, r) => a + r.n, 0);
  res.setHeader('Cache-Control', 'private, max-age=60');
  if (n < SPLIT_MIN) return res.status(200).json({ ok: true, n, split: null });
  const out = {};
  for (const r of rows) out[r.side] = Math.round(r.n / n * 100);
  return res.status(200).json({ ok: true, n, split: out });
}

// ---------- Drive Profile: Strategy, Motivation, Voice x Knows, Does, Reflects ----------
// Every score is 0-100 or null (not enough data yet). Take a Stand text is never scored for quality or side.
async function profile(me) {
  const sql = db();
  const [ev, days] = await Promise.all([
    sql`SELECT day, kind, data FROM drive_events WHERE student_id = ${me.id} AND replay = false AND kind <> 'open' ORDER BY id LIMIT 3000`,
    sql`SELECT day FROM drive_days WHERE student_id = ${me.id}`
  ]);
  const done = new Set(days.map(d => d.day));
  const pct = (a, b) => b ? Math.round(a / b * 100) : null;
  const mean = xs => { const v = xs.filter(x => x != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  const of = k => ev.filter(e => e.kind === k);

  // Knows: first-try right on scenario questions, by dimension
  const knows = {};
  for (const d of DIMS) {
    const a = of('attempt').filter(e => e.data.dim === d && e.data.first);
    knows[d] = pct(a.filter(e => e.data.correct).length, a.length);
  }
  // Does
  // review days the student has reached (the day before is done), and how many of those they came back for
  const reviewDays = [7, 14, 21, 28, 35, 42, 49, 56].filter(d => d <= DRIVE_LAST_BUILT && done.has(d - 1));
  const reviewDone = reviewDays.filter(d => done.has(d)).length;
  const games = of('game').map(e => e.data);
  // after a miss the student chooses: try again or skip. Does = share of those choices that were 'try again'
  const chances = games.reduce((a, g) => a + (g.chances ?? g.fails ?? 0), 0), retries = games.reduce((a, g) => a + (g.retries || 0), 0);
  const stands = of('stand').map(e => e.data);
  const effort = s => s.parts && Object.values(s.parts).every(p => (String(p).match(/[A-Za-z0-9’']+/g) || []).length >= 5) && (s.typingSec || 0) >= 30;
  const does = {
    strategy: pct(reviewDone, reviewDays.length),
    motivation: chances ? pct(retries, chances) : null,
    voice: stands.length ? pct(stands.filter(effort).length, stands.length) : null
  };
  // Reflects
  const refl = of('reflect').map(e => e.data);
  const wordsIn = t => (String(t || '').match(/[A-Za-z0-9’']+/g) || []).length;
  const reflectBy = track => { const r = refl.filter(x => x.track === track); return r.length ? pct(r.filter(x => wordsIn(x.text) >= 10).length, r.length) : null; };
  const selfChecks = stands.filter(s => s.self && (s.self.choice === 'hold' || s.self.choice === 'revise') && wordsIn(s.self.why) >= 4).length;
  const reflects = {
    strategy: reflectBy('review') ?? reflectBy('strategy'),
    motivation: mean([reflectBy('motivation'), of('plan').length ? 100 : null]),
    voice: stands.length ? pct(selfChecks, stands.length) : null
  };
  const type = (k, d) => k == null || d == null ? null : k >= 60 && d >= 60 ? 'Knows it and does it' : k >= 60 ? 'Knows it, doesn’t do it yet' : d >= 60 ? 'Does it without knowing why' : 'Still building';
  const dims = {};
  for (const d of DIMS) dims[d] = { knows: knows[d], does: does[d], reflects: reflects[d], type: type(knows[d], does[d]) };
  const stage = done.has(56) ? 'full' : done.has(7) ? 'snapshot' : 'building';
  return { stage, daysDone: [...done].filter(d => d > 0).length, dims, stands: stands.length, plans: of('plan').length };
}
