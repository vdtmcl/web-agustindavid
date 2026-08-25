import { requireAuth } from "../../../_lib/auth";
import { badRequest, json, serverError } from "../../../_lib/response";

function nonNegativeNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export const onRequestPatch = async ({ request, env, params }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  let body: { variant?: string; autoplay?: boolean; displayName?: string; startSeconds?: number; endTrimSeconds?: number };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  const current = await env.DB.prepare("SELECT * FROM content_items WHERE id = ?1").bind(params.id).first();
  if (!current) return json({ error: "Contenido no encontrado." }, { status: 404 });
  const validVideo = ["hero", "video-large", "small"].includes(body.variant || "");
  const validAlbum = ["album-4", "album-9"].includes(body.variant || "");
  if (body.variant !== undefined && !((current.type === "video" && validVideo) || (current.type === "photo_album" && validAlbum))) return badRequest("Variante inválida.");
  if (body.autoplay !== undefined && current.type !== "video") return badRequest("Los álbumes no tienen autoplay.");

  const startSeconds = body.startSeconds === undefined ? null : nonNegativeNumber(body.startSeconds);
  const endTrimSeconds = body.endTrimSeconds === undefined ? null : nonNegativeNumber(body.endTrimSeconds);
  if (body.startSeconds !== undefined && startSeconds === null) return badRequest("El inicio debe ser un número igual o mayor que cero.");
  if (body.endTrimSeconds !== undefined && endTrimSeconds === null) return badRequest("El final debe ser un número igual o mayor que cero.");
  if (current.type !== "video" && (body.startSeconds !== undefined || body.endTrimSeconds !== undefined)) return badRequest("Los álbumes no tienen recorte de reproducción.");

  try {
    await env.DB.prepare("UPDATE content_items SET variant = COALESCE(?1, variant), autoplay = COALESCE(?2, autoplay), display_name = COALESCE(?3, display_name), start_seconds = COALESCE(?4, start_seconds), end_trim_seconds = COALESCE(?5, end_trim_seconds), updated_at = CURRENT_TIMESTAMP WHERE id = ?6")
      .bind(
        body.variant ?? null,
        body.autoplay === undefined ? null : (body.autoplay ? 1 : 0),
        body.displayName?.slice(0, 120) ?? null,
        startSeconds,
        endTrimSeconds,
        params.id
      )
      .run();
    return json({ ok: true });
  } catch { return serverError("No fue posible guardar el contenido."); }
};

export const onRequestDelete = async ({ request, env, params }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  const current = await env.DB.prepare("SELECT id, type FROM content_items WHERE id = ?1 AND active = 1").bind(params.id).first();
  if (!current || current.type !== "video") return json({ error: "Video no encontrado." }, { status: 404 });
  try {
    await env.DB.prepare("UPDATE content_items SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(params.id).run();
    return json({ ok: true });
  } catch { return serverError("No fue posible eliminar el video."); }
};
