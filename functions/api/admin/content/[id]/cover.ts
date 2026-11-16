import { requireAuth } from "../../../../_lib/auth";
import { removeStoredMedia, storeImage } from "../../../../_lib/media";
import { badRequest, json, serverError } from "../../../../_lib/response";

export const onRequestPost = async ({ request, env, params }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  const item = await env.DB.prepare("SELECT id FROM content_items WHERE id = ?1").bind(params.id).first();
  if (!item) return json({ error: "Contenido no encontrado." }, { status: 404 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("Falta la imagen.");
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return badRequest("La portada debe ser JPG, PNG o WebP de menos de 8 MB.");
  let publicId: string | null = null;
  try {
    publicId = await storeImage(file, env, request);
    await env.DB.prepare("UPDATE content_items SET cover_public_id = ?1, cover_mode = 'image', updated_at = CURRENT_TIMESTAMP WHERE id = ?2").bind(publicId, params.id).run();
    return json({ ok: true, publicId });
  } catch (error) {
    await removeStoredMedia(env, publicId).catch(() => undefined);
    return serverError(error instanceof Error ? error.message : "No fue posible subir la portada.");
  }
};
