export function canDelete(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

export function canCreateAlbum(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

export function canUpload(member, hasFiles) {
  return !!member && hasFiles;
}

/**
 * Who may mint a public link to an album.
 *
 * Adults only, matching the two hub gates this UI sits in front of: the share
 * item's default `mint_roles: "adult"`, and the `adult_writable` row policy on
 * albums that the share_photos gate is written through. `hasShare` is the
 * hub's own switch — it injects no share URLs unless the manifest declares
 * `shareable`, so the button stays hidden on an older hub.
 */
export function canShare(member, hasShare) {
  return !!hasShare && !!member && (member.role === "adult" || member.role === "admin");
}

/**
 * What to write to an album's `share_photos` gate when minting a link FAILED,
 * given the gate's value before the dialog (`wasOn`) and the value the person
 * chose (`wantOn`). Returns the value to write, or null to leave it alone.
 *
 * A rejected mint does NOT prove no link was created — the connection can drop
 * after the server commits the row. So this resolves the ambiguity toward the
 * CLOSED state rather than toward "put back what was there":
 *
 *   wasOn  wantOn  → result
 *   false  true    → "off"   the gate was just opened for a link that may not
 *                            exist; close it, and a link that did commit
 *                            publishes nothing until someone opens it again
 *   true   false   → null    the gate is already off and that is what was
 *                            asked for — restoring "on" here would publish
 *                            photos through a link that may well have been
 *                            minted, which is the one outcome nobody chose
 *   unchanged      → null    nothing was flipped, nothing to undo
 *
 * The safe end state is the same in every ambiguous case: the gate is off.
 */
export function gateAfterFailedMint(wasOn, wantOn) {
  return !wasOn && wantOn ? "off" : null;
}

export function sortByDate(items, key = "uploaded_at", desc = true) {
  return [...items].sort((a, b) => {
    const d = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return desc ? -d : d;
  });
}

export function getCoverFileId(photos, albumId) {
  const pool = albumId ? photos.filter(p => p.album_id === albumId) : photos;
  if (!pool.length) return null;
  const cover = sortByDate(pool, "uploaded_at", true)[0];
  return cover.thumb_file_id || cover.file_id;
}

export function albumPhotoCount(photos, albumId) {
  return photos.filter(p => p.album_id === albumId).length;
}

/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`).
 * A photo is findable by its caption and by who uploaded it — the
 * only text a picture carries.
 */
export function searchableFields(item) {
  return [item.caption, item.uploaded_by_name];
}
