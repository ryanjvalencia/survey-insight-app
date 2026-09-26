import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};

// Minimal chainable stand-in for a Supabase client: every builder method
// returns the chain, and awaiting it yields `mockResult`.
function chain(): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  for (const m of [
    "from",
    "select",
    "insert",
    "update",
    "eq",
    "order",
    "single",
    "maybeSingle",
  ]) {
    c[m] = () => chain();
  }
  Object.defineProperty(c, "then", {
    get() {
      return (
        resolve: (v: typeof mockResult) => unknown,
        reject?: (e: unknown) => unknown,
      ) => Promise.resolve(mockResult).then(resolve, reject);
    },
  });
  return c;
}

const db = chain() as unknown as SupabaseClient;

import { parseDatasetMeta, saveDataset } from "./datasets";

const ROW = {
  id: "ds-001",
  project_id: "proj-001",
  original_filename: "survey.csv",
  row_count: 120,
  column_count: 8,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  mockResult.data = null;
  mockResult.error = null;
});

// ---------------------------------------------------------------------------
// saveDataset
// ---------------------------------------------------------------------------

describe("saveDataset", () => {
  it("returns a DatasetRecord shaped from the Supabase row", async () => {
    mockResult.data = ROW;
    const record = await saveDataset(db, {
      projectId: "proj-001",
      originalFilename: "survey.csv",
      rowCount: 120,
      columnCount: 8,
    });
    expect(record).toEqual({
      id: "ds-001",
      projectId: "proj-001",
      originalFilename: "survey.csv",
      rowCount: 120,
      columnCount: 8,
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "insert failed" };
    await expect(
      saveDataset(db, {
        projectId: "proj-001",
        originalFilename: "survey.csv",
        rowCount: 10,
        columnCount: 3,
      }),
    ).rejects.toThrow("insert failed");
  });
});

// ---------------------------------------------------------------------------
// parseDatasetMeta
// ---------------------------------------------------------------------------

describe("parseDatasetMeta", () => {
  const VALID = {
    projectId: "3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5f",
    originalFilename: "survey.csv",
    rowCount: 120,
    columnCount: 8,
  };

  it("accepts well-formed metadata unchanged", () => {
    expect(parseDatasetMeta(VALID)).toEqual(VALID);
  });

  it("re-sanitizes the filename so unsafe characters never reach the database", () => {
    const meta = parseDatasetMeta({ ...VALID, originalFilename: "../q2 results;<x>.csv" });
    expect(meta?.originalFilename).toBe(".._q2_results__x_.csv");
  });

  it("truncates very long filenames to 255 characters", () => {
    const meta = parseDatasetMeta({ ...VALID, originalFilename: "a".repeat(400) + ".csv" });
    expect(meta?.originalFilename).toHaveLength(255);
  });

  it("rejects non-object input", () => {
    for (const input of [null, undefined, "x", 42, []]) {
      expect(parseDatasetMeta(input)).toBeNull();
    }
  });

  it("rejects a project id that is not a UUID", () => {
    expect(parseDatasetMeta({ ...VALID, projectId: "demo" })).toBeNull();
  });

  it("rejects a missing or empty filename", () => {
    expect(parseDatasetMeta({ ...VALID, originalFilename: "" })).toBeNull();
    expect(parseDatasetMeta({ ...VALID, originalFilename: 7 })).toBeNull();
  });

  it("accepts row counts at the 0 and 50,000 boundaries and rejects beyond them", () => {
    expect(parseDatasetMeta({ ...VALID, rowCount: 0 })).not.toBeNull();
    expect(parseDatasetMeta({ ...VALID, rowCount: 50_000 })).not.toBeNull();
    expect(parseDatasetMeta({ ...VALID, rowCount: 50_001 })).toBeNull();
    expect(parseDatasetMeta({ ...VALID, rowCount: -1 })).toBeNull();
  });

  it("rejects non-integer or non-numeric counts", () => {
    expect(parseDatasetMeta({ ...VALID, rowCount: 1.5 })).toBeNull();
    expect(parseDatasetMeta({ ...VALID, rowCount: "120" })).toBeNull();
    expect(parseDatasetMeta({ ...VALID, columnCount: 0 })).toBeNull();
    expect(parseDatasetMeta({ ...VALID, columnCount: Number.NaN })).toBeNull();
  });
});
