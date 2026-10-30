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

// Roster names come in many shapes: "B S Prajwal", "M.Abuzar", "K P PRATYUSHAA .", "Md Sameer Shaik".
// parts: letters-only pieces, lower case
export const nameParts = n => String(n).toLowerCase().split(/[^a-z]+/).filter(Boolean);
const title = w => w[0].toUpperCase() + w.slice(1);
// the name to call a student by: first part that is not an initial ("B S Prajwal" -> "Prajwal")
export function callName(n) {
  const p = nameParts(n);
  return p.length ? title(p.find(w => w.length >= 3) || p[0]) : '';
}
// leaderboard name: "Prajwal P." (call name + initial of the last other part)
export function shortName(n) {
  const p = nameParts(n), c = callName(n).toLowerCase(), rest = p.filter(w => w !== c);
  return callName(n) + (rest.length ? ' ' + rest[rest.length - 1][0].toUpperCase() + '.' : '');
}
// clean a roster name: drop emoji, brackets, underscores and other symbols
export const cleanName = n => String(n).replace(/[^A-Za-z .'-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^[^A-Za-z]+/, '').replace(/[ .'-]+$/, '');

export const newToken =() => randomBytes(24).toString('hex');
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
