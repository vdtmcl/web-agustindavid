import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ContentItem, PhotoItem } from "./content";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function statusLabel(value: SaveStatus) {
  return value === "saving" ? "Guardando…" : value === "saved" ? "Guardado ✓" : value === "error" ? "Error al guardar" : "";
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...(options?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No fue posible completar la operación.");
  return data;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await requestJson("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible entrar.");
    }
  };

  return (
    <main className="admin-shell admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <p className="eyebrow">Panel privado</p>
        <h1>Ordenar contenido</h1>
        <p>Ingresa la contraseña de administración.</p>
        <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" aria-label="Contraseña" />
        <button type="submit">Entrar</button>
        {error && <p className="admin-error">{error}</p>}
      </form>
    </main>
  );
}

function CoverInput({ item, onUploaded }: { item: ContentItem; onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const change = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/content/" + item.id + "/cover", { method: "POST", body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo cambiar la portada.");
      onUploaded();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo cambiar la portada.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <label className="admin-file-button">
      {busy ? "Subiendo…" : "Cambiar portada"}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={change} disabled={busy} />
    </label>
  );
}


function AddVideoForm({ onAdded, onCancel }: { onAdded: () => Promise<void> | void; onCancel: () => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try {
      await requestJson("/api/admin/content", { method: "POST", body: JSON.stringify({ videoUrl: url.trim() }) });
      setUrl("");
      await onAdded();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo añadir el video.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-add-video" onSubmit={submit}>
      <div>
        <strong>Añadir video</strong>
        <small>Pega el enlace de entrega de Cloudinary del video.</small>
      </div>
      <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://res.cloudinary.com/vdtm-cl/video/upload/…" aria-label="Enlace de video de Cloudinary" required disabled={busy} />
      <button type="submit" disabled={busy}>{busy ? "Añadiendo…" : "Añadir video"}</button>
      <button type="button" onClick={onCancel} disabled={busy}>Cancelar</button>
    </form>
  );
}

function DeleteVideoButton({ item, onDeleted }: { item: ContentItem; onDeleted: () => Promise<void> | void }) {
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    const warning = item.placement === "hero"
      ? "Este es el video Hero. Si lo eliminas, la página quedará temporalmente sin video destacado. ¿Quieres continuar?"
      : "¿Eliminar \"" + item.displayName + "\" de la página? Esta acción quitará el video de la grilla.";
    if (!window.confirm(warning)) return;
    setBusy(true);
    try {
      await requestJson("/api/admin/content/" + item.id, { method: "DELETE" });
      await onDeleted();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo eliminar el video.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="admin-delete-button" onClick={() => void remove()} disabled={busy} title="Eliminar video" aria-label={"Eliminar " + item.displayName}>
      {busy ? "…" : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6m-9 4h12m-9 0 .7 13h6.6L17 7M10 11v6m4-6v6" /></svg>}
    </button>
  );
}

function VideoPreview({ item }: { item: ContentItem }) {
  const ref = useRef<HTMLVideoElement>(null);
  const previous = useRef<{ start: number; endTrim: number } | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const values = () => ({
    start: Math.max(0, Number(item.startSeconds) || 0),
    endTrim: Math.max(0, Number(item.endTrimSeconds) || 0),
  });

  const mute = (video: HTMLVideoElement) => {
    if (!video.muted) video.muted = true;
    if (video.volume !== 0) video.volume = 0;
  };

  const bounds = (video: HTMLVideoElement) => {
    const { start: requestedStart, endTrim } = values();
    const lastSafeTime = Math.max(0, video.duration - 0.05);
    const start = Math.min(requestedStart, lastSafeTime);
    const end = Math.max(start, video.duration - endTrim);
    return { start, end };
  };

  const enforce = (video: HTMLVideoElement) => {
    mute(video);
    if (!Number.isFinite(video.duration)) return;
    const { start, end } = bounds(video);
    if (start >= end) {
      video.pause();
      video.currentTime = start;
      setMessage("El rango seleccionado no deja tiempo reproducible.");
      return;
    }
    setMessage("");
    if (video.currentTime < start) video.currentTime = start;
    if (video.currentTime >= end) {
      video.pause();
      video.currentTime = Math.max(start, end - 0.05);
    }
  };

  useEffect(() => {
    const next = values();
    const old = previous.current;
    previous.current = next;
    const video = ref.current;
    if (!video || !old || !Number.isFinite(video.duration)) return;

    const { start, end } = bounds(video);
    video.pause();
    mute(video);
    if (next.start !== old.start) {
      video.currentTime = start;
    } else if (next.endTrim !== old.endTrim) {
      video.currentTime = Math.max(start, end - 0.05);
    }
    setMessage(start >= end ? "El rango seleccionado no deja tiempo reproducible." : "");
  }, [item.startSeconds, item.endTrimSeconds]);

  return (
    <div className="admin-video-preview">
      <video
        ref={ref}
        controls
        muted
        preload="metadata"
        poster={item.coverUrl || undefined}
        src={item.videoUrl || undefined}
        onDragStart={(event) => event.stopPropagation()}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          mute(video);
          setDuration(video.duration);
          enforce(video);
        }}
        onPlay={(event) => {
          const video = event.currentTarget;
          mute(video);
          if (Number.isFinite(video.duration)) {
            const { start, end } = bounds(video);
            if (video.currentTime >= end - 0.05) video.currentTime = start;
          }
          enforce(video);
        }}
        onSeeking={(event) => enforce(event.currentTarget)}
        onTimeUpdate={(event) => enforce(event.currentTarget)}
        onVolumeChange={(event) => mute(event.currentTarget)}
        aria-label={"Previsualizar " + item.displayName}
      />
      {duration !== null && <small>{message || "Duración: " + duration.toFixed(1) + " s"}</small>}
    </div>
  );
}

