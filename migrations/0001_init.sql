CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('video', 'photo_album')),
  variant TEXT NOT NULL CHECK (variant IN ('hero', 'video-large', 'small', 'album-4', 'album-9')),
  placement TEXT NOT NULL CHECK (placement IN ('hero', 'gallery')),
  position INTEGER NOT NULL DEFAULT 0,
  public_id TEXT,
  format TEXT,
  display_name TEXT NOT NULL,
  cover_public_id TEXT,
  cover_mode TEXT NOT NULL DEFAULT 'auto' CHECK (cover_mode IN ('auto', 'image')),
  poster_seconds REAL NOT NULL DEFAULT 3,
  autoplay INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_items_placement_position
  ON content_items (placement, position);

CREATE TABLE IF NOT EXISTS album_photos (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL,
  public_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_photos_item_position
  ON album_photos (content_item_id, position);

CREATE TABLE IF NOT EXISTS auth_attempts (
  id TEXT PRIMARY KEY,
  bucket TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);