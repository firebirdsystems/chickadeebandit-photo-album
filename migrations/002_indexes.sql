CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON app_photo_album__photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_album_id    ON app_photo_album__photos(album_id);
