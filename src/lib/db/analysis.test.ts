import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnalysisResult, saveAnalysisResult } from "./analysis";
import { STORED_ANALYSIS_VERSION, type StoredAnalysis } from "@/lib/results";

const mockResult: { data: unknown; error: unknown } = { data: null, error: null };
const calls: Array<{ method: string; args: unknown[] }> = [];

// Chainable stand-in for a Supabase client that records builder calls;
// awaiting it yields `mockResult`.
function chain(): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  for (const m of ["from", "select", "upsert", "eq", "maybeSingle"]) {
    c[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return chain();
    };
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
const PROJECT_ID = "3f2c1a9e-7b4d-4c8a-9e1f-0a1b2c3d4e5f";

const STORED: StoredAnalysis = {
  version: STORED_ANALYSIS_VERSION,
  cleaning: { totalRows: 3, totalColumns: 1, columns: [], totalChanges: 0 },
  quant: { nps: [], ratings: [], numerics: [], categories: [] },
  text: { columns: [] },
  insights: { insights: [], summary: "No insights." },
  charts: { charts: [] },
};

beforeEach(() => {
  mockResult.data = null;
  mockResult.error = null;
  calls.length = 0;
});

describe("saveAnalysisResult", () => {
  it("upserts one row per project keyed on project_id", async () => {
    await saveAnalysisResult(db, PROJECT_ID, STORED);
    const upsert = calls.find((c) => c.method === "upsert");
    expect(calls[0]).toEqual({ method: "from", args: ["analysis_results"] });
    expect(upsert?.args[0]).toMatchObject({ project_id: PROJECT_ID, result: STORED });
    expect(upsert?.args[1]).toEqual({ onConflict: "project_id" });
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "upsert failed" };
    await expect(saveAnalysisResult(db, PROJECT_ID, STORED)).rejects.toThrow("upsert failed");
  });
});

describe("getAnalysisResult", () => {
  it("returns the stored payload when a row exists", async () => {
    mockResult.data = { result: STORED };
    await expect(getAnalysisResult(db, PROJECT_ID)).resolves.toEqual(STORED);
  });

  it("returns null when the project has not been analyzed", async () => {
    await expect(getAnalysisResult(db, PROJECT_ID)).resolves.toBeNull();
  });

  it("returns null for a row saved in an unrecognized format", async () => {
    mockResult.data = { result: { ...STORED, version: 99 } };
    await expect(getAnalysisResult(db, PROJECT_ID)).resolves.toBeNull();
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "select failed" };
    await expect(getAnalysisResult(db, PROJECT_ID)).rejects.toThrow("select failed");
  });
});
