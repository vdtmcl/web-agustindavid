import { frameUrl, imageThumbUrl, imageUrl, videoUrl } from "../../src/media";

function photo(row: any, full: boolean) {
  return { id: row.id, publicId: row.public_id, position: row.position, alt: row.alt_text || row.public_id, thumbUrl: imageThumbUrl(row.public_id), imageUrl: full ? imageUrl(row.public_id) : undefined };
}

export async function loadContent(env: any, admin = false) {
  const items = await env.DB.prepare("SELECT * FROM content_items WHERE active = 1 ORDER BY CASE WHEN placement = 'hero' THEN 0 ELSE 1 END, position ASC, created_at ASC").all();
  const photos = await env.DB.prepare("SELECT * FROM album_photos ORDER BY content_item_id, position ASC").all();
  const photosByItem = new Map<string, any[]>();
  for (const row of photos.results || []) { const list = photosByItem.get(row.content_item_id) || []; list.push(photo(row, !admin)); photosByItem.set(row.content_item_id, list); }
  return (items.results || []).map((row: any) => {
    const albumPhotos = photosByItem.get(row.id) || [];
    const coverUrl = row.cover_mode === "image" && row.cover_public_id
      ? imageUrl(row.cover_public_id)
      : row.public_id
        ? frameUrl(row.public_id, row.poster_seconds)
        : albumPhotos[0]?.thumbUrl || null;
    const source = row.public_id && row.format ? videoUrl(row.public_id) : null;
    return { id: row.id, type: row.type, variant: row.variant, placement: row.placement, position: row.position, displayName: row.display_name, publicId: admin ? row.public_id : undefined, format: admin ? row.format : undefined, autoplay: Boolean(row.autoplay), startSeconds: Number(row.start_seconds) || 0, endTrimSeconds: Number(row.end_trim_seconds) || 0, coverMode: admin ? row.cover_mode : undefined, coverPublicId: admin ? row.cover_public_id : undefined, coverUrl: coverUrl || albumPhotos[0]?.thumbUrl || null, videoUrl: source, mobileVideoUrl: source, photos: albumPhotos };
  });
}

export async function loadAdminContent(env: any) { return loadContent(env, true); }
