// Minimal stand-in for `vercel dev`: static files from public/, /api/<name> -> api/<name>.js default handler.
// Run from the repo root:  npm run dev:local   (or: node --env-file=.env.local scripts/dev-server.mjs [port])
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd(), PUB = path.join(ROOT, 'public'), PORT = +process.argv[2] || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/')) {
    const name = u.pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
    const file = path.join(ROOT, 'api', name + '.js');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('no api'); }
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    req.query = Object.fromEntries(u.searchParams);
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { if (!res.headersSent) res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
    res.send = s => { res.end(typeof s === 'string' ? s : JSON.stringify(s)); return res; };
    try {
      const mod = await import(pathToFileURL(file).href + '?t=' + fs.statSync(file).mtimeMs);   // re-import after edits
      await mod.default(req, res);
    } catch (e) { console.error(e); if (!res.writableEnded) { res.statusCode = 500; res.end('server error'); } }
    return;
  }
  let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(PUB, p);
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('dev server on http://127.0.0.1:' + PORT));
