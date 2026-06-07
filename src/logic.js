export function canDelete(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

export function canCreateAlbum(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

export function canUpload(member, hasFiles) {
  return !!member && hasFiles;
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
