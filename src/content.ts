export type PhotoItem = { id: string; publicId: string; position: number; alt: string; thumbUrl: string; imageUrl?: string };
export type ContentItem = { id: string; type: "video" | "photo_album"; variant: "hero" | "video-large" | "small" | "album-4" | "album-9"; placement: "hero" | "gallery"; position: number; displayName: string; autoplay: boolean; startSeconds: number; endTrimSeconds: number; coverUrl: string | null; videoUrl: string | null; mobileVideoUrl: string | null; photos: PhotoItem[] };
export type ContentResponse = { hero: ContentItem | null; gallery: ContentItem[] };

function videoCloudName(publicId: string) { return publicId.startsWith("v178") ? "jtrus9f7" : "vdtm-cl"; }
export function videoUrl(publicId: string, maxHeight = 360) { return "https://res.cloudinary.com/" + videoCloudName(publicId) + "/video/upload/c_limit,h_" + maxHeight + "/f_auto/q_auto/" + publicId.split("/").map(encodeURIComponent).join("/"); }
export function frameUrl(publicId: string, seconds = 3, maxHeight = 360) { return "https://res.cloudinary.com/" + videoCloudName(publicId) + "/video/upload/so_" + seconds + "/c_limit,h_" + maxHeight + "/f_jpg/q_auto/" + publicId.split("/").map(encodeURIComponent).join("/") + ".jpg"; }

export const fallbackContent: ContentResponse = { hero: null, gallery: [] };
