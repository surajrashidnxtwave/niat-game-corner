// Shared helpers for the data functions: database client, auth, validation, rate limits.
import { neon } from '@neondatabase/serverless';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

let client = null;
export function db() {
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

// game ids the page knows about; anything else is rejected
export const GAME_IDS = ['word-spread', 'beat-the-7', 'missing-link', 'link-grid', 'wiki-hop', 'recall-rebuild', 'back-track',
  'symbol-sprint', 'rule-switch', 'robot-path', 'fallacy-hunt', 'argue-back', 'trust-or-check', 'source-check', 'taste-test'];

// batch (stored in students.pilot) groups the leaderboard; roster rows without one go in ALL
export const BATCH_RE = /^[A-Z0-9 _-]{1,30}$/;

export const newToken = () => randomBytes(24).toString('hex');
export const hashToken = t => createHash('sha256').update(t).digest('hex');
const TOKEN_RE = /^[a-f0-9]{48}$/;

// Returns { id, name, roll, pilot } for a valid token, else null.
export async function studentFor(token) {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) return null;
  const rows = await db()`SELECT s.id, s.name, s.roll, s.pilot FROM sessions x JOIN students s ON s.id = x.student_id WHERE x.token_hash = ${hashToken(token)}`;
  return rows[0] || null;
}

export function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// simple per-instance rate limit: true when the key is over its limit
const hits = new Map();
export function limited(key, limit, windowMs = 60_000) {
  const now = Date.now();
  const h = (hits.get(key) || []).filter(t => now - t < windowMs);
  if (h.length >= limit) { hits.set(key, h); return true; }
  h.push(now); hits.set(key, h);
  if (hits.size > 5000) hits.clear();
  return false;
}
export const ipOf = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';

export const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
export const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function dbReady(res) {
  if (process.env.DATABASE_URL) return true;
  res.status(503).json({ ok: false, error: 'no database' });
  return false;
}
