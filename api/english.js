// POST /api/english — English Adda (own points, timer, streak and levels; separate from Brain Gym and Drive School)
//   { action: "state", token }             -> { ok, state }
//   { action: "tick",  token, secs }       -> { ok, today }     (active seconds, sent in batches of up to 2 minutes)
//   { action: "checkstart", token }        -> { ok, items }     (level check parts 1-3; no answers inside)
//   { action: "checknext",  token, rf, c1 } -> { ok, items }    (second passage + story, picked from parts 1-2)
//   { action: "checkdone",  token, rf, c1, c2, catch, story, secs } -> { ok, levels, state }   (scored here, saved once; DEMO can redo)
//   { action: "roundstart", token, game, lv?, n? } -> { ok, round }   (items picked at the student's level; lv/n only for test accounts)
//   { action: "round", token, cid, game, ids, answers, tries, ms, secs, mode? } -> { ok, points, correct, levelUp, run?, state }   (re-scored here; mode = chill|rush for Flick and Express)
//   { action: "vault", token, op: "get" | "add" | "review", ... }   (Word Vault: spaced review, 1 point per right answer, 20 a day)
//   { action: "rate", token, stars, why, best, text, rounds, secs, games } -> { ok }   (11-star day rating; one per student per India day)
// Who can open it: batches listed in ENGLISH_BATCHES (comma separated, e.g. "DEMO,SVYASA"). Unset = everyone (opened to all on 2026-11-13).
// Rules the server enforces (the page shows the same rules, but this is the copy that counts):
//   - the daily ring fills with active seconds; a tick can't add more time than has really passed since the last one
//   - a goal day = 15+ active minutes; the streak forgives one missed day per 7 days (a "freeze")
//   - fresh content closes at 25 minutes a day (test accounts, batch DEMO, have no limit)
import { createHash } from 'node:crypto';
import { db, studentFor, limited, ipOf, int, text, dbReady } from './_lib/db.js';
import { startItems, nextItems, score as scoreCheck } from './_lib/english-check.js';
import { BUILT, SKILL, ROUND_N, RUN, BOX_DAYS, buildRound, scoreItem, roundPoints, runScore, vaultQuiz, wordInfo, tierOf } from './_lib/english-games.js';

export const GOAL = 900;          // 15 minutes
export const CAP = 1500;          // 25 minutes of fresh content a day
const DAY_MAX = 6 * 3600;         // sanity cap on one day's active seconds
const GRACE = 120;                // a round that started before the close still counts if it ends within 2 minutes
const GOAL_POINTS = 25;
const VAULT_DAY_MAX = 20;         // Word Vault: 1 point per right answer, at most 20 a day
const SKILLS = ['voc', 'gra', 'lis', 'rea', 'wri'];

