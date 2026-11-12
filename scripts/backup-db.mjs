// Read-only backup of every table in the database at DATABASE_URL.
//   node --env-file=.env.prod.local scripts/backup-db.mjs
// Writes backups/<date-time>/<table>.json (one JSON array per table) and manifest.json (row counts).
// backups/ is git-ignored: it holds student data. Keep it on this machine or a private drive.
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const sql = neon(process.env.DATABASE_URL);
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const dir = path.join(process.cwd(), 'backups', stamp);
fs.mkdirSync(dir, { recursive: true });

const tables = (await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1`).map(r => r.table_name);
const manifest = { taken_at: new Date().toISOString(), tables: {} };
const PAGE = 20000;

for (const t of tables) {
  // page through in primary-key order so every row is read exactly once
  const pk = (await sql`SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                        WHERE i.indrelid = ${'public.' + t}::regclass AND i.indisprimary ORDER BY array_position(i.indkey, a.attnum)`).map(r => '"' + r.attname + '"');
  const order = pk.length ? pk.join(', ') : 'ctid';
  const total = (await sql.query(`SELECT COUNT(*)::int AS n FROM "${t}"`))[0].n;
  const out = fs.createWriteStream(path.join(dir, t + '.json'));
  out.write('[\n');
  let got = 0;
  for (let off = 0; off < total; off += PAGE) {
    const rows = await sql.query(`SELECT * FROM "${t}" ORDER BY ${order} LIMIT ${PAGE} OFFSET ${off}`);
    rows.forEach((r, i) => out.write((got + i ? ',\n' : '') + JSON.stringify(r)));
    got += rows.length;
  }
  out.write('\n]\n');
  await new Promise(ok => out.end(ok));
  manifest.tables[t] = { rows: got, expected: total };
  console.log(t.padEnd(18), String(got).padStart(8), got === total ? 'ok' : 'MISMATCH (expected ' + total + ')');
}
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('\nSaved to', dir);
