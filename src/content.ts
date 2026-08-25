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
  startSeconds: number;
  endTrimSeconds: number;
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
    startSeconds: 0,
    endTrimSeconds: 0,
    coverUrl: null,
    videoUrl: videoUrl("Reel_2019_-24_f5i4bn", "mov"),
    photos: [],
  },
  gallery: [
    ["Lanchada_Panzer_-_125_años_Santiago_Wanderers_hy8fyo", "Lanchada Panzer - 125 años Santiago Wanderers"],
    ["Celebración_Ascenso_Santiago_Wanderers_-_Valparaíso_-_8_de_Diciembre_inlyti", "Celebración Ascenso Santiago Wanderers - Valparaíso - 8 de Diciembre"],
    ["Cueca_Arriba_mi_Wanderito_-_125_años_Santiago_Wanderers_fmurpk", "Cueca Arriba mi Wanderito - 125 años Santiago Wanderers"],
    ["Matrimonio_03_dlytpb", "Matrimonio 03"],
    ["Matrimonio_02_uqwst0", "Matrimonio 02"],
    ["Matrimonio_01_zzzyo0", "Matrimonio 01"],
    ["Spot_Balmaceda_-_Final_qnwlwv", "Spot Balmaceda - Final"],
    ["Cápsula_Instagram_-_Huerto_Orgánico_USM_h5eeom", "Cápsula Instagram - Huerto Orgánico USM"],
    ["Nodo_Valpo_-_Presentación_para_redes_sociales_htegjx", "Nodo Valpo - Presentación para redes sociales"],
    ["Nodo_Valpo_-_Cómo_llegar_para_redes_sociales_f1uv4g", "Nodo Valpo - Cómo llegar para redes sociales"],
    ["Adelanto_Escenacinco_vqvbw3", "Adelanto Escenacinco"],
    ["Payaso_Escenacinco_uywts3", "Payaso Escenacinco"],
    ["Monociclo_Escenacinco_scfry0", "Monociclo Escenacinco"],
    ["Manipulación_de_Balones_Escenacinco_goobog", "Manipulación de Balones Escenacinco"],
    ["Hula_Hoop_Escenacinco_frsu2w", "Hula Hoop Escenacinco"],
    ["Bautizo_Maximiliano_Andrés_jmhbdw", "Bautizo Maximiliano Andrés"],
    ["Ensamble_Comunitario_-_Casa_Ckoi_bqa6jl", "Ensamble Comunitario - Casa Ckoi"],
    ["Mercado_Puerto_de_Valparaíso_-_Reapertura_2020_e7hgjm", "Mercado Puerto de Valparaíso - Reapertura 2020"],
    ["Comedor_Comunitario_El_Olivar_Viña_del_Mar_c6dm7g", "Comedor Comunitario El Olivar Viña del Mar"],
    ["Trapecio_Fijo_Escenacinco_oed5sq", "Trapecio Fijo Escenacinco"],
    ["Clavas_Escenacinco_oynfuu", "Clavas Escenacinco"],
    ["Institucional_Sansanito_-_Punto_UTFSM_an5rhn", "Institucional Sansanito - Punto UTFSM"],
    ["Cimac_Audiciones_tsxzco", "Cimac Audiciones"],
    ["Pelotas_Escenacinco_ltupjw", "Pelotas Escenacinco"],
    ["Cerro_Tupahue_-_Santiago_-_Diciembre_2019_ntbjh2", "Cerro Tupahue - Santiago - Diciembre 2019"],
    ["Contact_Escenacinco_o4avs7", "Contact Escenacinco"],
    ["Magia_con_Cartas_Escenacinco_pzfzwg", "Magia con Cartas Escenacinco"],
    ["Acroyoga_Fest_fte3cs", "Acroyoga Fest"],
    ["Actividad_Circense_zmcnqp", "Actividad Circense"],
    ["Sombreros_Escenacinco_alfiak", "Sombreros Escenacinco"],
    ["Cuadro_Fijo_Escenacinco_lotojt", "Cuadro Fijo Escenacinco"],
    ["Valparaíso_en_imágenes_qmdbyx", "Valparaíso en imágenes"],
    ["Tela_Aérea_Escenacinco_ol9zwq", "Tela Aérea Escenacinco"],
    ["Reel_Académico_2015_-_2016_cjqx7q", "Reel Académico 2015 - 2016"],
    ["De_Barón_a_Portales_kjyndk", "De Barón a Portales"],
    ["Cajas_Escenacinco_sow9b2", "Cajas Escenacinco"],
    ["Golos_Escenacinco_kbnz8w", "Golos Escenacinco"],
    ["el_arte_transforma_la_educaciÓn_v1_720p_itt6io", "el arte transforma la educaciÓn v1 720p"],
    ["AGUSTÍN_ARIAS_-_REEL_ACADEMICO_ieqbhj", "AGUSTÍN ARIAS - REEL ACADEMICO"],
    ["CINEMAGRAPH_BHAVANI_KALI_lvcot8", "CINEMAGRAPH BHAVANI KALI"],
    ["AQMfW613_q3CWaia67pBW0dmflSSNKMvDSIDvWKnybbG7hwjgFp-1sQe1uHBWfGoL8JwsO4PDqXeQCz8yXflt41__u3ovdu", "AQMfW613 q3CWaia67pBW0dmflSSNKMvDSIDvWKnybbG7hwjgFp-1sQe1uHBWfGoL8JwsO4PDqXeQCz8yXflt41"],
    ["YEREL-compARTEVALPO_eju8bh", "YEREL · compARTEVALPO"],
    ["ESTEBAN-ALVAREZ-compARTEVALPO_kx2zar", "Esteban Álvarez · compARTEVALPO"],
    ["AGUSTÍN_-_compARTEVALPO_iik5ia", "Agustín · compARTEVALPO"],
    ["TAMARA_ARANGUIZ_-_compARTEVALPO_x7g4wm", "Tamara Aranguiz · compARTEVALPO"],
    ["JOAQUÍN_YAÑEZ_-_compARTEVALPO_n8ifyq", "Joaquín Yáñez · compARTEVALPO"],
    ["JORGE_ROJAS_-_compARTEVALPO_cwriwl", "Jorge Rojas · compARTEVALPO"],
    ["BHAVANI_KALI_compARTEVALPO_bkardo", "Bhavani Kali · compARTEVALPO"],
    ["MONGOLO_-_compARTEVALPO_xcdipt", "Mongolo · compARTEVALPO"],
  ].map(([publicId, displayName], index) => ({
    id: "video-" + (index + 1),
    type: "video" as const,
    variant: "small" as const,
    placement: "gallery" as const,
    position: index,
    displayName,
    autoplay: false,
    startSeconds: 0,
    endTrimSeconds: 0,
    coverUrl: frameUrl(publicId),
    videoUrl: videoUrl(publicId, "mp4"),
    photos: [],
  })),
};