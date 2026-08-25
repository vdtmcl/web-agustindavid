import { requireAuth } from "../../_lib/auth";
import { catalogDisplayName, loadAdminContent, syncVideoCatalog } from "../../_lib/content";
import { badRequest, json, serverError } from "../../_lib/response";

type ParsedCloudinaryVideo = { publicId: string; format: string };

function parseCloudinaryVideo(value: unknown, cloudName: string): ParsedCloudinaryVideo | null {
  if (typeof value !== "string" || !value.trim()) return null;
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "res.cloudinary.com") return null;

  const rawSegments = url.pathname.split("/").filter(Boolean);
  if (rawSegments[0] !== cloudName) return null;
  const uploadIndex = rawSegments.findIndex((segment, index) => segment === "video" && rawSegments[index + 1] === "upload");
  if (uploadIndex < 0) return null;

  let segments: string[];
  try { segments = rawSegments.slice(uploadIndex + 2).map((segment) => decodeURIComponent(segment)); } catch { return null; }
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex >= 0) segments = segments.slice(versionIndex + 1);
  while (segments.length > 1 && /^(q_|f_|c_|w_|h_|ar_|so_|vc_|fl_|dpr_|g_|e_|ac_|br_)/.test(segments[0])) segments.shift();
  if (!segments.length) return null;

  const last = segments[segments.length - 1];
  const extension = last.match(/\.([a-z0-9]+)$/i);
  const format = (extension?.[1] || "mp4").toLowerCase();
  if (!["mp4", "mov", "webm", "m4v"].includes(format)) return null;
  segments[segments.length - 1] = extension ? last.slice(0, -extension[0].length) : last;
  const publicId = segments.join("/");
  if (!publicId || publicId.includes("..")) return null;
  return { publicId, format };
}

export const onRequestGet = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  try { await syncVideoCatalog(env); return json({ items: await loadAdminContent(env) }); } catch { return serverError("No fue posible cargar el panel."); }
};

export const onRequestPost = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  let body: { variant?: string; displayName?: string; videoUrl?: string };
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }

  if (body.videoUrl !== undefined) {
    const parsed = parseCloudinaryVideo(body.videoUrl, env.CLOUDINARY_CLOUD_NAME || "vdtm-cl");
    if (!parsed) return badRequest("Pega un enlace válido de video de Cloudinary del proyecto.");
    try {
      const existing = await env.DB.prepare("SELECT id, active FROM content_items WHERE type = 'video' AND public_id = ?1 LIMIT 1").bind(parsed.publicId).first();
      if (existing && Number(existing.active) === 1) return badRequest("Ese video ya está en el panel.");
      const max = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM content_items WHERE placement = 'gallery' AND active = 1").first();
      const position = Number(max?.max_position ?? -1) + 1;
      if (existing) {
        await env.DB.prepare("UPDATE content_items SET variant = 'small', placement = 'gallery', position = ?1, format = ?2, display_name = ?3, active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?4")
          .bind(position, parsed.format, catalogDisplayName(parsed.publicId), existing.id).run();
        return json({ id: existing.id, reactivated: true });
      }
      const id = "video-" + crypto.randomUUID();
      await env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, public_id, format, display_name, autoplay, active, updated_at) VALUES (?1, 'video', 'small', 'gallery', ?2, ?3, ?4, ?5, 0, 1, CURRENT_TIMESTAMP)")
        .bind(id, position, parsed.publicId, parsed.format, (body.displayName || catalogDisplayName(parsed.publicId)).slice(0, 120)).run();
      return json({ id, created: true }, { status: 201 });
    } catch { return serverError("No fue posible añadir el video."); }
  }

  if (body.variant !== "album-4" && body.variant !== "album-9") return badRequest("Tipo de álbum inválido.");
  try {
    const id = crypto.randomUUID();
    const max = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM content_items WHERE placement = 'gallery' AND active = 1").first();
    await env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, display_name, updated_at) VALUES (?1, 'photo_album', ?2, 'gallery', ?3, ?4, CURRENT_TIMESTAMP)")
      .bind(id, body.variant, Number(max?.max_position ?? -1) + 1, (body.displayName || (body.variant === "album-4" ? "Álbum de 4 fotografías" : "Álbum de 9 fotografías")).slice(0, 120)).run();
    return json({ id }, { status: 201 });
  } catch { return serverError("No se pudo crear el álbum."); }
};