CREATE TABLE IF NOT EXISTS albums (
  id              TEXT NOT NULL,
  household_id    UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  created_by_id   TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS photos (
  id               TEXT NOT NULL,
  household_id     UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  album_id         TEXT,
  file_id          TEXT NOT NULL,
  caption          TEXT NOT NULL DEFAULT '',
  uploaded_by_id   TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_at      TEXT NOT NULL,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (household_id, id)
);
