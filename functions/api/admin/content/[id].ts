import { requireAuth } from "../../../_lib/auth";
import { badRequest, json, serverError } from "../../../_lib/response";

export const onRequestPatch = async ({ request, env, params }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  let body: { variant?: string; autoplay?: boolean; displayName?: string };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  const current = await env.DB.prepare("SELECT * FROM content_items WHERE id = ?1").bind(params.id).first();
  if (!current) return json({ error: "Contenido no encontrado." }, { status: 404 });
  const validVideo = ["hero", "video-large", "small"].includes(body.variant || "");
  const validAlbum = ["album-4", "album-9"].includes(body.variant || "");
  if (body.variant !== undefined && !((current.type === "video" && validVideo) || (current.type === "photo_album" && validAlbum))) return badRequest("Variante inválida.");
  if (body.autoplay !== undefined && current.type !== "video") return badRequest("Los álbumes no tienen autoplay.");
  try {
    await env.DB.prepare("UPDATE content_items SET variant = COALESCE(?1, variant), autoplay = COALESCE(?2, autoplay), display_name = COALESCE(?3, display_name), updated_at = CURRENT_TIMESTAMP WHERE id = ?4")
      .bind(body.variant ?? null, body.autoplay === undefined ? null : (body.autoplay ? 1 : 0), body.displayName?.slice(0, 120) ?? null, params.id).run();
    return json({ ok: true });
  } catch { return serverError("No fue posible guardar el contenido."); }
};