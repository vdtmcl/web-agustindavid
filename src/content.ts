export type PhotoItem = { id: string; publicId: string; position: number; alt: string; thumbUrl: string; imageUrl?: string };
export type ContentItem = { id: string; type: "video" | "photo_album"; variant: "hero" | "video-large" | "small" | "album-4" | "album-9"; placement: "hero" | "gallery"; position: number; displayName: string; autoplay: boolean; startSeconds: number; endTrimSeconds: number; coverUrl: string | null; videoUrl: string | null; mobileVideoUrl: string | null; photos: PhotoItem[] };
export type ContentResponse = { hero: ContentItem | null; gallery: ContentItem[] };

function videoCloudName(publicId: string) { return publicId.startsWith("v178") ? "jtrus9f7" : "vdtm-cl"; }
export function videoUrl(publicId: string, maxHeight = 360) { return "https://res.cloudinary.com/" + videoCloudName(publicId) + "/video/upload/c_limit,h_" + maxHeight + "/f_auto/q_auto/" + publicId.split("/").map(encodeURIComponent).join("/"); }
export function frameUrl(publicId: string, seconds = 3, maxHeight = 360) { const source = publicId.replace(/\.[a-z0-9]+$/i, "");
  return "https://res.cloudinary.com/" + videoCloudName(publicId) + "/video/upload/so_" + seconds + "/c_limit,h_" + maxHeight + "/f_jpg/q_auto/" + source.split("/").map(encodeURIComponent).join("/") + ".jpg"; }

const videos = [
  ["1788143277", "clip-compartevalpo-agustindavid-07"],
  ["1788143263", "clip-compartevalpo-agustindavid-01"],
  ["1788143277", "clip-compartevalpo-agustindavid-05"],
  ["1788143276", "clip-compartevalpo-agustindavid-04"],
  ["1788143275", "clip-compartevalpo-agustindavid-09"],
  ["1788143267", "clip-compartevalpo-agustindavid-08"],
  ["1788143266", "clip-compartevalpo-agustindavid-06"],
  ["1788143266", "clip-compartevalpo-agustindavid-03"],
  ["1788143263", "clip-compartevalpo-agustindavid-02"],
  ["1787833089", "clip001_1"],
  ["1787833084", "clip001_2"],
  ["1787833027", "clip001_3"],
  ["1787833034", "clip001_4"],
  ["1787833097", "clip001_5"],
  ["1787833037", "clip001_6"],
  ["1787833042", "clip001_7"],
  ["1787833095", "clip001_8"],
  ["1787833090", "clip001_9"],
  ["1787833077", "clip001_10"],
  ["1787833028", "clip001_11"],
  ["1787833040", "clip001_12"],
  ["1787833041", "clip001_13"],
  ["1787833043", "clip001_14"],
  ["1787833054", "clip001_15"],
  ["1787833047", "clip001_16"],
  ["1787833087", "clip001_17"],
  ["1787833054", "clip001_18"],
  ["1787833056", "clip001_19"],
  ["1787833083", "clip001_20"],
  ["1787833084", "clip001_21"],
  ["1787833071", "clip001_22"],
  ["1787833068", "clip001_23"],
  ["1787833072", "clip001_24"],
  ["1787833089", "clip001_25"],
  ["1787833068", "clip001_26"],
  ["1787833067", "clip001_27"],
].map(([version, name]) => ({ publicId: "v" + version + "/" + name, name }));
function contentItem(publicId: string, displayName: string, position: number, placement: "hero" | "gallery"): ContentItem { return { id: placement === "hero" ? "hero-existing" : "video-" + position, type: "video", variant: placement === "hero" ? "hero" : "small", placement, position, displayName, autoplay: placement === "hero", startSeconds: 0, endTrimSeconds: 0, coverUrl: frameUrl(publicId, 3, placement === "hero" ? 480 : 360), videoUrl: videoUrl(publicId, placement === "hero" ? 480 : 360), mobileVideoUrl: videoUrl(publicId, placement === "hero" ? 360 : 240), photos: [] }; }
export const fallbackContent: ContentResponse = { hero: contentItem(videos[0].publicId, videos[0].name, 0, "hero"), gallery: videos.slice(1).map((video, index) => contentItem(video.publicId, video.name, index, "gallery")) };
