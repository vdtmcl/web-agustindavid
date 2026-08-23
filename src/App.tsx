import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { fallbackContent, type ContentItem, type ContentResponse } from "./content";

type Origin = { x: number; y: number };

function originOf(element: HTMLElement): Origin {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function useVisibleAutoplay(ref: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void video.play().catch(() => undefined);
      else video.pause();
    }, { threshold: 0.45 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [ref, enabled]);
}

function FeaturedVideo({ item, onExpand }: { item: ContentItem; onExpand: (item: ContentItem, origin: Origin) => void }) {
  const [playing, setPlaying] = useState(item.autoplay);
  const ref = useRef<HTMLVideoElement>(null);
  const start = () => {
    const video = ref.current;
    if (!video || !item.autoplay) return;
    video.currentTime = video.duration > 8 ? 8 : 0;
    void video.play().catch(() => undefined);
  };
  return <section className="featured" aria-label="Video destacado"><div className="video-frame featured-frame"><video ref={ref} autoPlay={item.autoplay} muted playsInline preload="auto" poster={item.coverUrl || undefined} src={item.videoUrl || undefined} onLoadedMetadata={start} onEnded={start} onClick={() => { const video = ref.current; if (!video) return; if (video.paused) void video.play(); else video.pause(); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="Video destacado sin sonido" />{playing && <button className="expand-button" type="button" onClick={() => { if (ref.current) { const point = originOf(ref.current); ref.current.pause(); setPlaying(false); onExpand(item, point); } }} aria-label="Expandir video">⤢</button>}</div><div className="featured-copy"><div className="featured-slide"><h1>Agustín David</h1><p>Realizador Audiovisual en Valparaíso</p></div></div></section>;
}

function VideoCard({ item, onExpand }: { item: ContentItem; onExpand: (item: ContentItem, origin: Origin) => void }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useVisibleAutoplay(ref, item.autoplay);
  const large = item.variant === "video-large";
  return <article className={"video-card " + (large ? "video-card-large" : "")}><div className="video-frame">{playing || item.autoplay ? <><video ref={ref} autoPlay={item.autoplay} loop muted playsInline preload={item.autoplay ? "metadata" : "none"} poster={item.coverUrl || undefined} src={item.videoUrl || undefined} onClick={() => { const video = ref.current; if (!video) return; if (video.paused) void video.play(); else video.pause(); }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label={item.displayName + " sin sonido"} /><button className="expand-button" type="button" onClick={() => { if (ref.current) { const point = originOf(ref.current); ref.current.pause(); setPlaying(false); onExpand(item, point); } }} aria-label="Expandir video">⤢</button></> : <button className="video-poster" type="button" onClick={() => setPlaying(true)} aria-label={"Reproducir " + item.displayName}><img src={item.coverUrl || ""} alt="Portada del video" loading="lazy" /></button>}</div></article>;
}

function PhotoCard({ item, onExpand }: { item: ContentItem; onExpand: (item: ContentItem) => void }) {
  const cover = item.coverUrl || item.photos[0]?.thumbUrl;
  return <article className="video-card photo-card"><div className="video-frame"><button className="video-poster" type="button" onClick={() => onExpand(item)} aria-label={"Abrir " + item.displayName}>{cover ? <img src={cover} alt="Portada del álbum" loading="lazy" /> : <span className="empty-media">Álbum pendiente</span>}<span className="photo-count">{item.photos.length} fotos</span></button></div></article>;
}

function VideoLightbox({ item, origin, onClose }: { item: ContentItem; origin: Origin; onClose: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const close = () => { if (closing) return; setClosing(true); window.setTimeout(onClose, 700); };
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); }; document.addEventListener("keydown", key); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", key); document.body.style.overflow = ""; }; });
  const style = { "--origin-x": origin.x + "px", "--origin-y": origin.y + "px" } as CSSProperties;
  return <div className={"lightbox " + (closing ? "is-closing" : "")} style={style} onClick={close} role="dialog" aria-modal="true"><div className="lightbox-video-shell" onClick={(event) => event.stopPropagation()}><button className="lightbox-close" type="button" onClick={close} aria-label="Cerrar video">×</button><video ref={ref} autoPlay loop muted playsInline preload="metadata" poster={item.coverUrl || undefined} src={item.videoUrl || undefined} onTimeUpdate={(event) => setProgress(event.currentTarget.duration ? event.currentTarget.currentTime / event.currentTarget.duration * 100 : 0)} aria-label={item.displayName} /><input className="timeline" type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => { const video = ref.current; if (video?.duration) video.currentTime = Number(event.target.value) / 100 * video.duration; }} aria-label="Línea de tiempo" /></div></div>;
}

function PhotoLightbox({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const [selected, setSelected] = useState(0);
  const [closing, setClosing] = useState(false);
  const close = () => { if (closing) return; setClosing(true); window.setTimeout(onClose, 300); };
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "ArrowRight") setSelected((index) => Math.min(index + 1, item.photos.length - 1)); if (event.key === "ArrowLeft") setSelected((index) => Math.max(index - 1, 0)); }; document.addEventListener("keydown", key); document.body.style.overflow = "hidden"; return () => { document.removeEventListener("keydown", key); document.body.style.overflow = ""; }; });
  const photo = item.photos[selected];
  return <div className={"photo-lightbox " + (closing ? "is-closing" : "")} onClick={close} role="dialog" aria-modal="true"><section className="photo-lightbox-panel" onClick={(event) => event.stopPropagation()}><button className="lightbox-close" type="button" onClick={close} aria-label="Cerrar álbum">×</button><div className="photo-preview">{photo ? <img src={photo.imageUrl || photo.thumbUrl} alt={photo.alt} /> : <span className="empty-media">Este álbum aún no tiene fotografías.</span>}</div><div className={"photo-thumbnails " + (item.variant === "album-9" ? "photo-thumbnails-large" : "photo-thumbnails-small")}>{item.photos.map((entry, index) => <button className={index === selected ? "is-selected" : ""} key={entry.id} type="button" onClick={() => setSelected(index)}><img src={entry.thumbUrl} alt={entry.alt} loading="lazy" /></button>)}</div><p className="photo-lightbox-title">{item.displayName}</p></section></div>;
}

