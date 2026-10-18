/* Cloudflare Pages Function: persiste solo contadores y un ID aleatorio por pestaña. */
const NO_STORE = { 'Cache-Control': 'no-store' };
const MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000;

function empty() { return new Response(null, { status: 204, headers: NO_STORE }); }
function failure(status) { return new Response(null, { status, headers: NO_STORE }); }

export async function onRequestPost({ request, env }) {
  // Nunca escribir en una base no verificada. En preview sin binding, no recopilar.
  if (!env.SESSION_DB || typeof env.SESSION_DB.batch !== 'function') return empty();
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return failure(403);
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return failure(403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return failure(415);
  if (Number(request.headers.get('Content-Length') || 0) > 1024) return failure(413);

  // IP utilizada solo para descartar visitas internas, sin guardarla ni enviarla al dataset.
  const remoteIP = request.headers.get('CF-Connecting-IP');
  const excluded = String(env.SESSION_EXCLUDED_IPS || '').split(/[\s,;]+/).filter(Boolean);
  if (remoteIP && excluded.includes(remoteIP)) return empty();
  if (/bot|crawler|spider|headless|lighthouse|pingdom|uptimerobot/i.test(request.headers.get('User-Agent') || '')) return empty();

  let data;
  try {
    const body = await request.text();
    if (body.length > 1024) return failure(413);
    data = JSON.parse(body);
  } catch { return failure(400); }

  const kind = data?.kind;
  const id = data?.id;
  const path = data?.path;
  const visible = data?.visibleMs;
  const engaged = data?.engagedMs;
  if (!['start', 'view', 'pulse', 'end'].includes(kind) ||
      typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id) ||
      typeof path !== 'string' || path.length > 180 ||
      !path.startsWith('/') || path.includes('?') || path.includes('#') ||
      /^\/(?:admin|api)(?:\/|$)/i.test(path) ||
      !Number.isInteger(visible) || !Number.isInteger(engaged) ||
      visible < 0 || visible > 16000 || engaged < 0 || engaged > visible ||
      (kind !== 'pulse' && (visible !== 0 || engaged !== 0))) return failure(400);

  const time = Date.now();
  const views = kind === 'view' ? 1 : 0;
  const visit = env.SESSION_DB.prepare(
    'INSERT INTO session_visits (session_id, first_seen_at, last_seen_at, visible_ms, engaged_ms, pageviews, entry_path, last_path, hostname) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
    'ON CONFLICT(session_id) DO UPDATE SET ' +
    'first_seen_at = MIN(session_visits.first_seen_at, excluded.first_seen_at), ' +
    'last_seen_at = MAX(session_visits.last_seen_at, excluded.last_seen_at), ' +
    'visible_ms = session_visits.visible_ms + excluded.visible_ms, ' +
    'engaged_ms = session_visits.engaged_ms + excluded.engaged_ms, ' +
    'pageviews = session_visits.pageviews + excluded.pageviews, last_path = excluded.last_path'
  ).bind(id, time, time, visible, engaged, views, path, path, url.hostname);

  const commands = [visit];
  if (kind === 'view' || kind === 'pulse') {
    commands.push(env.SESSION_DB.prepare(
      'INSERT INTO session_pages (session_id, path, pageviews, visible_ms, engaged_ms, last_seen_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(session_id, path) DO UPDATE SET ' +
      'pageviews = session_pages.pageviews + excluded.pageviews, ' +
      'visible_ms = session_pages.visible_ms + excluded.visible_ms, ' +
      'engaged_ms = session_pages.engaged_ms + excluded.engaged_ms, ' +
      'last_seen_at = MAX(session_pages.last_seen_at, excluded.last_seen_at)'
    ).bind(id, path, views, visible, engaged, time));
  }
  if (kind === 'start') {
    commands.push(env.SESSION_DB.prepare(
      'DELETE FROM session_visits WHERE last_seen_at < ?'
    ).bind(time - MAX_AGE_MS));
  }
  try {
    await env.SESSION_DB.batch(commands);
    return empty();
  } catch {
    // Error técnico sin datos de sesión ni IP en logs. El servidor nunca expone SQL.
    return failure(503);
  }
}