// POST /api/judge  { task: "beat7" | "recall" | "missinglink", payload: {...} }
// Returns { ok: true, result } or { ok: false }. The game falls back to its own matching when ok is false.
import { TASKS, validatePayload, judgeTask } from './_lib/judge-core.js';

const cache = new Map();          // per-instance cache: same answer, same result, no new model call
const CACHE_MAX = 3000;
const hits = new Map();           // simple per-IP rate limit
const LIMIT = 40, WINDOW_MS = 60_000;

const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (process.env.AI_JUDGE_ENABLED === 'false') return res.status(200).json({ ok: false, error: 'disabled' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
  const now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (h.length >= LIMIT) return res.status(429).json({ ok: false, error: 'rate limited' });
  h.push(now); hits.set(ip, h);

  const { task, payload } = req.body || {};
  if (!TASKS.includes(task) || !validatePayload(task, payload)) return res.status(400).json({ ok: false, error: 'bad request' });

  const key = task + '|' + norm(JSON.stringify(payload));
  if (cache.has(key)) return res.status(200).json({ ok: true, result: cache.get(key), cached: true });

  try {
    const { result } = await judgeTask(task, payload);
    if (!result) return res.status(200).json({ ok: false, error: 'unusable model output' });
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error('[judge]', e.message);
    return res.status(200).json({ ok: false, error: 'model error' });
  }
}
