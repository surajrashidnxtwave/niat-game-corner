// Lists the cheapest OpenRouter text models, so you can pick candidates to test.
// Usage: node --env-file=.env.local scripts/cheapest-models.mjs [count] [--include-free]
const count = Number(process.argv.find(a => /^\d+$/.test(a)) || 15);
const includeFree = process.argv.includes('--include-free');

const r = await fetch('https://openrouter.ai/api/v1/models');
if (!r.ok) { console.error('Could not fetch models:', r.status); process.exit(1); }
const { data } = await r.json();

const rows = data
  .filter(m => (m.architecture?.input_modalities || ['text']).includes('text') && (m.architecture?.output_modalities || ['text']).includes('text'))
  .map(m => ({ id: m.id, in: Number(m.pricing?.prompt || 0) * 1e6, out: Number(m.pricing?.completion || 0) * 1e6, ctx: m.context_length || 0, json: (m.supported_parameters || []).includes('response_format') }))
  .filter(m => includeFree || m.in + m.out > 0)
  .filter(m => m.ctx >= 8000)
  // a judge call is ~600 input + ~60 output tokens
  .map(m => ({ ...m, perCall: (m.in * 600 + m.out * 60) / 1e6 }))
  .sort((a, b) => a.perCall - b.perCall)
  .slice(0, count);

console.log('model'.padEnd(52), '$/M in'.padStart(8), '$/M out'.padStart(8), 'json'.padStart(5), '$ per 1,000 checks'.padStart(20));
for (const m of rows) console.log(m.id.padEnd(52), m.in.toFixed(3).padStart(8), m.out.toFixed(3).padStart(8), (m.json ? 'yes' : 'no').padStart(5), (m.perCall * 1000).toFixed(4).padStart(20));