const batches = () => (process.env.ENGLISH_BATCHES || 'ALL').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
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
    if (b.action === 'roundstart') return await roundStart(res, me, b);
    if (b.action === 'round') return await saveRound(res, me, b);
    if (b.action === 'vault') return await vault(res, me, b);
    if (b.action === 'rate') return await rate(res, me, b);
    return res.status(400).json({ ok: false, error: 'bad action' });
  } catch (e) {
    console.error('[english]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}

const IST_TODAY = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;

// "11-star" rating of the day (same idea as Brain Gym and Drive School), asked once a day after a few rounds.
// Stored as an english_events row (kind 'rate'); the client id makes it one per student per India day (a second one is ignored).
const RATE_LIST = v => Array.isArray(v) ? v.filter(x => text(x, 60)).slice(0, 8) : [];
// a voice note recorded on the sheet: { id, secs }, kept only if this student uploaded it (see /api/feedback kind "voice")
async function rateVoice(me, v) {
  if (!v || !int(v.id, 1, 2 ** 53) || !int(v.secs, 1, 60)) return null;
  const r = await db()`SELECT 1 FROM feedback_voice WHERE id = ${v.id} AND student_id = ${me.id}`;
  return r.length ? { id: v.id, secs: v.secs } : null;
}
// follow-up chips per picked card: { "card label": ["chip", ...] }
const RATE_MORE = v => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out = {};
  for (const [k, list] of Object.entries(v).slice(0, 10)) if (text(k, 60)) { const l = RATE_LIST(list); if (l.length) out[k.trim()] = l; }
  return out;
};
async function rate(res, me, b) {
  if (!int(b.stars, 1, 11)) return res.status(400).json({ ok: false, error: 'bad rating' });
  const sql = db();
  const [{ day }] = await sql.query(`SELECT to_char(${IST_TODAY}, 'YYYY-MM-DD') AS day`);
  const data = {
    stars: b.stars, why: RATE_LIST(b.why), best: RATE_LIST(b.best), more: RATE_MORE(b.more), voice: await rateVoice(me, b.voice),
    text: typeof b.text === 'string' ? b.text.trim().slice(0, 500) : '',
    rounds: int(b.rounds, 0, 500) ? b.rounds : null, secs: int(b.secs, 0, DAY_MAX) ? b.secs : null,
    games: Array.isArray(b.games) ? b.games.filter(g => typeof g === 'string' && BUILT.includes(g)).slice(0, 20) : []
  };
  await sql.query(`INSERT INTO english_events (client_id, student_id, kind, data) VALUES ($1, $2, 'rate', $3::jsonb) ON CONFLICT (client_id) DO NOTHING`,
    [me.id + ':rate:' + day, me.id, JSON.stringify(data)]);
  return res.status(200).json({ ok: true });
}

async function ensure(sql, me) {
  await sql.query(`INSERT INTO english_students (student_id, started_on) VALUES ($1, ${IST_TODAY}) ON CONFLICT (student_id) DO NOTHING`, [me.id]);
}

async function state(me) {
  const sql = db();
  await ensure(sql, me);
  const [st, days, today, played, vlt, runs] = await Promise.all([
    sql`SELECT to_char(started_on, 'YYYY-MM-DD') AS started_on, points, levels, placed_at FROM english_students WHERE student_id = ${me.id}`,
    sql.query(`SELECT to_char(day, 'YYYY-MM-DD') AS d, active FROM english_daily WHERE student_id = $1 AND day > ${IST_TODAY} - 400 ORDER BY day DESC`, [me.id]),
    sql.query(`SELECT to_char(${IST_TODAY}, 'YYYY-MM-DD') AS d`),
    sql.query(`SELECT game, count(*)::int AS n FROM english_rounds WHERE student_id = $1 AND ist_date = ${IST_TODAY} GROUP BY game`, [me.id]),
    sql.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE due <= ${IST_TODAY})::int AS due, count(*) FILTER (WHERE box = 5)::int AS mastered FROM english_vault WHERE student_id = $1`, [me.id]),
    // run games: best score per mode, and whether Rush is open (one round with 80%+ right)
    sql.query(`SELECT game, COALESCE(meta->>'mode', 'chill') AS mode, max((meta->>'score')::int) AS best, bool_or(items > 0 AND correct * 5 >= items * 4) AS good
               FROM english_rounds WHERE student_id = $1 AND game = ANY($2) GROUP BY 1, 2`, [me.id, RUN])
  ]);
  const best = {}, rush = {};
  for (const r of runs) { (best[r.game] = best[r.game] || {})[r.mode] = r.best || 0; if (r.good) rush[r.game] = true; }
  if (tester(me)) RUN.forEach(g => { rush[g] = true; });
  const t = today[0].d, s = st[0];
  const todaySecs = (days.find(x => x.d === t) || {}).active || 0;
  const goalDates = days.filter(x => x.active >= GOAL).map(x => x.d);
  const levels = cleanLevels(s.levels);
  return {
    open: true, tester: tester(me), today: t, startedOn: s.started_on, points: s.points,
    levels, placed: !!s.placed_at, circuit: s.placed_at ? circuit(levels, me.id + ':' + t) : [],
    todaySecs, goal: GOAL, cap: CAP, closed: !tester(me) && todaySecs >= CAP,
    streak: streak(goalDates, t), goalDays: goalDates.length,
    played: Object.fromEntries(played.map(r => [r.game, r.n])), vault: vlt[0], built: BUILT, best, rush
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
  const sql = db();
  // "old" sees the row as it was before this statement (same snapshot), so we can tell when the 15-minute goal was crossed
  const r = await sql.query(
    `WITH old AS (SELECT active FROM english_daily WHERE student_id = $1 AND day = ${IST_TODAY}),
     up AS (INSERT INTO english_daily (student_id, day, active, updated_at) VALUES ($1, ${IST_TODAY}, $2, now())
       ON CONFLICT (student_id, day) DO UPDATE SET
         active = LEAST(english_daily.active + LEAST($2, GREATEST(0, EXTRACT(EPOCH FROM now() - english_daily.updated_at)::int + 10)), $3),
         updated_at = now()
       RETURNING active)
     SELECT up.active, COALESCE((SELECT active FROM old), 0) AS before FROM up`, [me.id, b.secs, DAY_MAX]);
  const { active, before } = r[0];
  let bonus = 0;
  if (before < GOAL && active >= GOAL) {   // daily goal reached: +25 Adda points, once
    bonus = GOAL_POINTS;
    await sql.query(`UPDATE english_students SET points = points + $2, updated_at = now() WHERE student_id = $1`, [me.id, bonus]);
  }
  return res.status(200).json({ ok: true, today: active, bonus });
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
const SKILL_GAMES = { voc: ['pairup', 'realfake'], gra: ['flick', 'express'], lis: ['echo', 'catch', 'rewind'], rea: ['post', 'reels', 'vanish'], wri: ['munch', 'email'] };
// a skill whose games aren't built yet borrows any built game, so every slot is playable
const SETS = BUILT.filter(g => g !== 'groups');
const gamesFor = sk => { const g = SKILL_GAMES[sk].filter(x => BUILT.includes(x)); return g.length ? g : SETS; };
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
    const g = gamesFor(sk), fresh = g.filter(x => !out.includes(x));
    // all used already: repeat the one used least, so a few built games still spread evenly
    const uses = x => out.filter(y => y === x).length, least = Math.min(...g.map(uses));
    out.push(pick(fresh.length ? fresh : g.filter(x => uses(x) === least)));
  }
  // at least 4 different games: swap a repeat for an unused game, weak skills first
  const pool = [...weak, ...rest].flatMap(gamesFor);
  for (let i = 0; i < out.length && new Set(out).size < 4; i++) {
    if (out.indexOf(out[i]) !== i) { const u = pool.find(x => !out.includes(x)); if (u) out[i] = u; }
  }
  // no game more than twice a day: swap the extra one for the game used least
  for (let i = out.length - 1; i >= 0; i--) {
    const uses = x => out.filter(y => y === x).length;
    if (uses(out[i]) > 2) { const alt = SETS.filter(x => uses(x) < 2).sort((a, b) => uses(a) - uses(b))[0]; if (alt) out[i] = alt; }
  }
  // order: shuffle until no game comes twice in a row
  for (let t = 0; t < 30; t++) {
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    if (out.every((g, i) => !i || g !== out[i - 1])) break;
  }
  return out;
}

// ---------- objective games (Real or Fake, Flick, Express, Word Groups) ----------
const lvOf = (levels, game) => int(levels && levels[SKILL[game]], 1, 8) ? levels[SKILL[game]] : 1;
const okCid = v => text(v, 64) && v.length >= 8;
async function student(sql, me) {
  await ensure(sql, me);
  const r = await sql`SELECT levels, placed_at FROM english_students WHERE student_id = ${me.id}`;
  return r[0];
}
async function todayActive(sql, me) {
  const r = await sql.query(`SELECT active FROM english_daily WHERE student_id = $1 AND day = ${IST_TODAY}`, [me.id]);
  return r[0] ? r[0].active : 0;
}
// the last 20 answers at this level for this skill (newest first)
const recent = (sql, me, skill, lv) => sql.query(
  `SELECT ok, to_char(at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS d FROM english_answers WHERE student_id = $1 AND skill = $2 AND lv = $3 ORDER BY at DESC LIMIT 20`, [me.id, skill, lv]);
const groupsToday = (sql, me) => sql.query(`SELECT 1 FROM english_rounds WHERE student_id = $1 AND game = 'groups' AND ist_date = ${IST_TODAY} LIMIT 1`, [me.id]);

async function roundStart(res, me, b) {
  if (!BUILT.includes(b.game)) return res.status(400).json({ ok: false, error: 'bad game' });
  const sql = db(), s = await student(sql, me), T = tester(me);
  if (!s.placed_at && !T) return res.status(409).json({ ok: false, error: 'level check first' });
  if (!T && await todayActive(sql, me) >= CAP) return res.status(200).json({ ok: true, closed: true });
  const L = T && int(b.lv, 1, 8) ? b.lv : lvOf(s.levels, b.game);
  const day = (await sql.query(`SELECT to_char(${IST_TODAY}, 'YYYY-MM-DD') AS d`))[0].d;
  if (b.game === 'groups' && !T && (await groupsToday(sql, me)).length) return res.status(200).json({ ok: true, already: true });
  const [seenRows, rec] = await Promise.all([
    sql.query(`SELECT DISTINCT item_id FROM english_answers WHERE student_id = $1 AND game = $2`, [me.id, b.game]),
    recent(sql, me, SKILL[b.game], L)
  ]);
  const low = rec.length >= 20 && rec.filter(x => x.ok).length < 10;
  const round = buildRound(b.game, L, low, new Set(seenRows.map(r => r.item_id)), me.id + ':' + b.game + ':' + Date.now(),
    { day, tier: b.game === 'groups' ? tierOf(L) : 0, n: T && int(b.n, 1, 999) ? b.n : 0 });
  if (!round.items.length) return res.status(500).json({ ok: false, error: 'no content' });
  return res.status(200).json({ ok: true, round: { game: b.game, lv: L, ...round } });
}

async function saveRound(res, me, b) {
  const game = b.game, n = ROUND_N[game];
  if (!BUILT.includes(game) || !okCid(b.cid) || !Array.isArray(b.ids) || !b.ids.length || b.ids.length > n
    || !Array.isArray(b.answers) || b.answers.length !== b.ids.length || JSON.stringify(b.answers).length > 8000)
    return res.status(400).json({ ok: false, error: 'bad round' });
  const sql = db(), s = await student(sql, me), T = tester(me);
  const L = lvOf(s.levels, game), skill = SKILL[game];
  const tries = Array.isArray(b.tries) ? b.tries : [], ms = Array.isArray(b.ms) ? b.ms : [];
  const scored = b.ids.map((id, i) => {
    const x = typeof id === 'string' && id.length <= 80 ? scoreItem(game, id, b.answers[i], L) : null;
    return x && { ...x, id, tries: int(tries[i], 0, 20) ? tries[i] : null, ms: int(ms[i], 0, 600000) ? ms[i] : null };
  }).filter(Boolean);
  if (!scored.length) return res.status(400).json({ ok: false, error: 'bad round' });
  let points = roundPoints(game, scored);
  if (!T) {
    // no points once today's fresh-content time is used up, and the daily puzzle pays only once a day
    if (await todayActive(sql, me) > CAP + GRACE) points = 0;
    if (game === 'groups' && (await groupsToday(sql, me)).length) points = 0;
  }
  const correct = scored.filter(x => x.ok).length;
  const mode = b.mode === 'rush' ? 'rush' : 'chill';
  const run = RUN.includes(game) ? { mode, ...runScore(scored, mode) } : null;
  const meta = game === 'groups' ? { solved: scored[0].solved, miss: scored[0].miss, n: int(b.n, 1, 9999) ? b.n : null } : run;
  const ins = await sql.query(
    `INSERT INTO english_rounds (client_id, student_id, game, level, items, correct, points, secs, ist_date, played_at, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${IST_TODAY}, now(), $9::jsonb) ON CONFLICT (client_id) DO NOTHING RETURNING id`,
    [b.cid, me.id, game, L, scored.length, correct, points, int(b.secs, 0, 3600) ? b.secs : null, meta && JSON.stringify(meta)]);
  if (!ins.length) return res.status(200).json({ ok: true, dup: true, state: await state(me) });   // sent twice (retry)
  const vals = [], params = [];
  scored.forEach(x => {
    const o = params.length;
    vals.push('(' + Array.from({ length: 10 }, (_, k) => '$' + (o + k + 1)).join(', ') + ')');
    params.push(b.cid, me.id, game, x.id, x.ok, x.tries, x.ans, x.ms, skill, x.lv);
  });
  await sql.query(`INSERT INTO english_answers (round_cid, student_id, game, item_id, ok, tries, answer, ms, skill, lv) VALUES ${vals.join(', ')} ON CONFLICT (round_cid, item_id) DO NOTHING`, params);
  await Promise.all([
    sql.query(`UPDATE english_students SET points = points + $2, updated_at = now() WHERE student_id = $1`, [me.id, points]),
    sql.query(`INSERT INTO english_daily (student_id, day, fresh_rounds) VALUES ($1, ${IST_TODAY}, 1)
               ON CONFLICT (student_id, day) DO UPDATE SET fresh_rounds = english_daily.fresh_rounds + 1`, [me.id])
  ]);
  const levelUp = game === 'groups' ? null : await levelCheck(sql, me, skill, L, T);
  if (run) {
    // for the end card: the last five scores in this mode (oldest first, this run last) and the best before this run
    const past = await sql.query(`SELECT client_id, (meta->>'score')::int AS s FROM english_rounds
      WHERE student_id = $1 AND game = $2 AND COALESCE(meta->>'mode', 'chill') = $3 AND meta->>'score' IS NOT NULL ORDER BY played_at DESC, id DESC LIMIT 60`, [me.id, game, mode]);
    run.last = past.slice(0, 5).map(r => r.s).reverse();
    run.best = Math.max(0, ...past.filter(r => r.client_id !== b.cid).map(r => r.s));
  }
  return res.status(200).json({ ok: true, points, correct, items: scored.length, levelUp, run, state: await state(me) });
}

// Up a level: 80%+ right over the last 20 answers at the current level, spread over 2+ days (test accounts: 1 day is enough).
// Levels never go down; struggling students quietly get easier items instead (see roundStart).
async function levelCheck(sql, me, skill, L, T) {
  if (L >= 8) return null;
  const r = await recent(sql, me, skill, L);
  if (r.length < 20 || r.filter(x => x.ok).length < 16 || (!T && new Set(r.map(x => x.d)).size < 2)) return null;
  const up = await sql.query(
    `UPDATE english_students SET levels = jsonb_set(levels, $2::text[], to_jsonb($3::int)), updated_at = now()
     WHERE student_id = $1 AND COALESCE((levels->>$4)::int, 1) = $5 RETURNING student_id`, [me.id, '{' + skill + '}', L + 1, skill, L]);
  if (!up.length) return null;
  await sql.query(`INSERT INTO english_events (client_id, student_id, kind, data) VALUES ($1, $2, 'levelup', $3::jsonb) ON CONFLICT (client_id) DO NOTHING`,
    [me.id + ':levelup:' + skill + ':' + (L + 1) + ':' + Date.now(), me.id, JSON.stringify({ skill, from: L, to: L + 1 })]);
  return { skill, lv: L + 1 };
}

// ---------- Word Vault ----------
// Leitner boxes 1-5, next review after 1, 3, 7, 14, 30 days. A wrong answer sends the word back to box 1.
async function vault(res, me, b) {
  const sql = db(), T = tester(me);
  await ensure(sql, me);
  if (b.op === 'add') {
    const words = Array.isArray(b.words) ? [...new Set(b.words.filter(w => typeof w === 'string' && wordInfo(w)))].slice(0, 20) : [];
    const src = ['realfake', 'groups', 'reels', 'catch'].includes(b.source) ? b.source : null;
    if (words.length) await sql.query(
      `INSERT INTO english_vault (student_id, word, box, due, source) SELECT $1, w, 1, ${IST_TODAY} + 1, $3 FROM unnest($2::text[]) AS w ON CONFLICT (student_id, word) DO NOTHING`,
      [me.id, words, src]);
    return res.status(200).json({ ok: true, added: words.length });
  }
  if (b.op === 'get') {
    // test accounts also see words due tomorrow, so new words can be tried straight away
    const due = await sql.query(`SELECT word, box FROM english_vault WHERE student_id = $1 AND due <= ${IST_TODAY} + $2::int ORDER BY due, box, word LIMIT 10`, [me.id, T ? 1 : 0]);
    return res.status(200).json({ ok: true, quiz: vaultQuiz(due, me.id + ':v:' + Date.now()) });
  }
  if (b.op === 'review') {
    const list = Array.isArray(b.results) ? b.results.filter(x => x && typeof x.w === 'string' && typeof x.ok === 'boolean').slice(0, 10) : [];
    if (!okCid(b.cid) || !list.length) return res.status(400).json({ ok: false, error: 'bad review' });
    const have = await sql.query(`SELECT word, box FROM english_vault WHERE student_id = $1 AND word = ANY($2::text[])`, [me.id, list.map(x => x.w)]);
    const box = new Map(have.map(r => [r.word, r.box]));
    const valid = list.filter(x => box.has(x.w));
    if (!valid.length) return res.status(400).json({ ok: false, error: 'bad review' });
    const today = await sql.query(`SELECT COALESCE(sum(points), 0)::int AS p FROM english_rounds WHERE student_id = $1 AND game = 'vault' AND ist_date = ${IST_TODAY}`, [me.id]);
    const right = valid.filter(x => x.ok).length;
    const points = Math.max(0, Math.min(right, VAULT_DAY_MAX - today[0].p));
    const ins = await sql.query(
      `INSERT INTO english_rounds (client_id, student_id, game, level, items, correct, points, secs, ist_date, played_at)
       VALUES ($1, $2, 'vault', 0, $3, $4, $5, $6, ${IST_TODAY}, now()) ON CONFLICT (client_id) DO NOTHING RETURNING id`,
      [b.cid, me.id, valid.length, right, points, int(b.secs, 0, 3600) ? b.secs : null]);
    if (!ins.length) return res.status(200).json({ ok: true, dup: true, state: await state(me) });
    const moves = valid.map(x => { const nb = x.ok ? Math.min(5, box.get(x.w) + 1) : 1; return { w: x.w, box: nb, days: x.ok ? BOX_DAYS[nb - 1] : 1 }; });
    await sql.query(
      `UPDATE english_vault v SET box = m.box, due = ${IST_TODAY} + m.days
       FROM unnest($2::text[], $3::int[], $4::int[]) AS m(w, box, days) WHERE v.student_id = $1 AND v.word = m.w`,
      [me.id, moves.map(m => m.w), moves.map(m => m.box), moves.map(m => m.days)]);
    if (points) await sql.query(`UPDATE english_students SET points = points + $2, updated_at = now() WHERE student_id = $1`, [me.id, points]);
    return res.status(200).json({ ok: true, points, right, moves, state: await state(me) });
  }
  return res.status(400).json({ ok: false, error: 'bad op' });
}
