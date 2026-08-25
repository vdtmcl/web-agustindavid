import { requireAuth } from "../../../_lib/auth";
import { badRequest, json, serverError } from "../../../_lib/response";

export const onRequestPut = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  let body: { ids?: string[] };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  if (!Array.isArray(body.ids) || body.ids.length > 100 || body.ids.some((id) => typeof id !== "string")) return badRequest("Orden inválido.");
  try {
    const existing = await env.DB.prepare("SELECT id FROM content_items WHERE placement = 'gallery' AND active = 1 ORDER BY position ASC").all();
    const expected = new Set((existing.results || []).map((row: any) => row.id));
    if (expected.size !== body.ids.length || body.ids.some((id) => !expected.has(id))) return badRequest("La lista no coincide con la galería actual.");
    await env.DB.batch(body.ids.map((id, index) => env.DB.prepare("UPDATE content_items SET position = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 AND placement = 'gallery'").bind(index, id)));
    return json({ ok: true });
  } catch { return serverError("No fue posible guardar el orden."); }
};