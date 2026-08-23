import { useEffect, useMemo, useState } from "react";
import type { ContentItem } from "./content";

function statusLabel(value: "idle" | "saving" | "saved" | "error") {
  return value === "saving" ? "Guardando…" : value === "saved" ? "Guardado ✓" : value === "error" ? "Error al guardar" : "";
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No fue posible completar la operación.");
  return data;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await requestJson("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      onSuccess();
    } catch (err) { setError(err instanceof Error ? err.message : "No fue posible entrar."); }
  };
  return <main className="admin-shell admin-login"><form className="admin-login-card" onSubmit={submit}><p className="eyebrow">Panel privado</p><h1>Ordenar contenido</h1><p>Ingresa la contraseña de administración.</p><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" aria-label="Contraseña" /><button type="submit">Entrar</button>{error && <p className="admin-error">{error}</p>}</form></main>;
}

function CoverInput({ item, onUploaded }: { item: ContentItem; onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);
  const change = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/content/" + item.id + "/cover", { method: "POST", body: form });
      if (!response.ok) throw new Error((await response.json()).error || "No se pudo cambiar la portada.");
      onUploaded();
    } catch (err) { window.alert(err instanceof Error ? err.message : "No se pudo cambiar la portada."); }
    finally { setBusy(false); event.target.value = ""; }
  };
  return <label className="admin-file-button">{busy ? "Subiendo…" : "Cambiar portada"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={change} disabled={busy} /></label>;
}

function PhotoEditor({ item, onReload }: { item: ContentItem; onReload: () => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setBusy(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/admin/content/" + item.id + "/photos", { method: "POST", body: form });
        if (!response.ok) throw new Error((await response.json()).error || "No se pudo subir una fotografía.");
      }
      onReload();
    } catch (err) { window.alert(err instanceof Error ? err.message : "No se pudieron subir las fotografías."); }
    finally { setBusy(false); event.target.value = ""; }
  };
  const limit = item.variant === "album-4" ? 4 : 9;
  return <div className="admin-album-editor"><div className="admin-album-heading"><span>{item.photos.length}/{limit} fotografías</span><label className="admin-file-button">{busy ? "Subiendo…" : "Subir fotografías"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={busy || item.photos.length >= limit} /></label></div><div className={"admin-photo-grid " + (item.variant === "album-9" ? "admin-photo-grid-large" : "")}>{item.photos.map((photo) => <img key={photo.id} src={photo.thumbUrl} alt={photo.alt || "Fotografía"} />)}</div></div>;
}

