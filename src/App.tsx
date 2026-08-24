import { useEffect, useRef, useState, type CSSProperties } from "react";

type VideoItem = { publicId: string; format: string; poster?: string };
type OriginPoint = { x: number; y: number };
const cloudinaryBase = "https://res.cloudinary.com/vdtm-cl/video/upload";

const videos: VideoItem[] = [
  { publicId: "Lanchada_Panzer_-_125_años_Santiago_Wanderers_hy8fyo", format: "mp4" },
  { publicId: "Celebración_Ascenso_Santiago_Wanderers_-_Valparaíso_-_8_de_Diciembre_inlyti", format: "mp4" },
  { publicId: "Cueca_Arriba_mi_Wanderito_-_125_años_Santiago_Wanderers_fmurpk", format: "mp4" },
  { publicId: "Matrimonio_03_dlytpb", format: "mov" },
  { publicId: "Matrimonio_02_uqwst0", format: "mov" },
  { publicId: "Matrimonio_01_zzzyo0", format: "mov" },
  { publicId: "Spot_Balmaceda_-_Final_qnwlwv", format: "mp4" },
  { publicId: "Cápsula_Instagram_-_Huerto_Orgánico_USM_h5eeom", format: "mp4" },
  { publicId: "Nodo_Valpo_-_Presentación_para_redes_sociales_htegjx", format: "mp4" },
  { publicId: "Nodo_Valpo_-_Cómo_llegar_para_redes_sociales_f1uv4g", format: "mp4" },
  { publicId: "Adelanto_Escenacinco_vqvbw3", format: "mp4" },
  { publicId: "Payaso_Escenacinco_uywts3", format: "mov" },
  { publicId: "Monociclo_Escenacinco_scfry0", format: "mp4" },
  { publicId: "Manipulación_de_Balones_Escenacinco_goobog", format: "mp4" },
  { publicId: "Hula_Hoop_Escenacinco_frsu2w", format: "mov" },
  { publicId: "Bautizo_Maximiliano_Andrés_jmhbdw", format: "mp4" },
  { publicId: "Ensamble_Comunitario_-_Casa_Ckoi_bqa6jl", format: "mp4" },
  { publicId: "Mercado_Puerto_de_Valparaíso_-_Reapertura_2020_e7hgjm", format: "mp4" },
  { publicId: "Comedor_Comunitario_El_Olivar_Viña_del_Mar_c6dm7g", format: "mp4" },
  { publicId: "Trapecio_Fijo_Escenacinco_oed5sq", format: "mp4" },
  { publicId: "Clavas_Escenacinco_oynfuu", format: "mp4" },
  { publicId: "Institucional_Sansanito_-_Punto_UTFSM_an5rhn", format: "mp4" },
  { publicId: "Cimac_Audiciones_tsxzco", format: "mp4" },
  { publicId: "Pelotas_Escenacinco_ltupjw", format: "mp4" },
  { publicId: "Cerro_Tupahue_-_Santiago_-_Diciembre_2019_ntbjh2", format: "mp4" },
  { publicId: "Contact_Escenacinco_o4avs7", format: "mp4" },
  { publicId: "Magia_con_Cartas_Escenacinco_pzfzwg", format: "mp4" },
  { publicId: "Acroyoga_Fest_fte3cs", format: "mp4" },
  { publicId: "Actividad_Circense_zmcnqp", format: "mp4" },
  { publicId: "Sombreros_Escenacinco_alfiak", format: "mp4" },
  { publicId: "Cuadro_Fijo_Escenacinco_lotojt", format: "mp4" },
  { publicId: "Valparaíso_en_imágenes_qmdbyx", format: "mp4" },
  { publicId: "Tela_Aérea_Escenacinco_ol9zwq", format: "mp4" },
  { publicId: "Reel_Académico_2015_-_2016_cjqx7q", format: "mp4" },
  { publicId: "De_Barón_a_Portales_kjyndk", format: "mp4" },
  { publicId: "Cajas_Escenacinco_sow9b2", format: "mp4" },
  { publicId: "Golos_Escenacinco_kbnz8w", format: "mp4" },
  { publicId: "el_arte_transforma_la_educaciÓn_v1_720p_itt6io", format: "mp4" },
  { publicId: "AGUSTÍN_ARIAS_-_REEL_ACADEMICO_ieqbhj", format: "mp4" },
  { publicId: "CINEMAGRAPH_BHAVANI_KALI_lvcot8", format: "mp4" },
  { publicId: "AQMfW613_q3CWaia67pBW0dmflSSNKMvDSIDvWKnybbG7hwjgFp-1sQe1uHBWfGoL8JwsO4PDqXeQCz8yXflt41__u3ovdu", format: "mp4" },
  { publicId: "YEREL-compARTEVALPO_eju8bh", format: "mp4" },
  { publicId: "ESTEBAN-ALVAREZ-compARTEVALPO_kx2zar", format: "mp4" },
  { publicId: "AGUSTÍN_-_compARTEVALPO_iik5ia", format: "mp4" },
  { publicId: "TAMARA_ARANGUIZ_-_compARTEVALPO_x7g4wm", format: "mp4" },
  { publicId: "JOAQUÍN_YAÑEZ_-_compARTEVALPO_n8ifyq", format: "mp4" },
  { publicId: "JORGE_ROJAS_-_compARTEVALPO_cwriwl", format: "mp4" },
  { publicId: "BHAVANI_KALI_compARTEVALPO_bkardo", format: "mp4" },
  { publicId: "MONGOLO_-_compARTEVALPO_xcdipt", format: "mp4" },
];
const featuredVideo: VideoItem = { publicId: "Reel_2019_-24_f5i4bn", format: "mov" };

