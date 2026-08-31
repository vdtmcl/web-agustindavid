import { useEffect, useRef, useState, type RefObject } from "react";
import { fallbackContent, type ContentItem, type ContentResponse } from "./content";

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

function seekToPlaybackResume(item: ContentItem, video: HTMLVideoElement) {
  const { start, end } = playbackBounds(item, video);
  if (video.ended || (Number.isFinite(end) && video.currentTime >= end - 0.05)) {
    video.currentTime = start;
  } else {
    seekToPlaybackStart(item, video);
  }
}

function enforcePlaybackRange(item: ContentItem, video: HTMLVideoElement) {
  const { start, end } = playbackBounds(item, video);
  if (video.currentTime < start) {
    video.currentTime = start;
    return;
  }
  if (Number.isFinite(end) && video.currentTime >= end) {
    video.currentTime = Math.max(start, end - 0.05);
    video.pause();
  }
}

function isPlaybackBuffered(item: ContentItem, video: HTMLVideoElement) {
  const { start, end } = playbackBounds(item, video);
  if (!Number.isFinite(end) || video.buffered.length === 0) return false;
  for (let index = 0; index < video.buffered.length; index += 1) {
    if (video.buffered.start(index) <= start + 0.15 && video.buffered.end(index) >= end - 0.15) return true;
  }
  return false;
}

function useVisibleAutoplay(ref: RefObject<HTMLVideoElement | null>, enabled: boolean, item: ContentItem, loaded = true, onLoad = () => undefined) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        video.pause();
      } else if (!loaded) {
        onLoad();
      } else if (enabled && video.paused) {
        seekToPlaybackStart(item, video);
        void video.play().catch(() => undefined);
      }
    }, { threshold: 0.45, rootMargin: "200px 0px" });
    observer.observe(video);
    return () => observer.disconnect();
  }, [ref, enabled, item.startSeconds, item.endTrimSeconds, loaded, onLoad]);
}

function videoSourceKey(item: ContentItem) {
  return item.id + "|" + (item.videoUrl || "") + "|" + (item.mobileVideoUrl || "");
}

function VideoSources({ item }: { item: ContentItem }) {
  return <><source media="(max-width: 560px)" src={item.mobileVideoUrl || item.videoUrl || undefined} /><source src={item.videoUrl || undefined} /></>;
}

function FeaturedVideo({ item }: { item: ContentItem }) {
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
      seekToPlaybackResume(item, video);
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  return <section className="featured" aria-label="Video destacado"><div className="video-frame featured-frame"><video key={videoSourceKey(item)} ref={ref} autoPlay={item.autoplay} muted playsInline preload="auto" poster={item.coverUrl || undefined} onLoadedMetadata={start} onTimeUpdate={(event) => enforcePlaybackRange(item, event.currentTarget)} onClick={toggle} aria-label="Video destacado sin sonido"><VideoSources item={item} /></video></div><div className="featured-copy"><div className="featured-slide"><h1>Agustín David</h1><p>Realizador audiovisual porteño, desde el 2015 con foco en disciplinas artísticas y patrimonio regional.</p></div></div></section>;
}

function VideoCard({ item }: { item: ContentItem }) {
  const [playing, setPlaying] = useState(item.autoplay);
  const [showPoster, setShowPoster] = useState(!item.autoplay);
  const [loaded, setLoaded] = useState(!item.autoplay);
  const ref = useRef<HTMLVideoElement>(null);
  useVisibleAutoplay(ref, item.autoplay, item, loaded, () => setLoaded(true));

  const finishPlayback = (video: HTMLVideoElement) => {
    if (isPlaybackBuffered(item, video)) {
      seekToPlaybackStart(item, video);
      void video.play().catch(() => { setPlaying(false); setShowPoster(true); });
      return;
    }
    video.pause();
    seekToPlaybackStart(item, video);
    setPlaying(false);
    setShowPoster(true);
  };

  const start = () => {
    const video = ref.current;
    if (!video) return;
    seekToPlaybackResume(item, video);
    setShowPoster(false);
    void video.play().catch(() => setPlaying(false));
  };

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      setShowPoster(false);
      seekToPlaybackResume(item, video);
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  return <article className={"video-card " + (item.variant === "video-large" ? "video-card-large" : "")}><div className="video-frame"><video key={videoSourceKey(item)} ref={ref} autoPlay={item.autoplay} muted playsInline preload={item.autoplay ? "none" : "metadata"} poster={item.coverUrl || undefined} onLoadedMetadata={(event) => { seekToPlaybackStart(item, event.currentTarget); if (item.autoplay) void event.currentTarget.play().catch(() => setPlaying(false)); }} onTimeUpdate={(event) => { const video = event.currentTarget; enforcePlaybackRange(item, video); const { end } = playbackBounds(item, video); if (Number.isFinite(end) && video.currentTime >= end - 0.05) finishPlayback(video); }} onEnded={(event) => finishPlayback(event.currentTarget)} onClick={toggle} onPlay={() => { setPlaying(true); setShowPoster(false); }} onPause={() => setPlaying(false)} aria-label={item.displayName + " sin sonido"}>{loaded && <VideoSources item={item} />}</video>{showPoster && item.coverUrl && <button className="video-poster" type="button" onClick={start} aria-label={"Reproducir " + item.displayName}><img src={item.coverUrl} alt="Portada del video" loading="lazy" /></button>}</div></article>;
}

