// The hub's own test for an adult member (hub-sdk `isAdult`), repeated here so
// the role rules below can be unit-tested without the browser-only SDK.
function isAdultMember(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

/**
 * Whether a member may delete a photo someone else uploaded. Mirrors the hub's
 * rule for the photos table (owner_or_visibility): any adult in a household,
 * and only the steward in a shared space. An adult who merely takes part in a
 * space is narrowed to their own uploads, so a delete of anyone else's photo
 * would change nothing.
 */
export function supervisesPhotos(member, { tenantKind = "household", isAdmin = false } = {}) {
  return tenantKind === "household" ? isAdultMember(member) : isAdmin === true;
}

/** A photo's own uploader may always delete it; so may whoever supervises photos. */
export function canDelete(photo, member, tenant) {
  return !!member && (photo.uploaded_by_id === member.id || supervisesPhotos(member, tenant));
}

/**
 * Deleting an album deletes every photo in it, other members' included, so it
 * is offered to an adult who may delete those photos one by one: every adult
 * in a household, and only the steward in a shared space.
 */
export function canDeleteAlbum(member, tenant) {
  return isAdultMember(member) && supervisesPhotos(member, tenant);
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

/**
 * The line a failed share-link create or revoke shows ("Hub endpoints other than `/api/db`"
 * in the app-template guide). The SDK's share helper puts the hub's `.status` on its error;
 * the hub's text never reaches the screen.
 *   402 — on a plain link, the free plan's active-link cap (a 402 for a password, sign-ups
 *         or a longer expiry is the caller's plan line, checked before this)
 *   409 — `code: "share_link_limit"` is a paid household's active-link cap; a 409 without
 *         that code (a failure inside the mint, or an older hub) keeps "try again"
 *   400 — `code: "password_too_short"`; the caller pre-checks the length, so this is a backstop
 *   403 — not allowed, including `code: "not_owner"` (revoking another member's link);
 *   404 — the item is gone (a revoke's 404 is the caller's: the link is already gone, or an
 *         older hub refusing a non-owner — the caller re-reads the list)
 */
export function shareFailureLine(e, { action, thing } = {}) {
  if (e?.status === 402) return "Too many share links are active — revoke one first.";
  if (e?.status === 409 && e?.code === "share_link_limit") return "Too many share links are active — revoke one first.";
  if (e?.status === 400 && e?.code === "password_too_short") return "The password needs at least 6 characters.";
  if (e?.status === 403) return `You don’t have permission to ${action}.`;
  if (e?.status === 404) return `This ${thing} has been removed.`;
  return `Couldn’t ${action} — try again.`;
}
