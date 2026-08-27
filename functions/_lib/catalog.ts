export type CatalogVideo = { publicId: string; format: string };

const newCloudinaryVideos: CatalogVideo[] = [
  ["1787833089", "clip001_1"], ["1787833077", "clip001_10"], ["1787833028", "clip001_11"],
  ["1787833040", "clip001_12"], ["1787833041", "clip001_13"], ["1787833043", "clip001_14"],
  ["1787833054", "clip001_15"], ["1787833047", "clip001_16"], ["1787833087", "clip001_17"],
  ["1787833054", "clip001_18"], ["1787833056", "clip001_19"], ["1787833084", "clip001_2"],
  ["1787833083", "clip001_20"], ["1787833084", "clip001_21"], ["1787833071", "clip001_22"],
  ["1787833068", "clip001_23"], ["1787833072", "clip001_24"], ["1787833089", "clip001_25"],
  ["1787833068", "clip001_26"], ["1787833067", "clip001_27"], ["1787833034", "clip001_4"],
  ["1787833027", "clip001_3"], ["1787833097", "clip001_5"], ["1787833037", "clip001_6"],
  ["1787833042", "clip001_7"], ["1787833095", "clip001_8"],
].map(([version, publicId]) => ({ publicId: "v" + version + "/" + publicId, format: "mov" }));

export const catalogHero = newCloudinaryVideos[0];
export const catalogGallery = newCloudinaryVideos.slice(1);

export function catalogDisplayName(publicId: string) {
  const basename = publicId.split("/").pop() || publicId;
  return basename.replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}