function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ContentItem[][]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const hero = useMemo(() => items.find((item) => item.placement === "hero") || null, [items]);
  const gallery = useMemo(() => items.filter((item) => item.placement === "gallery").sort((a, b) => a.position - b.position), [items]);
  const reload = async () => { const data = await requestJson("/api/admin/content"); setItems(data.items); };
  useEffect(() => { fetch("/api/admin/me").then((response) => response.json()).then((data) => setAuthenticated(Boolean(data.authenticated))).catch(() => setAuthenticated(false)); }, []);
  useEffect(() => { if (authenticated) reload().catch((err) => setError(err.message)); }, [authenticated]);
  if (authenticated === null) return <main className="admin-shell"><p>Cargando…</p></main>;
  if (!authenticated) return <Login onSuccess={() => setAuthenticated(true)} />;
  const saveOrder = async (next: ContentItem[]) => {
    const previous = items;
    setHistory((stack) => [...stack.slice(-19), previous]);
    setItems(next.map((item, index) => ({ ...item, position: index })));
    setStatus("saving");
    try {
      await requestJson("/api/admin/content/order", { method: "PUT", body: JSON.stringify({ ids: next.map((item) => item.id) }) });
      setStatus("saved");
    } catch (err) { setItems(previous); setStatus("error"); setError(err instanceof Error ? err.message : "No se pudo guardar el orden."); }
  };
  const move = (index: number, direction: -1 | 1) => {
    const next = [...gallery];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    void saveOrder(next);
  };
  const updateItem = async (item: ContentItem, change: Partial<ContentItem>) => {
    const next = items.map((current) => current.id === item.id ? { ...current, ...change } : current);
    setItems(next);
    setStatus("saving");
    try {
      await requestJson("/api/admin/content/" + item.id, { method: "PATCH", body: JSON.stringify(change) });
      setStatus("saved");
    } catch (err) { setStatus("error"); setError(err instanceof Error ? err.message : "No se pudo guardar."); await reload(); }
  };
  const undo = async () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((stack) => stack.slice(0, -1));
    setItems(previous);
    setStatus("saving");
    try {
      await requestJson("/api/admin/content/order", { method: "PUT", body: JSON.stringify({ ids: previous.filter((item) => item.placement === "gallery").sort((a, b) => a.position - b.position).map((item) => item.id) }) });
      setStatus("saved");
    } catch { setStatus("error"); await reload(); }
  };
  const createAlbum = async (variant: "album-4" | "album-9") => { await requestJson("/api/admin/content", { method: "POST", body: JSON.stringify({ variant }) }); await reload(); };
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); };
  const row = (item: ContentItem, index?: number) => <article className="admin-row" key={item.id} draggable={item.placement === "gallery"} onDragStart={(event) => { event.dataTransfer.setData("text/plain", item.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const from = gallery.findIndex((entry) => entry.id === event.dataTransfer.getData("text/plain")); const to = gallery.findIndex((entry) => entry.id === item.id); if (from >= 0 && to >= 0 && from !== to) { const next = [...gallery]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); void saveOrder(next); } }}><div className="admin-row-main"><span className="admin-drag" aria-hidden="true">☰</span><img src={item.coverUrl || item.photos[0]?.thumbUrl || ""} alt="" /><div><strong>{item.displayName}</strong><small>{item.variant === "video-large" ? "Video Large · 16:9 · 2 columnas" : item.variant === "album-4" ? "Álbum Small · 4 fotos" : item.variant === "album-9" ? "Álbum Large · 9 fotos" : item.variant === "hero" ? "Video Hero" : "Video Small"}</small></div></div><div className="admin-row-actions">{item.type === "video" && (item.variant === "hero" || item.variant === "video-large") && <label className="admin-toggle"><input type="checkbox" checked={item.autoplay} onChange={(event) => void updateItem(item, { autoplay: event.target.checked })} /> Autoplay</label>}{item.placement === "gallery" && <><button type="button" onClick={() => move(index || 0, -1)} aria-label="Mover arriba">↑</button><button type="button" onClick={() => move(index || 0, 1)} aria-label="Mover abajo">↓</button></>}{item.type === "photo_album" && <PhotoEditor item={item} onReload={reload} />}<CoverInput item={item} onUploaded={reload} /></div></article>;
  return <main className="admin-shell"><header className="admin-header"><div><p className="eyebrow">Panel privado</p><h1>Contenido audiovisual</h1><p>Arrastra la galería para definir el orden público.</p></div><div className="admin-header-actions"><span className={"admin-status admin-status-" + status}>{statusLabel(status)}</span><button type="button" onClick={() => void undo()} disabled={!history.length}>Deshacer</button><button type="button" onClick={() => void createAlbum("album-4")}>Nuevo álbum · 4 fotos</button><button type="button" onClick={() => void createAlbum("album-9")}>Nuevo álbum · 9 fotos</button><button type="button" onClick={() => void logout()}>Salir</button></div></header>{error && <p className="admin-error">{error}</p>}<section className="admin-section"><h2>Hero fijo</h2>{hero && row(hero)}</section><section className="admin-section"><h2>Galería ordenable</h2>{gallery.map((item, index) => row(item, index))}</section></main>;
}

export default AdminApp;