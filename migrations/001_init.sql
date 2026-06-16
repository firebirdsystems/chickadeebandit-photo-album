CREATE TABLE IF NOT EXISTS app_photo_album__albums (
  id              TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  created_by_id   TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_photo_album__photos (
  id               TEXT NOT NULL,
  album_id         TEXT,
  file_id          TEXT NOT NULL,
  caption          TEXT NOT NULL DEFAULT '',
  uploaded_by_id   TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_at      TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  thumb_file_id    TEXT,
  PRIMARY KEY (id)
);