function encodePublicId(publicId: string) { return publicId.split("/").map(encodeURIComponent).join("/"); }
function getPoster(video: VideoItem, seconds = 3) { return video.poster || `${cloudinaryBase}/so_${seconds},w_1280,h_720,c_fill,q_auto/${encodePublicId(video.publicId)}.jpg`; }
function getVideoUrl(video: VideoItem) { return `${cloudinaryBase}/f_mp4,q_auto/${encodePublicId(video.publicId)}.mp4`; }
function getOrigin(element: HTMLVideoElement) { const rect = element.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; }

function FeaturedVideo({ video, onExpand }: { video: VideoItem; onExpand: (video: VideoItem, origin: OriginPoint) => void }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startAtEight = () => { const player = videoRef.current; if (!player) return; player.currentTime = player.duration > 8 ? 8 : 0; };
  const togglePlayback = () => { const player = videoRef.current; if (!player) return; if (player.paused) void player.play(); else player.pause(); };
  const replayFromEight = () => { startAtEight(); void videoRef.current?.play(); };
  return <section className="featured" aria-label="Video destacado"><div className="video-frame featured-frame"><video ref={videoRef} autoPlay muted playsInline preload="auto" src={getVideoUrl(video)} onLoadedMetadata={startAtEight} onEnded={replayFromEight} onClick={togglePlayback} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} aria-label="Video destacado sin sonido" />{isPlaying && <button className="expand-button" type="button" onClick={() => { if (videoRef.current) { const origin = getOrigin(videoRef.current); videoRef.current.pause(); setIsPlaying(false); onExpand(video, origin); } }} aria-label="Expandir video">⤢</button>}</div><div className="featured-copy"><div className="featured-slide"><h1>Agustín David</h1><p>Realizador Audiovisual en Valparaíso</p></div></div></section>;
}

function VideoCard({ video, onExpand }: { video: VideoItem; onExpand: (video: VideoItem, origin: OriginPoint) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const togglePlayback = () => { const player = videoRef.current; if (!player) return; if (player.paused) void player.play(); else player.pause(); };
  return <article className="video-card"><div className="video-frame">{isPlaying ? <><video ref={videoRef} autoPlay loop muted playsInline preload="metadata" poster={getPoster(video)} src={getVideoUrl(video)} onClick={togglePlayback} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} aria-label="Video sin sonido" /><button className="expand-button" type="button" onClick={() => { if (videoRef.current) { const origin = getOrigin(videoRef.current); videoRef.current.pause(); setIsPlaying(false); onExpand(video, origin); } }} aria-label="Expandir video">⤢</button></> : <button className="video-poster" type="button" onClick={() => setIsPlaying(true)} aria-label="Reproducir video"><img src={getPoster(video)} alt="Portada del video" loading="lazy" /></button>}</div></article>;
}

