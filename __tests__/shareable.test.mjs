/**
 * Ratchet for `manifest.shareable` — the album share link.
 *
 * Everything this block names is resolved by the hub in raw SQL for an
 * ANONYMOUS caller: member row policies do not apply to share-link reads, so
 * the projected columns are the entire public surface of an album. A typo in a
 * column name is a 500 on a visitor's page; a wrong column name is a privacy
 * incident. Neither is caught by anything else in this repo, so the checks
 * below re-derive the schema from the migrations and hold the projection to
 * exactly what was reviewed.
 */
import { describe, it, expect } from "vitest";
import { manifest, schema, columnsOf, isPlaintextColumn } from "./schema.mjs";

const item = manifest.shareable?.album;
const feed = item?.feed;

describe("shareable.album", () => {
  it("is declared on a db-backed app", () => {
    expect(item, "manifest.shareable.album is missing").toBeDefined();
    expect(manifest.storage).toBe("db");
  });

  it("projects only columns that exist on albums", () => {
    const columns = columnsOf(item.table);
    expect(columns, `no CREATE TABLE for ${item.table}`).toBeDefined();
    expect(columns.has(item.title_column)).toBe(true);
    for (const c of item.columns) {
      expect(columns.has(c.column), `albums.${c.column} is missing from the schema`).toBe(true);
    }
  });

  it("never projects who uploaded or created anything", () => {
    // Real names on an anonymous URL. The in-app views still show them; the
    // public page deliberately does not, and adding one back is a decision,
    // not a tidy-up.
    const projected = [
      ...item.columns.map((c) => c.column),
      ...feed.columns.map((c) => c.column),
    ];
    expect(projected.filter((c) => c.includes("_by"))).toEqual([]);
  });
});

describe("shareable.album.feed", () => {
  it("projects only columns that exist on photos", () => {
    const columns = columnsOf(feed.table);
    expect(columns, `no CREATE TABLE for ${feed.table}`).toBeDefined();
    expect(columns.has(feed.fk_column)).toBe(true);
    for (const c of feed.columns) {
      expect(columns.has(c.column), `photos.${c.column} is missing from the schema`).toBe(true);
    }
  });

  it("publishes a file column the reclaim lane tracks", () => {
    // A published file id that delete_file_columns does not name would keep
    // its bytes billed after the row is gone — and keep them reachable
    // through the link until the metadata row is swept.
    expect(columnsOf(feed.table).has(feed.files_column)).toBe(true);
    expect(manifest.delete_file_columns[feed.table]).toContain(feed.files_column);
  });

  it("filters and orders on plaintext columns only", () => {
    // SQL equality against ciphertext never matches (random IV), so a gate on
    // an encrypted column is not a strict gate — it is a dead one, and the
    // hub rejects the bundle for it at publish time.
    const gates = [
      ...(feed.where ?? []).map((w) => w.column),
      feed.parent_where.column,
      feed.order_column,
    ];
    for (const column of gates) {
      expect(isPlaintextColumn(column), `${column} would be encrypted at rest`).toBe(true);
    }
  });

  it("gates per-photo visibility and per-album opt-in", () => {
    // Two independent gates, and both must survive: the album says "publish my
    // photos", each photo says "everyone may see me". Dropping either one
    // publishes photos a member kept back.
    expect(feed.where).toContainEqual({ column: "visibility", values: ["everyone"] });
    expect(feed.parent_where).toEqual({ column: "share_photos", values: ["on"] });
  });

  it("gates on a column that exists and defaults closed", () => {
    expect(columnsOf(item.table).has(feed.parent_where.column)).toBe(true);
    // The migration's DEFAULT decides what happens to every album that already
    // exists when this version installs. 'off' is the only safe answer: an
    // update must not start publishing photos on its own.
    expect(schema).toMatch(
      /alter\s+table\s+\S*albums\s+add\s+column\s+share_photos\s+text\s+not\s+null\s+default\s+'off'/i,
    );
  });

  it("accepts no external writes", () => {
    // Guests reading an album is a projection; guests uploading into one is an
    // anonymous internet-facing write into the household's file storage, which
    // this app has not been designed or reviewed for.
    expect(item.submit).toBeUndefined();
  });

  it("caps the page at the hub's feed ceiling or below", () => {
    expect(feed.max_items).toBeGreaterThan(0);
    expect(feed.max_items).toBeLessThanOrEqual(200);
  });
});
