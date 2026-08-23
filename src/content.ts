export type PhotoItem = {
  id: string;
  publicId: string;
  position: number;
  alt: string;
  thumbUrl: string;
  imageUrl?: string;
};

export type ContentItem = {
  id: string;
  type: "video" | "photo_album";
  variant: "hero" | "video-large" | "small" | "album-4" | "album-9";
  placement: "hero" | "gallery";
  position: number;
  displayName: string;
  autoplay: boolean;
  coverUrl: string | null;
  videoUrl: string | null;
  photos: PhotoItem[];
};

export type ContentResponse = { hero: ContentItem | null; gallery: ContentItem[] };

const videoBase = "https://res.cloudinary.com/vdtm-cl/video/upload";

export function videoUrl(publicId: string, format: string) {
  return videoBase + "/f_" + format + ",q_auto/" + publicId.split("/").map(encodeURIComponent).join("/") + "." + format;
}

export function frameUrl(publicId: string, seconds = 3) {
  return videoBase + "/so_" + seconds + ",w_1280,h_720,c_fill,q_auto/" + publicId.split("/").map(encodeURIComponent).join("/") + ".jpg";
}

export const fallbackContent: ContentResponse = {
  hero: {
    id: "hero-reel-2019",
    type: "video",
    variant: "hero",
    placement: "hero",
    position: 0,
    displayName: "Reel Artístico 2019 Agustín David",
    autoplay: true,
    coverUrl: null,
    videoUrl: videoUrl("Reel_2019_-24_f5i4bn", "mov"),
    photos: [],
  },
  gallery: [
    ["YEREL-compARTEVALPO_eju8bh", "YEREL · compARTEVALPO"],
    ["ESTEBAN-ALVAREZ-compARTEVALPO_kx2zar", "Esteban Álvarez · compARTEVALPO"],
    ["AGUSTÍN_-_compARTEVALPO_iik5ia", "Agustín · compARTEVALPO"],
    ["TAMARA_ARANGUIZ_-_compARTEVALPO_x7g4wm", "Tamara Aranguiz · compARTEVALPO"],
    ["JOAQUÍN_YAÑEZ_-_compARTEVALPO_n8ifyq", "Joaquín Yáñez · compARTEVALPO"],
    ["JORGE_ROJAS_-_compARTEVALPO_cwriwl", "Jorge Rojas · compARTEVALPO"],
    ["BHAVANI_KALI_compARTEVALPO_bkardo", "Bhavani Kali · compARTEVALPO"],
    ["MONGOLO_-_compARTEVALPO_xcdipt", "Mongolo · compARTEVALPO"],
    ["Intro_escenacinco_2018_-_escenacinco_Circo_Valparaíso_anuruu", "Intro Escenacinco 2018"],
    ["Teaser_escenacinco_Circo_Valparaíso_gkxpud", "Teaser Escenacinco"],
  ].map(([publicId, displayName], index) => ({
    id: "video-" + (index + 1),
    type: "video" as const,
    variant: "small" as const,
    placement: "gallery" as const,
    position: index,
    displayName,
    autoplay: false,
    coverUrl: frameUrl(publicId),
    videoUrl: videoUrl(publicId, "mp4"),
    photos: [],
  })),
};