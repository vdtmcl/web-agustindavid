export type CatalogVideo = { publicId: string; format: string };

export const catalogHero: CatalogVideo | null = null;

export const catalogGallery: CatalogVideo[] = [];

export function catalogDisplayName(publicId: string) {
  const basename = publicId.split("/").pop() || publicId;
  return basename.replace(/.[a-z0-9]+$/i, "").replace(/_/g, " ").replace(/s+/g, " ").trim();
}
