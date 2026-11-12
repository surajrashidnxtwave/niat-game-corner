/* Game Corner service worker.
   Only job: make Game Corner installable as a home-screen app and show a friendly
   page when a student opens it with no internet. It caches nothing, so students
   always get the newest version of the site. */
const OFFLINE = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<title>Game Corner</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05060F;color:#fff;font:700 17px/1.45 system-ui,sans-serif;text-align:center;padding:24px}'
  + 'h1{font-size:28px;margin:0 0 8px}p{color:#AAB2D4;margin:0 0 20px}button{min-height:52px;padding:0 28px;border:0;border-radius:14px;background:#C6F432;color:#10152E;font:inherit;font-weight:900;cursor:pointer}</style></head>'
  + '<body><div><h1>You’re offline</h1><p>Game Corner needs internet. Turn on data or Wi-Fi and try again.</p><button onclick="location.reload()">Try again</button></div></body></html>';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
