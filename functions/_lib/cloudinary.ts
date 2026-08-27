function path(publicId: string) {
  return publicId.split("/").map(encodeURIComponent).join("/");
}

const videoCloudName = "jtrus9f7";

export function videoUrl(publicId: string, _format: string, maxHeight = 360) {
  return "https://res.cloudinary.com/" + videoCloudName + "/video/upload/c_limit,h_" + maxHeight + "/f_auto/q_auto/" + path(publicId);
}

export function frameUrl(publicId: string, seconds = 3, maxHeight = 360) {
  return "https://res.cloudinary.com/" + videoCloudName + "/video/upload/so_" + seconds + "/c_limit,h_" + maxHeight + "/f_jpg/q_auto/" + path(publicId) + ".jpg";
}

export function imageUrl(publicId: string, width = 1920, height = 1080, crop = "limit") {
  return "https://res.cloudinary.com/vdtm-cl/image/upload/w_" + width + ",h_" + height + ",c_" + crop + ",q_auto,f_auto/" + path(publicId);
}

export function imageThumbUrl(publicId: string) {
  return "https://res.cloudinary.com/vdtm-cl/image/upload/w_420,h_280,c_fill,q_auto,f_auto/" + path(publicId);
}
