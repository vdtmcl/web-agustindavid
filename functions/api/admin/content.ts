import { requireAuth } from "../../_lib/auth";
import { loadAdminContent } from "../../_lib/content";
import { removeStoredMedia, storeImage, storeVideo } from "../../_lib/media";
import { badRequest, json, serverError } from "../../_lib/response";

export const onRequestGet = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  try { return json({ items: await loadAdminContent(env) }); } catch { return serverError("No fue posible cargar el panel."); }
};

export const onRequestPost = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    let form: FormData;
    try { form = await request.formData(); } catch { return badRequest("Solicitud inválida."); }
    const video = form.get("video");
    const poster = form.get("poster");
    if (!(video instanceof File) || !(poster instanceof File)) return badRequest("Falta el video o su portada.");
    if (video.type !== "video/mp4" || !video.name.toLowerCase().endsWith(".mp4")) return badRequest("Sube un archivo MP4 H.264 optimizado.");
    if (video.size === 0 || video.size > 80 * 1024 * 1024) return badRequest("El video debe pesar menos de 80 MB.");
    if (poster.type !== "image/webp" || poster.size === 0 || poster.size > 5 * 1024 * 1024) return badRequest("La portada debe ser WebP y pesar menos de 5 MB.");
    let videoKey: string | null = null;
    let posterKey: string | null = null;
    try {
      const max = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM content_items WHERE placement = 'gallery' AND active = 1").first();
      const position = Number(max?.max_position ?? -1) + 1;
      const id = "video-" + crypto.randomUUID();
      const defaultName = video.name.replace(/\.mp4$/i, "").replace(/[_-]+/g, " ").trim();
      const displayName = String(form.get("displayName") || defaultName || "Nuevo video").slice(0, 120);
      videoKey = await storeVideo(video, env, request);
      posterKey = await storeImage(poster, env, request);
      await env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, public_id, format, display_name, cover_public_id, cover_mode, autoplay, active, updated_at) VALUES (?1, 'video', 'small', 'gallery', ?2, ?3, 'mp4', ?4, ?5, 'image', 0, 1, CURRENT_TIMESTAMP)")
        .bind(id, position, videoKey, displayName, posterKey).run();
      return json({ id, created: true }, { status: 201 });
    } catch {
      await Promise.all([removeStoredMedia(env, videoKey), removeStoredMedia(env, posterKey)]).catch(() => undefined);
      return serverError("No fue posible añadir el video.");
    }
  }

  let body: { variant?: string; displayName?: string };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  if (body.variant !== "album-4" && body.variant !== "album-9") return badRequest("Tipo de álbum inválido.");
  try {
    const id = crypto.randomUUID();
    const max = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM content_items WHERE placement = 'gallery' AND active = 1").first();
    await env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, display_name, updated_at) VALUES (?1, 'photo_album', ?2, 'gallery', ?3, ?4, CURRENT_TIMESTAMP)")
      .bind(id, body.variant, Number(max?.max_position ?? -1) + 1, (body.displayName || (body.variant === "album-4" ? "Álbum de 4 fotografías" : "Álbum de 9 fotografías")).slice(0, 120)).run();
    return json({ id }, { status: 201 });
  } catch { return serverError("No se pudo crear el álbum."); }
};
