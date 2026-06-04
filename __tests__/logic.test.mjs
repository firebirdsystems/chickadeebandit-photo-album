import { describe, it, expect } from "vitest";
import {
  canDelete,
  canCreateAlbum,
  canUpload,
  sortByDate,
  getCoverFileId,
  albumPhotoCount,
} from "../src/logic.js";

describe("canDelete", () => {
  it("allows adults",  () => expect(canDelete({ role: "adult" })).toBe(true));
  it("allows admins",  () => expect(canDelete({ role: "admin" })).toBe(true));
  it("blocks children", () => expect(canDelete({ role: "child" })).toBe(false));
  it("blocks null",    () => expect(canDelete(null)).toBe(false));
  it("blocks undefined", () => expect(canDelete(undefined)).toBe(false));
});

describe("canCreateAlbum", () => {
  it("allows adults",   () => expect(canCreateAlbum({ role: "adult" })).toBe(true));
  it("allows admins",   () => expect(canCreateAlbum({ role: "admin" })).toBe(true));
  it("blocks children", () => expect(canCreateAlbum({ role: "child" })).toBe(false));
  it("blocks null",     () => expect(canCreateAlbum(null)).toBe(false));
});

describe("canUpload", () => {
  it("allows any member when files available",   () => expect(canUpload({ role: "child" }, true)).toBe(true));
  it("allows adult when files available",        () => expect(canUpload({ role: "adult" }, true)).toBe(true));
  it("blocks when files not available",          () => expect(canUpload({ role: "adult" }, false)).toBe(false));
  it("blocks null member even with files",       () => expect(canUpload(null, true)).toBe(false));
});

describe("sortByDate", () => {
  const items = [
    { id: "a", uploaded_at: "2024-01-01T00:00:00Z" },
    { id: "b", uploaded_at: "2024-03-01T00:00:00Z" },
    { id: "c", uploaded_at: "2024-02-01T00:00:00Z" },
  ];

  it("sorts descending by default", () => {
    expect(sortByDate(items).map(i => i.id)).toEqual(["b", "c", "a"]);
  });
  it("sorts ascending when desc=false", () => {
    expect(sortByDate(items, "uploaded_at", false).map(i => i.id)).toEqual(["a", "c", "b"]);
  });
  it("does not mutate the source array", () => {
    sortByDate(items);
    expect(items[0].id).toBe("a");
  });
  it("handles empty array", () => {
    expect(sortByDate([])).toEqual([]);
  });
});

describe("getCoverFileId", () => {
  const photos = [
    { id: "1", album_id: "alb1", file_id: "f1", uploaded_at: "2024-01-01T00:00:00Z" },
    { id: "2", album_id: "alb1", file_id: "f2", uploaded_at: "2024-03-01T00:00:00Z" },
    { id: "3", album_id: "alb2", file_id: "f3", uploaded_at: "2024-02-01T00:00:00Z" },
  ];

  it("returns most recent file_id for a given album",  () => expect(getCoverFileId(photos, "alb1")).toBe("f2"));
  it("returns most recent file_id across all albums",  () => expect(getCoverFileId(photos, null)).toBe("f2"));
  it("returns null for album with no photos",          () => expect(getCoverFileId(photos, "empty")).toBeNull());
  it("returns null for empty photo array",             () => expect(getCoverFileId([], "alb1")).toBeNull());
});

describe("albumPhotoCount", () => {
  const photos = [
    { id: "1", album_id: "alb1" },
    { id: "2", album_id: "alb1" },
    { id: "3", album_id: "alb2" },
  ];

  it("counts photos in an album",          () => expect(albumPhotoCount(photos, "alb1")).toBe(2));
  it("counts photos in a different album", () => expect(albumPhotoCount(photos, "alb2")).toBe(1));
  it("returns 0 for album with no photos", () => expect(albumPhotoCount(photos, "alb3")).toBe(0));
  it("returns 0 for empty array",          () => expect(albumPhotoCount([], "alb1")).toBe(0));
});
