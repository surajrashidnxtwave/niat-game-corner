// Read-only check of the admin report against whatever DATABASE_URL is set. Prints status and counts only (no student data).
//   node --env-file=.env.prod.local scripts/check-admin.mjs [--save]
// --save also writes both reports to public/_snap/ (git-ignored) so the admin page can be tested locally. Delete that folder after.
import fs from 'node:fs';
const SAVE = process.argv.includes('--save');
process.env.ADMIN_KEY = process.env.ADMIN_KEY || 'check-only';
const { default: h } = await import('../api/admin.js');
for (const view of ['summary', 'drive']) {
  const t = Date.now();
  const req = { method: 'GET', url: '/api/admin?view=' + view, headers: { 'x-admin-key': process.env.ADMIN_KEY, 'x-forwarded-for': 'check-' + view } };
  const [code, j] = await new Promise(ok => { const res = { setHeader() {}, status(c) { this.c = c; return this; }, json(j) { ok([this.c, j]); } }; h(req, res).catch(e => ok([0, { error: e.message }])); });
  const sizes = Object.fromEntries(Object.entries(j || {}).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v === 'object' && v ? Object.keys(v).length : v]));
  if (SAVE) { fs.mkdirSync(new URL('../public/_snap/', import.meta.url), { recursive: true }); fs.writeFileSync(new URL('../public/_snap/' + view + '.json', import.meta.url), JSON.stringify(j)); }
  console.log(view, '→ HTTP', code, j && j.ok ? 'ok' : 'FAILED', (Date.now() - t) + ' ms');
  console.log('  ', JSON.stringify(view === 'drive' ? { ...sizes, kpi: j.kpi, week: j.week } : sizes));
}
