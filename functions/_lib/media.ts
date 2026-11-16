const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function mediaPrefix(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "web-agustindavid.pages.dev" || hostname.endsWith(".agustindavid.cl") ? "" : "preview/";
}

function cacheMetadata(contentType: string) {
  return { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } };
}

export async function storeImage(file: File, env: any, request: Request) {
  if (!env.MEDIA) throw new Error("El almacenamiento multimedia no está configurado.");
  const extension = IMAGE_TYPES[file.type];
  if (!extension) throw new Error("La imagen debe ser JPG, PNG o WebP.");
  const key = mediaPrefix(request) + "uploads/images/" + crypto.randomUUID() + "." + extension;
  await env.MEDIA.put(key, file.stream(), cacheMetadata(file.type));
  return key;
}

export async function storeVideo(file: File, env: any, request: Request) {
  if (!env.MEDIA) throw new Error("El almacenamiento multimedia no está configurado.");
  const key = mediaPrefix(request) + "uploads/videos/" + crypto.randomUUID() + ".mp4";
  await env.MEDIA.put(key, file.stream(), cacheMetadata("video/mp4"));
  return key;
}

export async function removeStoredMedia(env: any, key: string | null) {
  if (key && env.MEDIA) await env.MEDIA.delete(key);
}
