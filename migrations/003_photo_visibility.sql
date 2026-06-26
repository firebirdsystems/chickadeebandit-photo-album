-- Photos are a shared household gallery: everyone browses, owner/adult manages.
-- The `owner_or_visibility` row policy keys on this plaintext column; default
-- 'everyone' so every photo is visible to all members (the prior `owner_only`
-- policy silently hid each member's photos from everyone else).
ALTER TABLE app_photo_album__photos ADD COLUMN visibility TEXT NOT NULL DEFAULT 'everyone';
