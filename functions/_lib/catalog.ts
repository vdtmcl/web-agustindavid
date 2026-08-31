export type CatalogVideo = { publicId: string; format: string };

export const catalogHero: CatalogVideo = { publicId: "v1787833089/clip001_1", format: "mov" };

export const catalogGallery: CatalogVideo[] = [
  { publicId: "v1787833084/clip001_2", format: "mov" },
  { publicId: "v1787833027/clip001_3", format: "mov" },
  { publicId: "v1787833034/clip001_4", format: "mov" },
  { publicId: "v1787833097/clip001_5", format: "mov" },
  { publicId: "v1787833037/clip001_6", format: "mov" },
  { publicId: "v1787833042/clip001_7", format: "mov" },
  { publicId: "v1787833095/clip001_8", format: "mov" },
  { publicId: "v1787833090/clip001_9", format: "mov" },
  { publicId: "v1787833077/clip001_10", format: "mov" },
  { publicId: "v1787833028/clip001_11", format: "mov" },
  { publicId: "v1787833040/clip001_12", format: "mov" },
  { publicId: "v1787833041/clip001_13", format: "mov" },
  { publicId: "v1787833043/clip001_14", format: "mov" },
  { publicId: "v1787833054/clip001_15", format: "mov" },
  { publicId: "v1787833047/clip001_16", format: "mov" },
  { publicId: "v1787833087/clip001_17", format: "mov" },
  { publicId: "v1787833054/clip001_18", format: "mov" },
  { publicId: "v1787833056/clip001_19", format: "mov" },
  { publicId: "v1787833083/clip001_20", format: "mov" },
  { publicId: "v1787833084/clip001_21", format: "mov" },
  { publicId: "v1787833071/clip001_22", format: "mov" },
  { publicId: "v1787833068/clip001_23", format: "mov" },
  { publicId: "v1787833072/clip001_24", format: "mov" },
  { publicId: "v1787833089/clip001_25", format: "mov" },
  { publicId: "v1787833068/clip001_26", format: "mov" },
  { publicId: "v1787833067/clip001_27", format: "mov" },
  { publicId: "v1788143263/clip-compartevalpo-agustindavid-01.mp4", format: "mp4" },
  { publicId: "v1788143277/clip-compartevalpo-agustindavid-05.mp4", format: "mp4" },
  { publicId: "v1788143277/clip-compartevalpo-agustindavid-07.mp4", format: "mp4" },
  { publicId: "v1788143276/clip-compartevalpo-agustindavid-04.mp4", format: "mp4" },
  { publicId: "v1788143275/clip-compartevalpo-agustindavid-09.mp4", format: "mp4" },
  { publicId: "v1788143267/clip-compartevalpo-agustindavid-08.mp4", format: "mp4" },
  { publicId: "v1788143266/clip-compartevalpo-agustindavid-06.mp4", format: "mp4" },
  { publicId: "v1788143266/clip-compartevalpo-agustindavid-03.mp4", format: "mp4" },
  { publicId: "v1788143263/clip-compartevalpo-agustindavid-02.mp4", format: "mp4" },
];

export function catalogDisplayName(publicId: string) {
  const basename = publicId.split("/").pop() || publicId;
  return basename.replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
}