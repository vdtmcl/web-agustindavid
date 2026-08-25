ALTER TABLE content_items ADD COLUMN start_seconds REAL NOT NULL DEFAULT 0;
ALTER TABLE content_items ADD COLUMN end_trim_seconds REAL NOT NULL DEFAULT 0;
