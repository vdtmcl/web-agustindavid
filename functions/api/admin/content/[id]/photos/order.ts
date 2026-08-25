import { requireAuth } from "../../../../../_lib/auth";
import { badRequest, json, serverError } from "../../../../../_lib/response";

export const onRequestPut = async ({ request, env, params }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  const album = await env.DB.prepare("SELECT variant, type FROM content_items WHERE id = ?1").bind(params.id).first();
  if (!album || album.type !== "photo_album") return json({ error: "Álbum no encontrado." }, { status: 404 });
  let body: { ids?: string[] };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  const ids = Array.isArray(body.ids) ? body.ids : [];
  const rows = await env.DB.prepare("SELECT id FROM album_photos WHERE content_item_id = ?1 ORDER BY position ASC").bind(params.id).all();
  const current = (rows.results || []).map((row: any) => String(row.id));
  if (ids.length !== current.length || ids.some((id) => !current.includes(id))) return badRequest("El orden de fotografías no coincide con el álbum.");
  try {
    const statements = ids.map((id, position) => env.DB.prepare("UPDATE album_photos SET position = ?1 WHERE id = ?2 AND content_item_id = ?3").bind(position, id, params.id));
    await env.DB.batch(statements);
    await env.DB.prepare("UPDATE content_items SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(params.id).run();
    return json({ ok: true });
  } catch { return serverError("No fue posible guardar el orden de fotografías."); }
};