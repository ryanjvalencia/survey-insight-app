import { describe, it, expect, beforeEach } from "vitest";
import type { ColumnMapping, ParseResult } from "@/types";
import {
  LOCAL_RETENTION_MS,
  applyColumnTypes,
  clearAllLocalData,
  loadColumnTypes,
  loadUpload,
  purgeExpired,
  saveColumnTypes,
  saveUpload,
  toColumnTypes,
  type LocalStore,
} from "./index";
import { createMemoryStore } from "./memory";

const P1 = "3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5f";
const P2 = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const NOW = 1_800_000_000_000;

function upload(rows = 2): ParseResult {
  return {
    originalFilename: "survey.csv",
    dataset: {
      headers: ["nps", "comment"],
      rows: Array.from({ length: rows }, (_, i) => ({ nps: String(i), comment: "synthetic" })),
      rowCount: rows,
      parseWarnings: [],
    },
  };
}

const INFERRED: ColumnMapping[] = [
  { name: "nps", type: "nps", inferredType: "nps", confidence: 0.9 },
  { name: "revenue", type: "unknown", inferredType: "unknown", confidence: 0.3 },
];

let store: LocalStore;
beforeEach(() => {
  store = createMemoryStore();
});

describe("saveUpload / loadUpload", () => {
  it("round-trips a parsed upload for a project", async () => {
    await saveUpload(store, P1, upload(), NOW);
    expect(await loadUpload(store, P1, NOW)).toEqual(upload());
  });

  it("keeps projects separate", async () => {
    await saveUpload(store, P1, upload(2), NOW);
    expect(await loadUpload(store, P2, NOW)).toBeNull();
  });

  it("returns data just inside the retention window", async () => {
    await saveUpload(store, P1, upload(), NOW);
    expect(await loadUpload(store, P1, NOW + LOCAL_RETENTION_MS)).not.toBeNull();
  });

  it("expires and deletes data older than the retention window", async () => {
    await saveUpload(store, P1, upload(), NOW);
    expect(await loadUpload(store, P1, NOW + LOCAL_RETENTION_MS + 1)).toBeNull();
    expect(await store.keys()).toEqual([]);
  });

  it("treats entries dated in the future as invalid", async () => {
    await saveUpload(store, P1, upload(), NOW + 10 * 60_000);
    expect(await loadUpload(store, P1, NOW)).toBeNull();
  });

  it("discards malformed entries instead of returning them", async () => {
    await store.set(`upload:${P1}`, "not an envelope");
    expect(await loadUpload(store, P1, NOW)).toBeNull();
    expect(await store.keys()).toEqual([]);

    await store.set(`upload:${P1}`, { savedAt: NOW, value: { dataset: { rows: "x" } } });
    expect(await loadUpload(store, P1, NOW)).toBeNull();
  });

  it("resets saved column types when a new file is uploaded", async () => {
    await saveColumnTypes(store, P1, { nps: "rating" }, NOW);
    await saveUpload(store, P1, upload(), NOW);
    expect(await loadColumnTypes(store, P1, NOW)).toBeNull();
  });

  it("handles large uploads (50,000 rows)", async () => {
    await saveUpload(store, P1, upload(50_000), NOW);
    expect((await loadUpload(store, P1, NOW))?.dataset.rowCount).toBe(50_000);
  });
});

describe("saveColumnTypes / loadColumnTypes", () => {
  it("round-trips the user's column type choices", async () => {
    await saveColumnTypes(store, P1, { nps: "nps", revenue: "numeric" }, NOW);
    expect(await loadColumnTypes(store, P1, NOW)).toEqual({ nps: "nps", revenue: "numeric" });
  });

  it("returns null when nothing has been saved", async () => {
    expect(await loadColumnTypes(store, P1, NOW)).toBeNull();
  });

  it("drops entries that are not valid column types", async () => {
    await store.set(`columns:${P1}`, {
      savedAt: NOW,
      value: { nps: "nps", revenue: "money", x: 5 },
    });
    expect(await loadColumnTypes(store, P1, NOW)).toEqual({ nps: "nps" });
  });

  it("rejects non-object values", async () => {
    await store.set(`columns:${P1}`, { savedAt: NOW, value: ["nps"] });
    expect(await loadColumnTypes(store, P1, NOW)).toBeNull();
  });
});

describe("applyColumnTypes", () => {
  it("returns inferred mappings unchanged when nothing is saved", () => {
    expect(applyColumnTypes(INFERRED, null)).toBe(INFERRED);
  });

  it("overrides the type but keeps the inferred type and confidence for reference", () => {
    const [nps, revenue] = applyColumnTypes(INFERRED, { revenue: "numeric" });
    expect(nps).toEqual(INFERRED[0]);
    expect(revenue).toEqual({ ...INFERRED[1], type: "numeric" });
  });

  it("ignores saved columns that aren't in the file", () => {
    expect(applyColumnTypes(INFERRED, { other: "date" })).toEqual(INFERRED);
  });

  it("ignores inherited object keys such as toString", () => {
    const withProto = [{ ...INFERRED[0], name: "toString" }];
    expect(applyColumnTypes(withProto, {})).toEqual(withProto);
  });

  it("round-trips through toColumnTypes", () => {
    const edited = applyColumnTypes(INFERRED, { revenue: "numeric" });
    expect(applyColumnTypes(INFERRED, toColumnTypes(edited))).toEqual(edited);
  });
});

describe("purgeExpired", () => {
  it("removes expired and malformed entries and keeps fresh ones", async () => {
    await saveUpload(store, P1, upload(), NOW - LOCAL_RETENTION_MS - 1);
    await saveUpload(store, P2, upload(), NOW);
    await store.set("junk", 42);

    expect(await purgeExpired(store, NOW)).toBe(2);
    expect(await store.keys()).toEqual([`upload:${P2}`]);
  });
});

describe("clearAllLocalData", () => {
  it("removes every project's data", async () => {
    await saveUpload(store, P1, upload(), NOW);
    await saveColumnTypes(store, P2, { nps: "nps" }, NOW);
    await clearAllLocalData(store);
    expect(await store.keys()).toEqual([]);
  });
});

describe("createMemoryStore", () => {
  it("stores copies, so later mutation of the caller's object has no effect", async () => {
    const value = upload();
    await saveUpload(store, P1, value, NOW);
    value.dataset.rows[0].nps = "changed";
    expect((await loadUpload(store, P1, NOW))?.dataset.rows[0].nps).toBe("0");
  });
});
