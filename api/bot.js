// POST /api/bot  Break the Bot. Passwords, defences and the win check all run here.
//   { action: "status" }                                  -> { ok, open }   (open = today's AI budget not used up)
//   { action: "send",  token, run, level: 0-2, msg }      -> { ok, reply, log, blocked, used, left } | { ok: false, error }
//   { action: "check", token, run, level: 0-2, guess }    -> { ok, correct [, cracked] }
// run = an id the page makes for each game session; message limits and chat history are per run and level.
// Every message is logged in bot_log for review. Spending is added up per day (India time) in ai_spend;
// once DAILY_CAP_USD is reached the game closes until the next day.
import { db, dbReady, studentFor, limited } from './_lib/db.js';
import { LEVELS, MAX_MSG_LEN, MAX_PER_LEVEL, DAILY_CAP_USD, botTurn, openRouterChat, sameWord } from './_lib/bot-core.js';

const RUN_RE = /^[a-z0-9]{8,40}$/;
const MAX_PER_DAY = 200;   // messages per student per day, across runs
const TODAY = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;

// today's spend, cached per instance for 30 s so the status check doesn't hit the database every time
let spend = { usd: 0, at: 0 };
async function spentToday(fresh) {
  if (!fresh && Date.now() - spend.at < 30_000) return spend.usd;
  const r = await db().query(`SELECT usd FROM ai_spend WHERE day = ${TODAY}`);
  spend = { usd: Number(r[0]?.usd) || 0, at: Date.now() };
  return spend.usd;
}
const isOpen = usd => process.env.BOT_ENABLED !== 'false' && !!process.env.OPENROUTER_API_KEY && usd < DAILY_CAP_USD;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!dbReady(res)) return;
  const b = req.body || {};
  try {
    if (b.action === 'status') return res.status(200).json({ ok: true, open: isOpen(await spentToday()) });

    const me = await studentFor(b.token);
    if (!me) return res.status(401).json({ ok: false, error: 'not joined' });
    if (!RUN_RE.test(b.run || '') || !Number.isInteger(b.level) || !LEVELS[b.level]) return res.status(400).json({ ok: false, error: 'bad request' });
    const sql = db();

    if (b.action === 'check') {
      if (limited('botc:' + me.id, 30)) return res.status(429).json({ ok: false, error: 'slow down' });
      if (typeof b.guess !== 'string' || b.guess.length > 60) return res.status(400).json({ ok: false, error: 'bad guess' });
      if (!sameWord(b.guess, LEVELS[b.level].secret)) return res.status(200).json({ ok: true, correct: false });
      // the message that cracked it = the last student message in this run and level
      const last = await sql`SELECT id, msg FROM bot_log WHERE student_id = ${me.id} AND run = ${b.run} AND level = ${b.level} ORDER BY id DESC LIMIT 1`;
      if (last[0]) await sql`UPDATE bot_log SET cracked = true WHERE id = ${last[0].id}`;
      return res.status(200).json({ ok: true, correct: true, cracked: last[0]?.msg || '' });
    }

    if (b.action !== 'send') return res.status(400).json({ ok: false, error: 'bad action' });
    const msg = typeof b.msg === 'string' ? b.msg.trim() : '';
    if (!msg || msg.length > MAX_MSG_LEN) return res.status(400).json({ ok: false, error: 'Messages can be up to ' + MAX_MSG_LEN + ' characters.' });
    if (limited('bot:' + me.id, 15)) return res.status(429).json({ ok: false, error: 'Slow down a little, then send again.' });
    if (!isOpen(await spentToday(true))) return res.status(200).json({ ok: false, error: 'closed' });

    const [rows, day] = await Promise.all([
      sql`SELECT msg, reply, blocked FROM bot_log WHERE student_id = ${me.id} AND run = ${b.run} AND level = ${b.level} ORDER BY id`,
      sql.query(`SELECT count(*)::int AS n FROM bot_log WHERE student_id = $1 AND created_at >= ${TODAY}::timestamp AT TIME ZONE 'Asia/Kolkata'`, [me.id])
    ]);
    if (rows.length >= MAX_PER_LEVEL || day[0].n >= MAX_PER_DAY) return res.status(200).json({ ok: false, error: 'limit' });

    // the bot sees its greeting and the earlier turns that reached it (not the ones the input filter blocked)
    const history = [{ role: 'assistant', content: LEVELS[b.level].hello }];
    for (const r of rows) if (r.blocked !== 'input') history.push({ role: 'user', content: r.msg }, { role: 'assistant', content: r.reply });

    let out;
    try { out = await botTurn(b.level, msg, history, { model: process.env.BOT_MODEL || 'google/gemini-2.5-flash-lite', callModel: openRouterChat }); }
    catch (e) { console.error('[bot] model', e.message); return res.status(200).json({ ok: false, error: 'no_reply' }); }

    await sql`INSERT INTO bot_log (student_id, run, level, msg, reply, log, blocked, cost) VALUES (${me.id}, ${b.run}, ${b.level}, ${msg}, ${out.reply}, ${out.log}, ${out.blocked}, ${out.cost})`;
    if (out.cost > 0) {
      await sql.query(`INSERT INTO ai_spend (day, usd) VALUES (${TODAY}, $1) ON CONFLICT (day) DO UPDATE SET usd = ai_spend.usd + EXCLUDED.usd`, [out.cost]);
      spend.usd += out.cost;
    }
    return res.status(200).json({ ok: true, reply: out.reply, log: out.log, blocked: out.blocked, used: rows.length + 1, left: MAX_PER_LEVEL - rows.length - 1 });
  } catch (e) {
    console.error('[bot]', e.message);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}
