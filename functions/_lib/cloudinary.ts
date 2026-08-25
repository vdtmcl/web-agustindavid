function path(publicId: string) {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

export function videoUrl(publicId: string, format: string) {
  return "https://res.cloudinary.com/vdtm-cl/video/upload/f_" + format + ",q_auto/" + path(publicId) + "." + format;
}

export function frameUrl(publicId: string, seconds = 3) {
  return "https://res.cloudinary.com/vdtm-cl/video/upload/so_" + seconds + ",w_1280,h_720,c_fill,q_auto/" + path(publicId) + ".jpg";
}

export function imageUrl(publicId: string, width = 1920, height = 1080, crop = "limit") {
  return "https://res.cloudinary.com/vdtm-cl/image/upload/w_" + width + ",h_" + height + ",c_" + crop + ",q_auto,f_auto/" + path(publicId);
}

export function imageThumbUrl(publicId: string) {
  return "https://res.cloudinary.com/vdtm-cl/image/upload/w_420,h_280,c_fill,q_auto,f_auto/" + path(publicId);
}

async function sha1(value: string) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function uploadImage(file: File, env: any, folder: string) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("Cloudinary no está configurado.");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = crypto.randomUUID();
  const signature = await sha1("folder=" + folder + "&public_id=" + publicId + "&timestamp=" + timestamp + env.CLOUDINARY_API_SECRET);
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", env.CLOUDINARY_API_KEY);
  form.set("timestamp", timestamp);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("signature", signature);
  const response = await fetch("https://api.cloudinary.com/v1_1/" + env.CLOUDINARY_CLOUD_NAME + "/image/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error("Cloudinary rechazó la imagen.");
  const result = await response.json() as { public_id?: string };
  if (!result.public_id) throw new Error("Cloudinary no devolvió la imagen.");
  return result.public_id;
}