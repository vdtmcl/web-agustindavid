import { requireAuth } from "../../_lib/auth";
import { loadAdminContent } from "../../_lib/content";
import { badRequest, json, serverError } from "../../_lib/response";

export const onRequestGet = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  try { return json({ items: await loadAdminContent(env) }); } catch { return serverError("No fue posible cargar el panel."); }
};

export const onRequestPost = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  let body: { variant?: string; displayName?: string };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  if (body.variant !== "album-4" && body.variant !== "album-9") return badRequest("Tipo de álbum inválido.");
  const id = crypto.randomUUID();
  const max = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM content_items WHERE placement = 'gallery'").first();
  await env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, display_name, updated_at) VALUES (?1, 'photo_album', ?2, 'gallery', ?3, ?4, CURRENT_TIMESTAMP)")
    .bind(id, body.variant, Number(max?.max_position ?? -1) + 1, (body.displayName || (body.variant === "album-4" ? "Álbum de 4 fotografías" : "Álbum de 9 fotografías")).slice(0, 120)).run();
  return json({ id }, { status: 201 });
};