function VideoTrimControls({ item, onChange }: { item: ContentItem; onChange: (change: Partial<Pick<ContentItem, "startSeconds" | "endTrimSeconds">>) => void }) {
  const [start, setStart] = useState(String(item.startSeconds ?? 0));
  const [endTrim, setEndTrim] = useState(String(item.endTrimSeconds ?? 0));

  useEffect(() => {
    setStart(String(item.startSeconds ?? 0));
    setEndTrim(String(item.endTrimSeconds ?? 0));
  }, [item.startSeconds, item.endTrimSeconds]);

  const applyDraft = (field: "startSeconds" | "endTrimSeconds", rawValue: string) => {
    if (field === "startSeconds") setStart(rawValue);
    else setEndTrim(rawValue);
    if (rawValue.trim() === "") return;
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) return;
    const currentValue = field === "startSeconds" ? Number(item.startSeconds ?? 0) : Number(item.endTrimSeconds ?? 0);
    if (value !== currentValue) onChange(field === "startSeconds" ? { startSeconds: value } : { endTrimSeconds: value });
  };

  const commit = (field: "startSeconds" | "endTrimSeconds", rawValue: string) => {
    const value = rawValue.trim() === "" ? 0 : Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      window.alert("Ingresa un número igual o mayor que cero.");
      if (field === "startSeconds") setStart(String(item.startSeconds ?? 0));
      else setEndTrim(String(item.endTrimSeconds ?? 0));
      return;
    }
    const currentValue = field === "startSeconds" ? Number(item.startSeconds ?? 0) : Number(item.endTrimSeconds ?? 0);
    if (value !== currentValue) onChange(field === "startSeconds" ? { startSeconds: value } : { endTrimSeconds: value });
  };

  const adjust = (field: "startSeconds" | "endTrimSeconds", delta: number) => {
    const raw = field === "startSeconds" ? start : endTrim;
    const current = Number(raw);
    const next = Math.max(0, Math.round(((Number.isFinite(current) ? current : 0) + delta) * 10) / 10);
    applyDraft(field, String(next));
  };

  const repeatTimer = useRef<ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> | null>(null);
  const stopAdjusting = () => { if (repeatTimer.current !== null) { clearTimeout(repeatTimer.current as ReturnType<typeof setTimeout>); clearInterval(repeatTimer.current as ReturnType<typeof setInterval>); repeatTimer.current = null; } };
  useEffect(() => {
    const release = () => stopAdjusting();
    window.addEventListener("pointerup", release);
    window.addEventListener("blur", release);
    return () => { window.removeEventListener("pointerup", release); window.removeEventListener("blur", release); stopAdjusting(); };
  }, []);
  const startAdjusting = (field: "startSeconds" | "endTrimSeconds", delta: number) => { stopAdjusting(); adjust(field, delta); repeatTimer.current = setTimeout(() => { repeatTimer.current = setInterval(() => adjust(field, delta), 70); }, 300); };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" ) event.currentTarget.blur();
  };

  const field = (label: string, value: string, name: "startSeconds" | "endTrimSeconds", description: string) => (
    <label className="admin-time-control">
      <span className="admin-time-label">{label}</span>
      <span className="admin-time-field">
        <button type="button" className="admin-time-step" onPointerDown={(event) => { event.preventDefault(); startAdjusting(name, -0.1); }} onPointerUp={stopAdjusting} onPointerCancel={stopAdjusting} onContextMenu={(event) => event.preventDefault()} aria-label={"Reducir " + label}>−</button>
        <input type="number" min="0" step="0.1" inputMode="decimal" value={value} onChange={(event) => applyDraft(name, event.target.value)} onBlur={(event) => commit(name, event.target.value)} onKeyDown={onKeyDown} aria-label={label} />
        <button type="button" className="admin-time-step" onPointerDown={(event) => { event.preventDefault(); startAdjusting(name, 0.1); }} onPointerUp={stopAdjusting} onPointerCancel={stopAdjusting} onContextMenu={(event) => event.preventDefault()} aria-label={"Aumentar " + label}>+</button>
        <span className="admin-time-unit">s</span>
      </span>
      <small>{description}</small>
    </label>
  );

  return (
    <div className="admin-trim-controls" aria-label="Recorte del video">
      <span className="admin-trim-title">Recorte</span>
      {field("Inicio", start, "startSeconds", "Desde el comienzo")}
      {field("Final antes", endTrim, "endTrimSeconds", "Se descuenta del final")}
    </div>
  );
}

