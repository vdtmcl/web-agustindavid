export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function noStore(init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store, max-age=0");
  return headers;
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return json({ error: "No autorizado" }, { status: 401 });
}

export function serverError(message = "Error interno") {
  return json({ error: message }, { status: 500 });
}

export function getClientIp(request: Request) {
  return (request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "unknown").slice(0, 128);
}