-- Esquema aislado: aplicar a cada D1 de preview y producción autorizado.
-- No reutilizar D1 de formularios, contenidos ni administración.
CREATE TABLE IF NOT EXISTS session_visits (
  session_id TEXT PRIMARY KEY NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  visible_ms INTEGER NOT NULL DEFAULT 0,
  engaged_ms INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  entry_path TEXT NOT NULL,
  last_path TEXT NOT NULL,
  hostname TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_session_visits_first_seen ON session_visits(first_seen_at);
CREATE INDEX IF NOT EXISTS ix_session_visits_last_seen ON session_visits(last_seen_at);
CREATE TABLE IF NOT EXISTS session_pages (
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  pageviews INTEGER NOT NULL DEFAULT 0,
  visible_ms INTEGER NOT NULL DEFAULT 0,
  engaged_ms INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, path),
  FOREIGN KEY (session_id) REFERENCES session_visits(session_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_session_pages_path ON session_pages(path);