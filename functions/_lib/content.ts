import { frameUrl, imageThumbUrl, imageUrl, videoUrl } from "./cloudinary";
import { catalogDisplayName, catalogGallery, catalogHero } from "./catalog";

function photo(row: any, full: boolean) {
  return { id: row.id, publicId: row.public_id, position: row.position, alt: row.alt_text || row.public_id, thumbUrl: imageThumbUrl(row.public_id), imageUrl: full ? imageUrl(row.public_id) : undefined };
}

export async function syncVideoCatalog(env: any) {
  const existing = await env.DB.prepare("SELECT id, public_id FROM content_items WHERE type = 'video'").all();
  const existingPublicIds = new Set((existing.results || []).map((row: any) => row.public_id));
  const statements: any[] = [];

  if (catalogHero && !existingPublicIds.has(catalogHero.publicId)) {
    statements.push(env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, public_id, format, display_name, autoplay, active) VALUES (?1, 'video', 'hero', 'hero', 0, ?2, ?3, ?4, 1, 1)").bind("hero-" + crypto.randomUUID(), catalogHero.publicId, catalogHero.format, catalogDisplayName(catalogHero.publicId)));
    existingPublicIds.add(catalogHero.publicId);
  }

  const maxPosition = await env.DB.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM content_items WHERE placement = 'gallery' AND active = 1").first();
  let nextPosition = Number(maxPosition?.max_position ?? -1) + 1;
  catalogGallery.forEach((video) => {
    if (existingPublicIds.has(video.publicId)) return;
    statements.push(env.DB.prepare("INSERT INTO content_items (id, type, variant, placement, position, public_id, format, display_name, autoplay, active) VALUES (?1, 'video', 'small', 'gallery', ?2, ?3, ?4, ?5, 0, 1)").bind("video-" + crypto.randomUUID(), nextPosition++, video.publicId, video.format, catalogDisplayName(video.publicId)));
    existingPublicIds.add(video.publicId);
  });
  if (statements.length) await env.DB.batch(statements);
}

export async function loadContent(env: any, admin = false) {
  const items = await env.DB.prepare("SELECT * FROM content_items WHERE active = 1 ORDER BY CASE WHEN placement = 'hero' THEN 0 ELSE 1 END, position ASC, created_at ASC").all();
  const photos = await env.DB.prepare("SELECT * FROM album_photos ORDER BY content_item_id, position ASC").all();
  const photosByItem = new Map<string, any[]>();
  for (const row of photos.results || []) { const list = photosByItem.get(row.content_item_id) || []; list.push(photo(row, !admin)); photosByItem.set(row.content_item_id, list); }
  return (items.results || []).map((row: any) => {
    const albumPhotos = photosByItem.get(row.id) || [];
    const maxHeight = row.type === "video" && (row.variant === "hero" || row.variant === "video-large") ? 450 : 360;
    return { id: row.id, type: row.type, variant: row.variant, placement: row.placement, position: row.position, displayName: row.display_name, publicId: admin ? row.public_id : undefined, format: admin ? row.format : undefined, autoplay: Boolean(row.autoplay), startSeconds: Number(row.start_seconds) || 0, endTrimSeconds: Number(row.end_trim_seconds) || 0, coverMode: admin ? row.cover_mode : undefined, coverPublicId: admin ? row.cover_public_id : undefined, coverUrl: row.cover_mode === "image" && row.cover_public_id ? imageUrl(row.cover_public_id, admin ? 480 : 1280, admin ? 270 : 720, "fill") : row.public_id ? frameUrl(row.public_id, row.poster_seconds, maxHeight) : albumPhotos[0]?.thumbUrl || null, videoUrl: row.public_id && row.format ? videoUrl(row.public_id, row.format, maxHeight) : null, mobileVideoUrl: row.public_id && row.format ? videoUrl(row.public_id, row.format, row.placement === "hero" || row.variant === "video-large" ? 400 : 300) : null, photos: albumPhotos };
  });
}

export async function loadAdminContent(env: any) { return loadContent(env, true); }
