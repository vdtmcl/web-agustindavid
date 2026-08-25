import { requireAuth } from "../../../_lib/auth";
import { badRequest, json, serverError } from "../../../_lib/response";

type OrderBody = { ids?: string[]; heroId?: string | null };

function sameIdSet(expected: string[], actual: string[]) {
  return expected.length === actual.length && new Set(expected).size === actual.length && actual.every((id) => new Set(expected).has(id));
}

export const onRequestPut = async ({ request, env }: any) => {
  const denied = await requireAuth(request, env);
  if (denied) return denied;
  let body: OrderBody;
  try { body = await request.json(); } catch { return badRequest("Solicitud inválida."); }
  if (!Array.isArray(body.ids) || body.ids.length > 100 || body.ids.some((id) => typeof id !== "string")) return badRequest("Orden inválido.");

  try {
    const existingGallery = await env.DB.prepare("SELECT id FROM content_items WHERE placement = 'gallery' AND active = 1 ORDER BY position ASC").all();
    const currentGalleryIds = (existingGallery.results || []).map((row: any) => row.id);
    const currentHero = await env.DB.prepare("SELECT id FROM content_items WHERE placement = 'hero' AND active = 1 AND type = 'video' LIMIT 1").first();
    const currentHeroId = currentHero?.id || null;
    const requestedHeroId = body.heroId === undefined ? currentHeroId : body.heroId;

    if (requestedHeroId !== null) {
      const requestedHero = await env.DB.prepare("SELECT id FROM content_items WHERE id = ?1 AND active = 1 AND type = 'video' LIMIT 1").bind(requestedHeroId).first();
      if (!requestedHero) return badRequest("El Hero debe ser un video activo.");
      if (body.ids.includes(requestedHeroId)) return badRequest("El video Hero no puede repetirse en la galería.");
    }

    const expectedGalleryIds = currentGalleryIds.filter((id: string) => id !== requestedHeroId);
    if (currentHeroId && currentHeroId !== requestedHeroId) expectedGalleryIds.push(currentHeroId);
    if (!sameIdSet(expectedGalleryIds, body.ids)) return badRequest("La lista no coincide con la galería actual.");

    const statements: any[] = [];
    if (currentHeroId && currentHeroId !== requestedHeroId) {
      statements.push(env.DB.prepare("UPDATE content_items SET placement = 'gallery', variant = 'small', autoplay = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(currentHeroId));
    }
    if (requestedHeroId && requestedHeroId !== currentHeroId) {
      statements.push(env.DB.prepare("UPDATE content_items SET placement = 'hero', variant = 'hero', updated_at = CURRENT_TIMESTAMP WHERE id = ?1").bind(requestedHeroId));
    }
    statements.push(...body.ids.map((id, index) => env.DB.prepare("UPDATE content_items SET placement = 'gallery', position = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 AND active = 1").bind(index, id)));
    if (statements.length) await env.DB.batch(statements);
    return json({ ok: true });
  } catch { return serverError("No fue posible guardar el orden."); }
};