function PhotoEditor({ item, onReload }: { item: ContentItem; onReload: () => void }) {
  const [photos, setPhotos] = useState<PhotoItem[]>(item.photos);
  const [busy, setBusy] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const limit = item.variant === "album-4" ? 4 : 9;
  const gridClass = item.variant === "album-9" ? "admin-photo-grid admin-photo-grid-large" : "admin-photo-grid";

  useEffect(() => setPhotos(item.photos), [item.photos]);

  const savePhotoOrder = async (next: PhotoItem[]) => {
    const previous = photos;
    setPhotos(next);
    setSavingOrder(true);
    try {
      await requestJson("/api/admin/content/" + item.id + "/photos/order", {
        method: "PUT",
        body: JSON.stringify({ ids: next.map((photo) => photo.id) }),
      });
      onReload();
    } catch (err) {
      setPhotos(previous);
      window.alert(err instanceof Error ? err.message : "No se pudo guardar el orden de fotografías.");
    } finally {
      setSavingOrder(false);
    }
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    void savePhotoOrder(next);
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (files.length > limit - photos.length) {
      window.alert("Selecciona como máximo " + (limit - photos.length) + " fotografía(s) para completar este álbum.");
      return;
    }
    setBusy(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/admin/content/" + item.id + "/photos", { method: "POST", body: form });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No se pudo subir una fotografía.");
      }
      onReload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudieron subir las fotografías.");
    } finally {
      setBusy(false);
    }
  };

  const reorderFromDrop = (event: DragEvent, targetId: string) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain");
    const from = photos.findIndex((photo) => photo.id === sourceId);
    const to = photos.findIndex((photo) => photo.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void savePhotoOrder(next);
  };

  return (
    <div className="admin-album-editor">
      <div className="admin-album-heading">
        <span>{photos.length}/{limit} fotografías{savingOrder ? " · Guardando orden…" : ""}</span>
        <label className="admin-file-button">
          {busy ? "Subiendo…" : "Subir fotografías"}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={busy || photos.length >= limit} />
        </label>
      </div>
      <div className={gridClass}>
        {photos.map((photo, index) => (
          <div className="admin-photo-item" key={photo.id} draggable onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData("text/plain", photo.id); }} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => { event.stopPropagation(); reorderFromDrop(event, photo.id); }}>
            <img src={photo.thumbUrl} alt={photo.alt || "Fotografía"} />
            <div className="admin-photo-actions">
              <button type="button" onClick={() => movePhoto(index, -1)} disabled={index === 0 || savingOrder} aria-label="Mover fotografía arriba">↑</button>
              <button type="button" onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1 || savingOrder} aria-label="Mover fotografía abajo">↓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const dragOrder = useRef<ContentItem[] | null>(null);
  const dragSnapshot = useRef<ContentItem[] | null>(null);
  const dragSaved = useRef(false);
  const previousRowRects = useRef(new Map<string, DOMRect>());
  const hero = useMemo(() => items.find((item) => item.placement === "hero") || null, [items]);
  const gallery = useMemo(() => items.filter((item) => item.placement === "gallery").sort((a, b) => a.position - b.position), [items]);

  const reload = async () => {
    const data = await requestJson("/api/admin/content");
    setItems(data.items);
  };

  useEffect(() => {
    fetch("/api/admin/me").then((response) => response.json()).then((data) => setAuthenticated(Boolean(data.authenticated))).catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (authenticated) reload().catch((err) => setError(err.message));
  }, [authenticated]);

  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    rowRefs.current.forEach((element, id) => nextRects.set(id, element.getBoundingClientRect()));
    rowRefs.current.forEach((element, id) => {
      const previous = previousRowRects.current.get(id);
      const next = nextRects.get(id);
      if (!previous || !next || Math.abs(previous.top - next.top) < 1) return;
      element.style.transition = "none";
      element.style.transform = "translateY(" + (previous.top - next.top) + "px)";
      requestAnimationFrame(() => { element.style.transition = "transform 180ms ease"; element.style.transform = ""; });
    });
    previousRowRects.current = nextRects;
  }, [items]);

  if (authenticated === null) return <main className="admin-shell"><p>Cargando…</p></main>;
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;

  const saveOrder = async (next: ContentItem[], nextHero: ContentItem | null = hero) => {
    const previous = items;
    setHistory((stack) => [...stack.slice(-19), previous]);
    const heroItem = nextHero ? { ...nextHero, placement: "hero" as const, variant: "hero" as const } : null;
    const galleryItems = next.map((item, index) => ({
      ...item,
      placement: "gallery" as const,
      position: index,
      variant: item.variant === "hero" ? "small" as const : item.variant,
      autoplay: item.variant === "hero" ? false : item.autoplay,
    }));
    setItems([...(heroItem ? [heroItem] : []), ...galleryItems]);
    setStatus("saving");
    setError("");
    try {
      await requestJson("/api/admin/content/order", {
        method: "PUT",
        body: JSON.stringify({ heroId: heroItem?.id ?? null, ids: galleryItems.map((item) => item.id) }),
      });
      setStatus("saved");
    } catch (err) {
      setItems(previous);
      setStatus("error");
      setError(err instanceof Error ? err.message : "No se pudo guardar el orden.");
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    void saveOrder(next);
  };

  const promoteGalleryVideo = (sourceId: string) => {
    const sourceIndex = gallery.findIndex((entry) => entry.id === sourceId);
    const source = gallery[sourceIndex];
    if (!source || source.type !== "video") {
      setError("Solo los videos pueden ocupar el espacio Hero.");
      return;
    }
    const next = gallery.filter((entry) => entry.id !== sourceId);
    if (hero) next.splice(sourceIndex, 0, { ...hero, placement: "gallery", variant: "small", autoplay: false });
    void saveOrder(next, source);
  };

  const swapHeroWith = (target: ContentItem) => {
    if (!hero || target.type !== "video") {
      setError("Solo puedes intercambiar el Hero con otro video.");
      return;
    }
    const targetIndex = gallery.findIndex((entry) => entry.id === target.id);
    if (targetIndex < 0) return;
    const next = [...gallery];
    next.splice(targetIndex, 0, { ...hero, placement: "gallery", variant: "small", autoplay: false });
    void saveOrder(next, target);
  };

  const autoScroll = (clientY: number) => {
    const edge = 92;
    const distance = clientY < edge ? clientY - edge : clientY > window.innerHeight - edge ? clientY - (window.innerHeight - edge) : 0;
    if (distance) window.scrollBy(0, Math.max(-18, Math.min(18, distance * 0.22)));
  };

  const updateDraggedGallery = (targetId: string) => {
    const sourceId = draggingIdRef.current;
    const current = dragOrder.current;
    if (!sourceId || !current) return;
    const from = current.findIndex((entry) => entry.id === sourceId);
    const to = current.findIndex((entry) => entry.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragOrder.current = next;
    setItems((entries) => {
      const byId = new Map(next.map((entry, index) => [entry.id, { ...entry, position: index }]));
      return entries.map((entry) => byId.get(entry.id) || entry);
    });
  };

  const handleDragOver = (event: DragEvent, target: ContentItem) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    autoScroll(event.clientY);
    if (target.placement !== "gallery" || !draggingIdRef.current || target.id === draggingIdRef.current) return;
    const current = dragOrder.current;
    if (!current) return;
    const from = current.findIndex((entry) => entry.id === draggingIdRef.current);
    const to = current.findIndex((entry) => entry.id === target.id);
    if (from < 0 || to < 0 || from === to) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const crossed = from < to ? event.clientY > rect.top + rect.height * 0.58 : event.clientY < rect.top + rect.height * 0.42;
    if (crossed) updateDraggedGallery(target.id);
    setDragOverId(target.id);
  };
  const handleDrop = (event: DragEvent, target: ContentItem) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverId(null);
    const sourceId = draggingIdRef.current || event.dataTransfer.getData("text/plain");
    const source = items.find((entry) => entry.id === sourceId);
    if (!source || source.id === target.id) return;
    if (target.placement === "hero" && source.placement === "gallery") { dragSaved.current = true; promoteGalleryVideo(source.id); return; }
    if (target.placement === "gallery" && source.placement === "hero") { dragSaved.current = true; swapHeroWith(target); return; }
  };
  const handleHeroDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverId(null);
    const sourceId = event.dataTransfer.getData("text/plain");
    const source = items.find((entry) => entry.id === sourceId);
    if (source?.placement === "gallery" && source.type === "video") { dragSaved.current = true; promoteGalleryVideo(source.id); }
    else setError("Arrastra un video de la galería para ocupar el Hero.");
  };

  const updateItem = async (item: ContentItem, change: Partial<Pick<ContentItem, "variant" | "autoplay" | "displayName" | "startSeconds" | "endTrimSeconds">>) => {
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...change } : entry));
    setStatus("saving");
    setError("");
    try {
      await requestJson("/api/admin/content/" + item.id, { method: "PATCH", body: JSON.stringify(change) });
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
      await reload();
    }
  };

  const undo = async () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((stack) => stack.slice(0, -1));
    setItems(previous);
    setStatus("saving");
    try {
      const previousHero = previous.find((item) => item.placement === "hero");
      const previousGallery = previous.filter((item) => item.placement === "gallery").sort((a, b) => a.position - b.position);
      await requestJson("/api/admin/content/order", {
        method: "PUT",
        body: JSON.stringify({ heroId: previousHero?.id ?? null, ids: previousGallery.map((item) => item.id) }),
      });
      setStatus("saved");
    } catch {
      setStatus("error");
      await reload();
    }
  };

  const createAlbum = async (variant: "album-4" | "album-9") => {
    try {
      await requestJson("/api/admin/content", { method: "POST", body: JSON.stringify({ variant }) });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el álbum.");
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };

  const row = (item: ContentItem, index?: number) => (
    <article
      className={"admin-row " + (dragOverId === item.id ? "is-drag-over" : "")}
      key={item.id}
      ref={(element) => { if (element) rowRefs.current.set(item.id, element); else rowRefs.current.delete(item.id); }}
      draggable={item.type === "video" || item.placement === "gallery"}
      onDragStart={(event) => {
        dragSnapshot.current = items;
        dragOrder.current = [...gallery];
        dragSaved.current = false;
        draggingIdRef.current = item.id;
        setDraggingId(item.id);
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        const before = dragSnapshot.current?.filter((entry) => entry.placement === "gallery").map((entry) => entry.id).join(",");
        const after = dragOrder.current?.map((entry) => entry.id).join(",");
        const changed = Boolean(before && after && before !== after);
        if (!dragSaved.current && changed && dragOrder.current) void saveOrder(dragOrder.current);
        else if (!dragSaved.current && dragSnapshot.current) setItems(dragSnapshot.current);
        dragOrder.current = null;
        dragSnapshot.current = null;
        draggingIdRef.current = null;
        setDraggingId(null);
        setDragOverId(null);
      }}
      onDragEnter={() => setDragOverId(item.id)}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverId(null); }}
      onDragOver={(event) => handleDragOver(event, item)}
      onDrop={(event) => handleDrop(event, item)}
    >
      <div className="admin-row-main">
        <span className="admin-drag" aria-hidden="true">☰</span>
        {item.type === "video" ? <VideoPreview item={item} /> : <img src={item.coverUrl || item.photos[0]?.thumbUrl || ""} alt="" />}
        <div>
          <strong>{item.displayName}</strong>
          <small>{item.variant === "video-large" ? "Video Large · 16:9 · 2 columnas" : item.variant === "album-4" ? "Álbum Small · 4 fotos" : item.variant === "album-9" ? "Álbum Large · 9 fotos" : item.variant === "hero" ? "Video Hero · 16:9" : "Video Small · 16:9"}</small>
        </div>
      </div>
      <div className="admin-row-actions">
        {item.type === "video" && item.placement === "gallery" && (
          <label className="admin-select">
            Tamaño
            <select value={item.variant} onChange={(event) => void updateItem(item, { variant: event.target.value as ContentItem["variant"] })}>
              <option value="small">Small</option>
              <option value="video-large">Large · 2 columnas</option>
            </select>
          </label>
        )}
        {item.type === "video" && (item.variant === "hero" || item.variant === "video-large") && (
          <label className="admin-toggle"><input type="checkbox" checked={item.autoplay} onChange={(event) => void updateItem(item, { autoplay: event.target.checked })} /> Autoplay</label>
        )}
        {item.type === "video" && <VideoTrimControls item={item} onChange={(change) => void updateItem(item, change)} />}
        {item.placement === "gallery" && (
          <>
            <button type="button" onClick={() => move(index || 0, -1)} aria-label="Mover arriba" title="Mover arriba">↑</button>
            <button type="button" onClick={() => move(index || 0, 1)} aria-label="Mover abajo" title="Mover abajo">↓</button>
          </>
        )}
        {item.type === "photo_album" && <PhotoEditor item={item} onReload={reload} />}
        {item.type === "video" && <DeleteVideoButton item={item} onDeleted={async () => { setStatus("saved"); await reload(); }} />}
        <CoverInput item={item} onUploaded={reload} />
      </div>
    </article>
  );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="eyebrow">Panel privado</p><h1>Contenido audiovisual</h1><p>Arrastra la galería para definir el orden público.</p></div>
        <div className="admin-header-actions">
          <span className={"admin-status admin-status-" + status}>{statusLabel(status)}</span>
          <button type="button" onClick={() => void undo()} disabled={!history.length}>Deshacer orden</button>
          <button type="button" onClick={() => void createAlbum("album-4")}>Nuevo álbum · 4 fotos</button>
          <button type="button" onClick={() => void createAlbum("album-9")}>Nuevo álbum · 9 fotos</button>
          <button type="button" onClick={() => setShowAddVideo((value) => !value)}>{showAddVideo ? "Cerrar añadir" : "Añadir video"}</button>
          <button type="button" onClick={() => void logout()}>Salir</button>
        </div>
      </header>
      {showAddVideo && <AddVideoForm onAdded={async () => { setShowAddVideo(false); setStatus("saved"); await reload(); }} onCancel={() => setShowAddVideo(false)} />}
      {error && <p className="admin-error">{error}</p>}
      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>Video Hero</h2><p>Arrastra un video aquí para intercambiarlo con el destacado actual.</p></div></div>
        {hero ? row(hero) : <div className={"admin-empty-hero " + (dragOverId === "hero-empty" ? "is-drag-over" : "")} onDragEnter={() => setDragOverId("hero-empty")} onDragLeave={() => setDragOverId(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={handleHeroDrop}>Arrastra un video aquí para ocupar el Hero</div>}
      </section>
      <section className="admin-section" onDragOver={(event) => { event.preventDefault(); autoScroll(event.clientY); }}><h2>Galería ordenable</h2>{gallery.map((item, index) => row(item, index))}</section>
    </main>
  );
}

export default AdminApp;
