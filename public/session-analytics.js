/* Anonimato por sesión: no se usan cookies, IP, query strings ni identificadores persistentes. */
(() => {
  'use strict';
  const STORAGE = 'vdtm:session:v1';
  const OPT_OUT = 'vdtm:session:opt-out';
  const IDLE_LIMIT = 30 * 60 * 1000;
  const PULSE_INTERVAL = 15000;
  const isPublic = (path) => !/^\/(?:admin|api)(?:\/|$)/i.test(path);
  const currentPath = () => window.location.pathname.slice(0, 180);
  const mark = new URL(window.location.href).searchParams.get('vdtm_analytics');
  try {
    if (mark === 'off') localStorage.setItem(OPT_OUT, '1');
    if (mark === 'on') localStorage.removeItem(OPT_OUT);
    if (localStorage.getItem(OPT_OUT) === '1') return;
  } catch { /* El almacenamiento puede estar bloqueado. */ }
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
  if (!isPublic(currentPath()) || !crypto.randomUUID) return;

  const now = Date.now();
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(STORAGE) || 'null'); } catch { /* noop */ }
  const isFresh = !saved || !/^[a-f0-9]{32}$/.test(saved.id || '') ||
    !Number.isFinite(saved.seen) || now - saved.seen > IDLE_LIMIT || now < saved.seen;
  const id = isFresh ? crypto.randomUUID().replace(/-/g, '') : saved.id;
  let path = currentPath();
  let lastTick = performance.now();
  let lastActivity = now;

  function remember() {
    try { sessionStorage.setItem(STORAGE, JSON.stringify({ id, seen: Date.now() })); }
    catch { /* Duración limitada a esta carga cuando el navegador bloquea sessionStorage. */ }
  }

  function send(kind, visibleMs = 0, engagedMs = 0, route = path) {
    if (!isPublic(route)) return;
    const body = JSON.stringify({ id, kind, path: route, visibleMs, engagedMs });
    try {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon('/api/session', blob)) return;
    } catch { /* Fallback */ }
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function pulse(forceVisible = false) {
    const tick = performance.now();
    const elapsed = Math.round(Math.max(0, Math.min(PULSE_INTERVAL + 1000, tick - lastTick)));
    lastTick = tick;
    if ((forceVisible || document.visibilityState === 'visible') && elapsed > 0) {
      const engaged = Date.now() - lastActivity <= 60000 ? elapsed : 0;
      send('pulse', elapsed, engaged);
      remember();
    }
  }

  function routeChange() {
    const next = currentPath();
    if (next === path) return;
    pulse();
    path = next;
    lastActivity = Date.now();
    if (isPublic(path)) {
      send('view');
      remember();
    }
  }

  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function (...args) {
    const result = push.apply(this, args);
    routeChange();
    return result;
  };
  history.replaceState = function (...args) {
    const result = replace.apply(this, args);
    routeChange();
    return result;
  };
  addEventListener('popstate', routeChange);
  addEventListener('pageshow', () => { lastTick = performance.now(); });
  addEventListener('pagehide', () => {
    pulse(true);
    send('end');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pulse(true);
    lastTick = performance.now();
  });
  for (const event of ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']) {
    addEventListener(event, () => { lastActivity = Date.now(); }, { passive: true });
  }

  remember();
  if (isFresh) send('start');
  send('view');
  setInterval(pulse, PULSE_INTERVAL);
})();