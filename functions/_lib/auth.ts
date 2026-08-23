import { getClientIp, json, unauthorized } from "./response";

const COOKIE_NAME = "ad_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

function encode(bytes: ArrayBuffer | Uint8Array) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return encode(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

function equal(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left[index] ^ right[index];
  return result === 0;
}

async function same(left: string, right: string) {
  return equal(new TextEncoder().encode(left), new TextEncoder().encode(right));
}

function cookie(request: Request) {
  const cookies = request.headers.get("Cookie")?.split(";") || [];
  for (const part of cookies) {
    const pieces = part.trim().split("=");
    if (pieces.shift() === COOKIE_NAME) return pieces.join("=");
  }
  return null;
}

export async function isAuthenticated(request: Request, env: any) {
  if (!env.SESSION_SECRET) return false;
  const raw = cookie(request);
  if (!raw) return false;
  const parts = raw.split(".");
  const payload = parts[0];
  const signature = parts[1];
  if (!payload || !signature) return false;
  const expiry = Number(payload.split(":")[1]);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return false;
  return same(await sign(payload, env.SESSION_SECRET), signature);
}

export async function requireAuth(request: Request, env: any) {
  if (!(await isAuthenticated(request, env))) return unauthorized();
  return null;
}

export async function login(request: Request, env: any) {
  const configuredHash = env.ADMIN_PASSWORD_HASH || (env.ADMIN_PASSWORD ? await sha256(env.ADMIN_PASSWORD) : "");
  if (!configuredHash || !env.SESSION_SECRET) return json({ error: "La autenticación aún no está configurada." }, { status: 503 });
  const ip = getClientIp(request);
  const bucket = ip + ":" + Math.floor(Date.now() / 900000);
  const attempt = env.DB ? await env.DB.prepare("SELECT attempts FROM auth_attempts WHERE bucket = ?1").bind(bucket).first() : null;
  if (attempt && Number(attempt.attempts) >= 8) return json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  let body: { password?: string };
  try { body = await request.json(); } catch { return json({ error: "Solicitud inválida." }, { status: 400 }); }
  const valid = typeof body.password === "string" && await same(await sha256(body.password), configuredHash);
  if (!valid) {
    if (env.DB) await env.DB.prepare("INSERT INTO auth_attempts (id, bucket, attempts, updated_at) VALUES (?1, ?2, 1, ?3) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1, updated_at = excluded.updated_at").bind(crypto.randomUUID(), bucket, Date.now()).run();
    return json({ error: "Contraseña incorrecta." }, { status: 401 });
  }
  if (env.DB) await env.DB.prepare("DELETE FROM auth_attempts WHERE bucket = ?1").bind(bucket).run();
  const now = Math.floor(Date.now() / 1000);
  const payload = now + ":" + (now + SESSION_SECONDS);
  const value = payload + "." + await sign(payload, env.SESSION_SECRET);
  return json({ ok: true }, { headers: { "set-cookie": COOKIE_NAME + "=" + value + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + SESSION_SECONDS } });
}

export function logout() {
  return json({ ok: true }, { headers: { "set-cookie": COOKIE_NAME + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0" } });
}