function PhotoCard({ item, onExpand }: { item: ContentItem; onExpand: (item: ContentItem) => void }) {
  const cover = item.coverUrl || item.photos[0]?.thumbUrl;
  return <article className="video-card photo-card"><div className="video-frame"><button className="video-poster" type="button" onClick={() => onExpand(item)} aria-label={"Abrir " + item.displayName}>{cover ? <img src={cover} alt="Portada del álbum" loading="lazy" /> : <span className="empty-media">Álbum pendiente</span>}<span className="photo-count">{item.photos.length} fotos</span></button></div></article>;
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
  const [expanded, setExpanded] = useState<ContentItem | null>(null);
  useEffect(() => { fetch("/api/videos", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(new Error("API"))).then((data: ContentResponse) => { if (data?.hero || data?.gallery) setContent(data); }).catch(() => undefined); }, []);
  const closePanel = () => { if (closingPanel) return; setClosingPanel(true); window.setTimeout(() => { setPanel(null); setClosingPanel(false); }, 700); };
  return <main className="site-shell"><header className="site-header"><nav aria-label="Navegación principal"><button type="button" onClick={() => { setClosingPanel(false); setPanel("about"); }}>Acerca de</button><button type="button" onClick={() => { setClosingPanel(false); setPanel("contact"); }}>Contacto</button></nav></header><div className="intro-spacer" />{content.hero && <FeaturedVideo item={content.hero} />}<section className="video-gallery" aria-label="Archivo audiovisual">{content.gallery.map((item) => item.type === "photo_album" ? <PhotoCard key={item.id} item={item} onExpand={(album) => setExpanded(album)} /> : <VideoCard key={item.id} item={item} />)}</section><footer className="site-footer"><span>Agustín David · Realizador Audiovisual</span><button type="button" onClick={() => { setClosingPanel(false); setPanel("contact"); }}>agustindavid.cl@gmail.com</button></footer>{expanded?.type === "photo_album" && <PhotoLightbox item={expanded} onClose={() => setExpanded(null)} />}{panel && <div className={"modal-backdrop " + (closingPanel ? "is-closing" : "")} role="presentation" onClick={closePanel}><section className="info-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={closePanel} aria-label="Cerrar ficha">×</button><p className="eyebrow">{panel === "about" ? "Acerca de" : "Contacto"}</p><h2 id="modal-title">{panel === "about" ? "Registro artístico desde 2015." : "Hablemos de una próxima historia."}</h2><p>{panel === "about" ? "Agustín David es realizador audiovisual y fotógrafo. Ha desarrollado principalmente su trabajo en la comuna de Valparaíso, realizando registros audiovisuales y fotográficos vinculados especialmente a las artes escénicas y a diversas expresiones artísticas. Entre los años 2012 y 2015 estudió Comunicación Audiovisual en Duoc UC, etapa fundamental para conectar su visión e interés artístico con el registro y la documentación de distintas disciplinas. Su interés por el audiovisual nació a partir de una profunda reflexión sobre la escasez de registros existentes en torno a diversas disciplinas artísticas. Muchas personas dedican años de su vida a desarrollar y perfeccionar sus conocimientos, técnicas y expresiones, pero con frecuencia ese valioso trabajo queda sin documentación audiovisual. Desde esa inquietud surge su interés por registrar, preservar y visibilizar los procesos creativos, las experiencias y el conocimiento que se construye dentro de estas disciplinas." : "Gracias por tu interés. Si te interesa que conversemos, puedes escribirme a: agustindavid.cl@gmail.com"}</p></section></div>}</main>;
}

export default App;
