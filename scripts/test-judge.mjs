// Compare models on the gold cases: accuracy, speed and cost.
// Usage: node --env-file=.env.local scripts/test-judge.mjs <model-id> [<model-id> ...]
// With no arguments it tests OPENROUTER_MODEL.
import { judgeTask } from '../api/_lib/judge-core.js';
import { GOLD } from './gold.mjs';

const models = process.argv.slice(2).length ? process.argv.slice(2) : [process.env.OPENROUTER_MODEL];
if (!models[0]) { console.error('Pass model ids, or set OPENROUTER_MODEL in .env.local'); process.exit(1); }

const priceRes = await fetch('https://openrouter.ai/api/v1/models').then(r => r.json()).catch(() => ({ data: [] }));
const price = Object.fromEntries((priceRes.data || []).map(m => [m.id, { in: Number(m.pricing?.prompt || 0), out: Number(m.pricing?.completion || 0) }]));

function score(c, result) {
  if (!result) return 0;
  if (c.task === 'beat7') return c.expect.includes(result.category) ? 1 : 0;
  if (c.task === 'missinglink') return result.valid === c.expect[0] ? 1 : 0;
  if (c.task === 'recall') { const e = c.expect[0]; return e.filter((v, i) => v === result.hits[i]).length / e.length; }
  if (c.task === 'wordspread') {
    const [min, max, bad] = c.expect;
    const groups = new Set(result.words.filter(w => w.valid).map(w => w.group)).size;
    const invalid = result.words.map((w, i) => w.valid ? -1 : i).filter(i => i >= 0);
    return groups >= min && groups <= max && invalid.join() === bad.join() ? 1 : 0;
  }
  return 0;
}

const summary = [];
for (const model of models) {
  let total = 0, cost = 0, failures = 0; const times = [];
  console.log(`\n=== ${model} ===`);
  for (const c of GOLD) {
    const t0 = Date.now();
    let out = null;
    try { out = await judgeTask(c.task, c.payload, { model }); } catch (e) { console.log('  ERROR', e.message); }
    const ms = Date.now() - t0; times.push(ms);
    const s = score(c, out?.result); total += s; if (!out?.result) failures++;
    if (out?.usage && price[model]) cost += out.usage.prompt_tokens * price[model].in + out.usage.completion_tokens * price[model].out;
    const label = c.task === 'recall' ? 'recall' : `${c.task}: ${c.payload.answer || c.payload.words.join(' ')}`;
    console.log(`  ${s === 1 ? 'PASS' : s > 0 ? 'PART' : 'FAIL'}  ${ms}ms  ${label.slice(0, 60)}  -> ${JSON.stringify(out?.result)}`);
  }
  times.sort((a, b) => a - b);
  const row = { model, accuracy: (total / GOLD.length * 100).toFixed(1) + '%', median_ms: times[Math.floor(times.length / 2)], unusable_outputs: failures, cost_per_1000_checks: '$' + (cost / GOLD.length * 1000).toFixed(4) };
  summary.push(row);
}
console.log('\n=== Summary ===');
console.table(summary);
console.log('Pick the cheapest model with accuracy >= 90%, zero unusable outputs and median under ~2000 ms.');
