import { requireAuth } from "../../../../_lib/auth";
import { removeStoredMedia, storeImage } from "../../../../_lib/media";
import { badRequest, json, serverError } from "../../../../_lib/response";

export const onRequestPost = async ({ request, env, params }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  const item = await env.DB.prepare("SELECT variant, type FROM content_items WHERE id = ?1").bind(params.id).first();
  if (!item || item.type !== "photo_album") return json({ error: "Álbum no encontrado." }, { status: 404 });
  const limit = item.variant === "album-4" ? 4 : 9;
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM album_photos WHERE content_item_id = ?1").bind(params.id).first();
  if (Number(count?.count || 0) >= limit) return badRequest("El álbum ya tiene la cantidad máxima de fotografías.");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("Falta la fotografía.");
  if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) return badRequest("La fotografía debe ser JPG, PNG o WebP de menos de 12 MB.");
  let publicId: string | null = null;
  try {
    publicId = await storeImage(file, env, request);
    await env.DB.prepare("INSERT INTO album_photos (id, content_item_id, public_id, position, alt_text) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(crypto.randomUUID(), params.id, publicId, Number(count?.count || 0), String(form.get("alt") || "").slice(0, 180)).run();
    return json({ ok: true, publicId });
  } catch (error) {
    await removeStoredMedia(env, publicId).catch(() => undefined);
    return serverError(error instanceof Error ? error.message : "No fue posible subir la fotografía.");
  }
};
