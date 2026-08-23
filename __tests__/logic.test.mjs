import { describe, it, expect } from "vitest";
import {
  canDelete,
  canCreateAlbum,
  canUpload,
  sortByDate,
  getCoverFileId,
  albumPhotoCount, searchableFields, canShare, gateAfterFailedMint,
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

describe("canShare", () => {
  it("allows adults",   () => expect(canShare({ role: "adult" }, true)).toBe(true));
  it("allows admins",   () => expect(canShare({ role: "admin" }, true)).toBe(true));
  // Minting a link is an adult act on both hub gates it fronts: the share
  // item's default mint_roles, and the adult_writable policy on albums that
  // the share_photos flag is written through.
  it("blocks children", () => expect(canShare({ role: "child" }, true)).toBe(false));
  it("blocks null",     () => expect(canShare(null, true)).toBe(false));
  // The hub injects no share URLs unless the manifest declares `shareable`,
  // so an older hub hides the button rather than offering a dead one.
  it("blocks when the hub offers no sharing", () => expect(canShare({ role: "adult" }, false)).toBe(false));
});

describe("gateAfterFailedMint", () => {
  // A rejected mint does not prove the server did not commit the link row, so
  // every ambiguous case has to end with the gate CLOSED.
  it("closes a gate that was just opened", () => {
    expect(gateAfterFailedMint(false, true)).toBe("off");
  });
  it("leaves a gate the user closed alone", () => {
    // The bug this encodes against: restoring "on" here re-publishes the
    // album's photos through a link that may well have been minted.
    expect(gateAfterFailedMint(true, false)).toBe(null);
  });
  it("does nothing when the gate was never flipped", () => {
    expect(gateAfterFailedMint(true, true)).toBe(null);
    expect(gateAfterFailedMint(false, false)).toBe(null);
  });
  it("never resolves to \"on\"", () => {
    for (const wasOn of [true, false]) {
      for (const wantOn of [true, false]) {
        expect(gateAfterFailedMint(wasOn, wantOn)).not.toBe("on");
      }
    }
  });
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

describe("searchableFields", () => {
  it("matches on the caption and the uploader — the only text a photo carries", () => {
    const fields = searchableFields({ caption: "Mia's first swim", uploaded_by_name: "Ada" });
    expect(fields).toContain("Mia's first swim");
    expect(fields).toContain("Ada");
  });
});
