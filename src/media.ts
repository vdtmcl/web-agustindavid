import { localPosters } from "./posters";
import { localVideos } from "./videos";

const MEDIA_ORIGIN = "https://media.agustindavid.cl";
const UPLOAD_KEY = /^(?:preview\/)?uploads\/(?:videos\/[a-f0-9-]+\.mp4|images\/[a-f0-9-]+\.(?:jpg|jpeg|png|webp))$/i;

function mediaUrl(key: string) {
  return MEDIA_ORIGIN + "/" + key.split("/").map(encodeURIComponent).join("/");
}

export function videoUrl(publicId: string) {
  const key = localVideos[publicId];
  if (key) return mediaUrl(key);
  return UPLOAD_KEY.test(publicId) && /\/videos\//.test(publicId) ? mediaUrl(publicId) : null;
}

export function frameUrl(publicId: string, seconds = 3) {
  const source = publicId.replace(/\.[a-z0-9]+$/i, "");
  return seconds === 3 ? localPosters[source] || null : null;
}

export function imageUrl(publicId: string) {
  return UPLOAD_KEY.test(publicId) && /\/images\//.test(publicId) ? mediaUrl(publicId) : null;
}

export function imageThumbUrl(publicId: string) {
  return imageUrl(publicId);
}