function App() {
  const [content, setContent] = useState<ContentResponse>(fallbackContent);
  const [panel, setPanel] = useState<"about" | "contact" | null>(null);
  const [closingPanel, setClosingPanel] = useState(false);
  const [expanded, setExpanded] = useState<{ item: ContentItem; origin?: Origin } | null>(null);
  useEffect(() => { fetch("/api/videos", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(new Error("API"))).then((data: ContentResponse) => { if (data?.hero || data?.gallery) setContent(data); }).catch(() => undefined); }, []);
  const closePanel = () => { if (closingPanel) return; setClosingPanel(true); window.setTimeout(() => { setPanel(null); setClosingPanel(false); }, 700); };
  return <main className="site-shell"><header className="site-header"><nav aria-label="Navegación principal"><button type="button" onClick={() => { setClosingPanel(false); setPanel("about"); }}>Acerca de</button><button type="button" onClick={() => { setClosingPanel(false); setPanel("contact"); }}>Contacto</button></nav></header><div className="intro-spacer" />{content.hero && <FeaturedVideo item={content.hero} onExpand={(item, origin) => setExpanded({ item, origin })} />}<section className="video-gallery" aria-label="Archivo audiovisual">{content.gallery.map((item) => item.type === "photo_album" ? <PhotoCard key={item.id} item={item} onExpand={(album) => setExpanded({ item: album })} /> : <VideoCard key={item.id} item={item} onExpand={(video, origin) => setExpanded({ item: video, origin })} />)}</section><footer className="site-footer"><span>Agustín David · Realizador Audiovisual</span><button type="button" onClick={() => { setClosingPanel(false); setPanel("contact"); }}>hola@agustindavid.cl</button></footer>{expanded?.item.type === "photo_album" && <PhotoLightbox item={expanded.item} onClose={() => setExpanded(null)} />}{expanded?.item.type === "video" && <VideoLightbox item={expanded.item} origin={expanded.origin || { x: window.innerWidth / 2, y: window.innerHeight / 2 }} onClose={() => setExpanded(null)} />}{panel && <div className={"modal-backdrop " + (closingPanel ? "is-closing" : "")} role="presentation" onClick={closePanel}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={closePanel} aria-label="Cerrar ficha">×</button><p className="eyebrow">{panel === "about" ? "Acerca de" : "Contacto"}</p><h2 id="modal-title">{panel === "about" ? "Registro artístico desde 2015." : "Hablemos de una próxima historia."}</h2><p>{panel === "about" ? "Agustín David es realizador audiovisual. Desde Valparaíso desarrolla un archivo vivo de talentos, escenas y expresiones que construyen el territorio." : "Para proyectos audiovisuales, registros artísticos y colaboraciones, escribe a hola@agustindavid.cl. Cuéntame qué quieres mirar y contar."}</p></section></div>}</main>;
}

export default App;