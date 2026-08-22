import { useEffect, useRef, useState, type CSSProperties } from "react";

type VideoItem = { publicId: string; format: string; poster?: string };
type OriginPoint = { x: number; y: number };
const cloudinaryBase = "https://res.cloudinary.com/vdtm-cl/video/upload";

const videos: VideoItem[] = [
  { publicId: "YEREL-compARTEVALPO_eju8bh", format: "mp4" },
  { publicId: "ESTEBAN-ALVAREZ-compARTEVALPO_kx2zar", format: "mp4" },
  { publicId: "AGUSTÍN_-_compARTEVALPO_iik5ia", format: "mp4" },
  { publicId: "TAMARA_ARANGUIZ_-_compARTEVALPO_x7g4wm", format: "mp4" },
  { publicId: "JOAQUÍN_YAÑEZ_-_compARTEVALPO_n8ifyq", format: "mp4" },
  { publicId: "JORGE_ROJAS_-_compARTEVALPO_cwriwl", format: "mp4" },
  { publicId: "BHAVANI_KALI_compARTEVALPO_bkardo", format: "mp4" },
  { publicId: "MONGOLO_-_compARTEVALPO_xcdipt", format: "mp4" },
  { publicId: "Intro_escenacinco_2018_-_escenacinco_Circo_Valparaíso_anuruu", format: "mp4" },
  { publicId: "Teaser_escenacinco_Circo_Valparaíso_gkxpud", format: "mp4" },
];
const featuredVideo: VideoItem = { publicId: "Reel_2019_-24_f5i4bn", format: "mov" };

function getPoster(video: VideoItem, seconds = 3) { return video.poster || `${cloudinaryBase}/so_${seconds},w_1280,h_720,c_fill,q_auto/${video.publicId}.jpg`; }
function getVideoUrl(video: VideoItem) { return `${cloudinaryBase}/f_${video.format},q_auto/${video.publicId}.${video.format}`; }
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
