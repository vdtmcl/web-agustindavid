import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
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


function VideoPreview({ item }: { item: ContentItem }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const bounds = (video: HTMLVideoElement) => {
    const start = Math.max(0, Number(item.startSeconds) || 0);
    const trimFromEnd = Math.max(0, Number(item.endTrimSeconds) || 0);
    return { start, end: Math.max(start, video.duration - trimFromEnd) };
  };

  const enforce = (video: HTMLVideoElement) => {
    if (!Number.isFinite(video.duration)) return;
    const { start, end } = bounds(video);
    if (start >= end) {
      video.pause();
      setMessage("El rango seleccionado no deja tiempo reproducible.");
      return;
    }
    setMessage("");
    if (video.currentTime < start) video.currentTime = start;
    if (video.currentTime >= end) {
      video.pause();
      video.currentTime = start;
    }
  };

  return (
    <div className="admin-video-preview">
      <video
        ref={ref}
        controls
        preload="none"
        poster={item.coverUrl || undefined}
        src={item.videoUrl || undefined}
        onDragStart={(event) => event.stopPropagation()}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
          enforce(event.currentTarget);
        }}
        onPlay={(event) => enforce(event.currentTarget)}
        onSeeking={(event) => enforce(event.currentTarget)}
        onTimeUpdate={(event) => enforce(event.currentTarget)}
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

  const commit = (field: "startSeconds" | "endTrimSeconds", rawValue: string) => {
    const value = rawValue.trim() === "" ? 0 : Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      window.alert("Ingresa un número igual o mayor que cero.");
      if (field === "startSeconds") setStart(String(item.startSeconds ?? 0));
      else setEndTrim(String(item.endTrimSeconds ?? 0));
      return;
    }
    onChange(field === "startSeconds" ? { startSeconds: value } : { endTrimSeconds: value });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
  };

  return (
    <div className="admin-trim-controls">
      <label>Inicio (s)<input type="number" min="0" step="0.1" value={start} onChange={(event) => setStart(event.target.value)} onBlur={(event) => commit("startSeconds", event.target.value)} onKeyDown={onKeyDown} /></label>
      <label>Final (s antes)<input type="number" min="0" step="0.1" value={endTrim} onChange={(event) => setEndTrim(event.target.value)} onBlur={(event) => commit("endTrimSeconds", event.target.value)} onKeyDown={onKeyDown} /></label>
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

  if (authenticated === null) return <main className="admin-shell"><p>Cargando…</p></main>;
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;

  const saveOrder = async (next: ContentItem[]) => {
    const previous = items;
    setHistory((stack) => [...stack.slice(-19), previous]);
    const heroItem = items.find((item) => item.placement === "hero");
    setItems([...(heroItem ? [heroItem] : []), ...next.map((item, index) => ({ ...item, position: index }))]);
    setStatus("saving");
    setError("");
    try {
      await requestJson("/api/admin/content/order", { method: "PUT", body: JSON.stringify({ ids: next.map((item) => item.id) }) });
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
      await requestJson("/api/admin/content/order", {
        method: "PUT",
        body: JSON.stringify({ ids: previous.filter((item) => item.placement === "gallery").sort((a, b) => a.position - b.position).map((item) => item.id) }),
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
      className="admin-row"
      key={item.id}
      draggable={item.placement === "gallery"}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const from = gallery.findIndex((entry) => entry.id === event.dataTransfer.getData("text/plain"));
        const to = gallery.findIndex((entry) => entry.id === item.id);
        if (from >= 0 && to >= 0 && from !== to) {
          const next = [...gallery];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          void saveOrder(next);
        }
      }}
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
            <button type="button" onClick={() => move(index || 0, -1)} aria-label="Mover arriba">↑</button>
            <button type="button" onClick={() => move(index || 0, 1)} aria-label="Mover abajo">↓</button>
          </>
        )}
        {item.type === "photo_album" && <PhotoEditor item={item} onReload={reload} />}
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
          <button type="button" onClick={() => void logout()}>Salir</button>
        </div>
      </header>
      {error && <p className="admin-error">{error}</p>}
      <section className="admin-section"><h2>Hero fijo</h2>{hero && row(hero)}</section>
      <section className="admin-section"><h2>Galería ordenable</h2>{gallery.map((item, index) => row(item, index))}</section>
    </main>
  );
}

export default AdminApp;
