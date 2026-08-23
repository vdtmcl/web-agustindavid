import { frameUrl, imageThumbUrl, imageUrl, videoUrl } from "./cloudinary";

function photo(row: any, full: boolean) {
  return {
    id: row.id,
    publicId: row.public_id,
    position: row.position,
    alt: row.alt_text || row.public_id,
    thumbUrl: imageThumbUrl(row.public_id),
    imageUrl: full ? imageUrl(row.public_id) : undefined,
  };
}

export async function loadContent(env: any, admin = false) {
  const items = await env.DB.prepare("SELECT * FROM content_items WHERE active = 1 ORDER BY CASE WHEN placement = 'hero' THEN 0 ELSE 1 END, position ASC, created_at ASC").all();
  const photos = await env.DB.prepare("SELECT * FROM album_photos ORDER BY content_item_id, position ASC").all();
  const photosByItem = new Map<string, any[]>();
  for (const row of photos.results || []) {
    const list = photosByItem.get(row.content_item_id) || [];
    list.push(photo(row, !admin));
    photosByItem.set(row.content_item_id, list);
  }
  return (items.results || []).map((row: any) => {
    const albumPhotos = photosByItem.get(row.id) || [];
    return {
      id: row.id,
      type: row.type,
      variant: row.variant,
      placement: row.placement,
      position: row.position,
      displayName: row.display_name,
      publicId: admin ? row.public_id : undefined,
      format: admin ? row.format : undefined,
      autoplay: Boolean(row.autoplay),
      coverMode: admin ? row.cover_mode : undefined,
      coverPublicId: admin ? row.cover_public_id : undefined,
      coverUrl: row.cover_mode === "image" && row.cover_public_id ? imageUrl(row.cover_public_id, admin ? 480 : 1280, admin ? 270 : 720, "fill") : row.public_id ? frameUrl(row.public_id, row.poster_seconds) : albumPhotos[0]?.thumbUrl || null,
      videoUrl: row.public_id && row.format ? videoUrl(row.public_id, row.format) : null,
      photos: albumPhotos,
    };
  });
}

export async function loadAdminContent(env: any) {
  return loadContent(env, true);
}