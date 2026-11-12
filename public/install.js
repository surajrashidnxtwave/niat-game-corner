/* "Add to home screen" for Game Corner (used by welcome.html and index.html).
   Any element with [data-install] becomes the button. It hides itself when Game Corner
   is already open as a home-screen app. Chrome/Edge on Android and laptops get the real
   install prompt; iPhones and in-app browsers get short steps instead. */
(function () {
  let deferred = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = /Instagram|FBAN|FBAV|Line\/|Snapchat|LinkedInApp|; wv\)/.test(ua);
  const android = /Android/.test(ua);

  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });
  addEventListener('appinstalled', () => { deferred = null; sync(); close(); });

  function sync() { document.querySelectorAll('[data-install]').forEach(b => { b.hidden = standalone(); }); }

  function steps() {
    if (inApp) return ['This page is open inside another app.', 'Tap <b>⋮</b> or <b>…</b> and choose <b>Open in Chrome</b> (or <b>Open in Safari</b> on iPhone).', 'Then come back to this button.'];
    if (ios) return ['Open this page in <b>Safari</b>.', 'Tap the <b>Share</b> button <span aria-hidden="true">⬆</span> at the bottom.', 'Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.'];
    if (android) return ['Tap <b>⋮</b> at the top right of Chrome.', 'Tap <b>Add to Home screen</b> or <b>Install app</b>.', 'Tap <b>Add</b>.'];
    return ['In Chrome or Edge, click the <b>install</b> icon at the right end of the address bar.', 'Or open the browser menu and choose <b>Install Game Corner</b>.', 'It opens in its own window, like an app.'];
  }

  let sheet = null;
  function close() { if (sheet) { sheet.remove(); sheet = null; } }
  function help() {
    close();
    sheet = document.createElement('div');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Add Game Corner to your home screen');
    sheet.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;align-items:end;justify-items:center;background:rgba(3,4,12,.6);padding:16px;padding-bottom:max(16px,env(safe-area-inset-bottom,0px))';
    sheet.innerHTML = '<div style="width:min(440px,100%);background:#141B34;color:#fff;border:1.5px solid rgba(255,255,255,.16);border-radius:24px;padding:22px 20px 18px;font:600 16px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><img src="/assets/icons/icon-192.png" width="48" height="48" alt="" style="border-radius:12px">'
      + '<div><div style="font-weight:800;font-size:18px">Add Game Corner to your home screen</div><div style="color:#AAB2D4;font-size:14px">Open it in one tap, like an app.</div></div></div>'
      + '<ol style="margin:0 0 16px;padding-left:22px;display:grid;gap:8px">' + steps().map(s => '<li>' + s + '</li>').join('') + '</ol>'
      + '<button type="button" style="width:100%;min-height:50px;border:0;border-radius:14px;background:#C6F432;color:#10152E;font:inherit;font-weight:800;cursor:pointer">Got it</button></div>';
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.tagName === 'BUTTON') close(); });
    document.body.appendChild(sheet);
    sheet.querySelector('button').focus();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  async function go() {
    if (deferred) {
      const p = deferred; deferred = null;
      try { p.prompt(); await p.userChoice; } catch (e) { help(); }
      return;
    }
    help();
  }
  window.GCInstall = { go, standalone };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-install]');
    if (b) { e.preventDefault(); go(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
})();
