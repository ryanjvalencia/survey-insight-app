import { describe, it, expect, beforeEach, vi } from "vitest";

const mockResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};

vi.mock("@/lib/supabase/client", () => {
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
  return { getSupabase: () => chain() };
});

import { saveDataset } from "./datasets";

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
    const record = await saveDataset({
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
      saveDataset({
        projectId: "proj-001",
        originalFilename: "survey.csv",
        rowCount: 10,
        columnCount: 3,
      }),
    ).rejects.toThrow("insert failed");
  });
});
