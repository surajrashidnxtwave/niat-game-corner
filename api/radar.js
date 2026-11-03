// POST /api/radar  Word Radar. The secret words and similarity data stay on the server.
//   { action: "guess",  puzzle: 1-3, word }                 -> { ok: true, word, sim, rank, n [, top10] } | { ok: false, reason: "not_in_list" }
//   { action: "hint",   puzzle: 1-3, bestRank, triedRanks } -> { ok: true, word, sim, rank, n }
//   { action: "reveal", puzzle: 1-3 }                       -> { ok: true, secret, top10 }
// rank 0 = the secret, 1 = the closest word. n = size of the word list (for drawing the radar).
import DATA from './_lib/word-radar-data.js';
import { limited, ipOf } from './_lib/db.js';

const N = DATA.words.length;
const INDEX = new Map(DATA.words.map((w, i) => [w, i]));
// per puzzle: rank of every word, and the word at every rank
const P = DATA.puzzles.map(p => {
  const order = p.sim.map((s, i) => i).sort((a, b) => p.sim[b] - p.sim[a]);
  const si = INDEX.get(p.secret);
  const byRank = [si, ...order.filter(i => i !== si)];
  const rank = new Int32Array(N); byRank.forEach((wi, r) => { rank[wi] = r; });
  return { secret: p.secret, sim: p.sim, rank, byRank, top10: byRank.slice(1, 11).map(i => DATA.words[i]) };
});
const entry = (p, wi) => ({ word: DATA.words[wi], sim: p.sim[wi], rank: p.rank[wi], n: N });

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (limited('radar:' + ipOf(req), 120)) return res.status(429).json({ ok: false, error: 'slow down' });
  const b = req.body || {};
  const p = P[(b.puzzle | 0) - 1];
  if (!p || ![1, 2, 3].includes(b.puzzle)) return res.status(400).json({ ok: false, error: 'bad puzzle' });

  if (b.action === 'guess') {
    const w = typeof b.word === 'string' ? b.word.trim().toLowerCase() : '';
    if (!/^[a-z]{1,30}$/.test(w) || !INDEX.has(w)) return res.status(200).json({ ok: false, reason: 'not_in_list' });
    const out = entry(p, INDEX.get(w));
    if (out.rank === 0) out.top10 = p.top10;
    return res.status(200).json({ ok: true, ...out });
  }
  if (b.action === 'hint') {
    // best = lowest rank guessed so far, capped at 1001 if nothing is in the top 1000
    const tried = new Set(Array.isArray(b.triedRanks) ? b.triedRanks.filter(Number.isInteger).slice(0, 500) : []);
    const best = Math.min(1001, Number.isInteger(b.bestRank) && b.bestRank > 0 ? b.bestRank : 1001);
    let r = Math.max(1, Math.floor(best / 3));
    while (tried.has(r) && r < N - 1) r++;
    return res.status(200).json({ ok: true, ...entry(p, p.byRank[r]) });
  }
  if (b.action === 'reveal') return res.status(200).json({ ok: true, secret: p.secret, top10: p.top10 });
  return res.status(400).json({ ok: false, error: 'bad action' });
}