function VideoLightbox({ video, origin, onClose }: { video: VideoItem; origin: OriginPoint; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const requestClose = () => { if (isClosing) return; setIsClosing(true); window.setTimeout(onClose, 900); };
  useEffect(() => { const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose(); }; document.addEventListener("keydown", handleKeyDown); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; }; });
  const togglePlayback = () => { const player = videoRef.current; if (!player) return; if (player.paused) void player.play(); else player.pause(); };
  const seek = (value: string) => { const player = videoRef.current; if (!player || !player.duration) return; player.currentTime = (Number(value) / 100) * player.duration; setProgress(Number(value)); };
  const style = { "--origin-x": `${origin.x}px`, "--origin-y": `${origin.y}px` } as CSSProperties;
  return <div className={`lightbox ${isClosing ? "is-closing" : ""}`} style={style} role="dialog" aria-modal="true" aria-label="Video ampliado" onClick={requestClose}><div className="lightbox-video-shell" onClick={(event) => event.stopPropagation()}><button className="lightbox-close" type="button" onClick={requestClose} aria-label="Cerrar video">×</button><video ref={videoRef} autoPlay loop muted playsInline preload="metadata" poster={video.publicId === featuredVideo.publicId ? undefined : getPoster(video, 3)} src={getVideoUrl(video)} onClick={togglePlayback} onTimeUpdate={(event) => { const player = event.currentTarget; setProgress(player.duration ? (player.currentTime / player.duration) * 100 : 0); }} aria-label="Video ampliado sin sonido" /><input className="timeline" type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => seek(event.target.value)} aria-label="Línea de tiempo del video" /></div></div>;
}

function App() {
  const [textPanel, setTextPanel] = useState<"about" | "contact" | null>(null);
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<{ video: VideoItem; origin: OriginPoint } | null>(null);
  const requestClosePanel = () => { if (isClosingPanel) return; setIsClosingPanel(true); window.setTimeout(() => { setTextPanel(null); setIsClosingPanel(false); }, 900); };
  return <main className="site-shell"><header className="site-header"><nav aria-label="Navegación principal"><button type="button" onClick={() => { setIsClosingPanel(false); setTextPanel("about"); }}>Acerca de</button><button type="button" onClick={() => { setIsClosingPanel(false); setTextPanel("contact"); }}>Contacto</button></nav></header><div className="intro-spacer" /><FeaturedVideo video={featuredVideo} onExpand={(video, origin) => setExpandedVideo({ video, origin })} /><section className="video-gallery" aria-label="Archivo audiovisual">{videos.map((video) => <VideoCard key={video.publicId} video={video} onExpand={(item, origin) => setExpandedVideo({ video: item, origin })} />)}</section><footer className="site-footer"><span>Agustín David · Realizador Audiovisual</span><button type="button" onClick={() => { setIsClosingPanel(false); setTextPanel("contact"); }}>hola@agustindavid.cl</button></footer>{expandedVideo && <VideoLightbox video={expandedVideo.video} origin={expandedVideo.origin} onClose={() => setExpandedVideo(null)} />}{textPanel && <div className={`modal-backdrop ${isClosingPanel ? "is-closing" : ""}`} role="presentation" onClick={requestClosePanel}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={requestClosePanel} aria-label="Cerrar ficha">×</button><p className="eyebrow">{textPanel === "about" ? "Acerca de" : "Contacto"}</p><h2 id="modal-title">{textPanel === "about" ? "Registro artístico desde 2015." : "Hablemos de una próxima historia."}</h2><p>{textPanel === "about" ? "Agustín David es realizador audiovisual. Desde Valparaíso desarrolla un archivo vivo de talentos, escenas y expresiones que construyen el territorio." : "Para proyectos audiovisuales, registros artísticos y colaboraciones, escribe a hola@agustindavid.cl. Cuéntame qué quieres mirar y contar."}</p></section></div>}</main>;
}

export default App;
