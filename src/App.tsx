import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { fallbackContent, type ContentItem, type ContentResponse } from "./content";

type Origin = { x: number; y: number };

function originOf(element: HTMLElement): Origin {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}


function playbackBounds(item: ContentItem, video: HTMLVideoElement) {
  const requestedStart = Math.max(0, Number(item.startSeconds) || 0);
  const trimFromEnd = Math.max(0, Number(item.endTrimSeconds) || 0);
  const duration = Number.isFinite(video.duration) ? video.duration : null;
  const start = duration === null ? requestedStart : Math.min(requestedStart, Math.max(0, duration - 0.05));
  const end = duration === null ? Number.POSITIVE_INFINITY : Math.max(start, duration - trimFromEnd);
  return { start, end };
}

function seekToPlaybackStart(item: ContentItem, video: HTMLVideoElement) {
  const { start, end } = playbackBounds(item, video);
  if (video.currentTime < start || video.currentTime >= end) video.currentTime = start;
}

function enforcePlaybackRange(item: ContentItem, video: HTMLVideoElement, repeat: boolean) {
  const { start, end } = playbackBounds(item, video);
  if (video.currentTime < start) {
    video.currentTime = start;
    return;
  }
  if (Number.isFinite(end) && video.currentTime >= end) {
    video.currentTime = start;
    if (repeat && !video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }
}

function playbackProgress(item: ContentItem, video: HTMLVideoElement) {
  const { start, end } = playbackBounds(item, video);
  const actualEnd = Number.isFinite(end) ? end : video.duration;
  if (!Number.isFinite(actualEnd) || actualEnd <= start) return 0;
  return Math.min(100, Math.max(0, ((video.currentTime - start) / (actualEnd - start)) * 100));
}

function useVisibleAutoplay(ref: RefObject<HTMLVideoElement | null>, enabled: boolean, item: ContentItem) {
  useEffect(() => {
    const video = ref.current;
    if (!video || !enabled) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        seekToPlaybackStart(item, video);
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: 0.45 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [ref, enabled, item.startSeconds, item.endTrimSeconds]);
}

function FeaturedVideo({ item, onExpand }: { item: ContentItem; onExpand: (item: ContentItem, origin: Origin) => void }) {
  const [playing, setPlaying] = useState(item.autoplay);
  const ref = useRef<HTMLVideoElement>(null);
  useVisibleAutoplay(ref, item.autoplay, item);

  const start = () => {
    const video = ref.current;
    if (!video) return;
    seekToPlaybackStart(item, video);
    if (item.autoplay) void video.play().catch(() => undefined);
  };

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      seekToPlaybackStart(item, video);
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  return <section className="featured" aria-label="Video destacado"><div className="video-frame featured-frame"><video ref={ref} autoPlay={item.autoplay} muted playsInline preload="auto" poster={item.coverUrl || undefined} src={item.videoUrl || undefined} onLoadedMetadata={start} onEnded={start} onTimeUpdate={(event) => enforcePlaybackRange(item, event.currentTarget, true)} onClick={toggle} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label="Video destacado sin sonido" />{playing && <button className="expand-button" type="button" onClick={() => { if (ref.current) { const point = originOf(ref.current); ref.current.pause(); setPlaying(false); onExpand(item, point); } }} aria-label="Expandir video">⤢</button>}</div><div className="featured-copy"><div className="featured-slide"><h1>Agustín David</h1><p>Realizador Audiovisual en Valparaíso</p></div></div></section>;
}

function VideoCard({ item, onExpand }: { item: ContentItem; onExpand: (item: ContentItem, origin: Origin) => void }) {
  const [playing, setPlaying] = useState(item.autoplay);
  const ref = useRef<HTMLVideoElement>(null);
  useVisibleAutoplay(ref, item.autoplay, item);
  const large = item.variant === "video-large";

  const start = () => {
    const video = ref.current;
    if (!video) return;
    seekToPlaybackStart(item, video);
    void video.play().catch(() => setPlaying(false));
  };

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      seekToPlaybackStart(item, video);
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  return <article className={"video-card " + (large ? "video-card-large" : "")}><div className="video-frame"><video ref={ref} autoPlay={item.autoplay} muted playsInline preload="metadata" poster={item.coverUrl || undefined} src={item.videoUrl || undefined} onLoadedMetadata={(event) => { seekToPlaybackStart(item, event.currentTarget); if (item.autoplay) void event.currentTarget.play().catch(() => setPlaying(false)); }} onTimeUpdate={(event) => enforcePlaybackRange(item, event.currentTarget, true)} onEnded={start} onClick={toggle} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-label={item.displayName + " sin sonido"} />{!playing && !item.autoplay && <button className="video-poster" type="button" onClick={start} aria-label={"Reproducir " + item.displayName}><img src={item.coverUrl || ""} alt="Portada del video" loading="lazy" /></button>}{large && <button className="expand-button" type="button" onClick={() => { if (ref.current) { const point = originOf(ref.current); ref.current.pause(); setPlaying(false); onExpand(item, point); } }} aria-label="Expandir video">⤢</button>}</div></article>;
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

  const updateProgress = (video: HTMLVideoElement) => {
    enforcePlaybackRange(item, video, true);
    setProgress(playbackProgress(item, video));
  };

  const seek = (value: string) => {
    const video = ref.current;
    if (!video?.duration) return;
    const { start, end } = playbackBounds(item, video);
    const actualEnd = Number.isFinite(end) ? end : video.duration;
    video.currentTime = start + (Number(value) / 100) * Math.max(0.01, actualEnd - start);
  };

  const style = { "--origin-x": origin.x + "px", "--origin-y": origin.y + "px" } as CSSProperties;
  return <div className={"lightbox " + (closing ? "is-closing" : "")} style={style} onClick={close} role="dialog" aria-modal="true"><div className="lightbox-video-shell" onClick={(event) => event.stopPropagation()}><button className="lightbox-close" type="button" onClick={close} aria-label="Cerrar video">×</button><video ref={ref} autoPlay muted playsInline preload="metadata" poster={item.coverUrl || undefined} src={item.videoUrl || undefined} onLoadedMetadata={(event) => seekToPlaybackStart(item, event.currentTarget)} onPlay={(event) => seekToPlaybackStart(item, event.currentTarget)} onTimeUpdate={(event) => updateProgress(event.currentTarget)} aria-label={item.displayName} /><input className="timeline" type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => seek(event.target.value)} aria-label="Línea de tiempo" /></div></div>;
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
