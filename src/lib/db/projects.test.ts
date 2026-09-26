import { describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mutable result that each test can configure before awaiting.
// The chain's `then` getter reads this lazily at await time, so mutation works.
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
  // Thenable — reads mockResult lazily at await time
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

import {
  createProject,
  getProject,
  listProjects,
  updateProjectStatus,
} from "./projects";

const ROW = {
  id: "abc-123",
  name: "Q2 Survey",
  status: "created",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  mockResult.data = null;
  mockResult.error = null;
});

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------

describe("createProject", () => {
  it("returns a Project shaped from the Supabase row", async () => {
    mockResult.data = ROW;
    const project = await createProject(db, "Q2 Survey");
    expect(project).toEqual({
      id: "abc-123",
      name: "Q2 Survey",
      status: "created",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "insert failed" };
    await expect(createProject(db, "Test")).rejects.toThrow("insert failed");
  });
});

// ---------------------------------------------------------------------------
// getProject
// ---------------------------------------------------------------------------

describe("getProject", () => {
  it("returns a Project when a row is found", async () => {
    mockResult.data = ROW;
    const project = await getProject(db, "abc-123");
    expect(project).not.toBeNull();
    expect(project!.id).toBe("abc-123");
  });

  it("returns null when no row is found", async () => {
    mockResult.data = null;
    const project = await getProject(db, "missing");
    expect(project).toBeNull();
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "select failed" };
    await expect(getProject(db, "x")).rejects.toThrow("select failed");
  });
});

// ---------------------------------------------------------------------------
// listProjects
// ---------------------------------------------------------------------------

describe("listProjects", () => {
  it("returns an empty array when there are no projects", async () => {
    mockResult.data = [];
    const projects = await listProjects(db);
    expect(projects).toEqual([]);
  });

  it("returns an empty array when Supabase returns null data", async () => {
    mockResult.data = null;
    const projects = await listProjects(db);
    expect(projects).toEqual([]);
  });

  it("returns mapped projects from rows", async () => {
    mockResult.data = [ROW];
    const projects = await listProjects(db);
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("abc-123");
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "list failed" };
    await expect(listProjects(db)).rejects.toThrow("list failed");
  });
});

// ---------------------------------------------------------------------------
// updateProjectStatus
// ---------------------------------------------------------------------------

describe("updateProjectStatus", () => {
  it("resolves without error on success", async () => {
    mockResult.error = null;
    await expect(
      updateProjectStatus(db, "abc-123", "uploaded"),
    ).resolves.toBeUndefined();
  });

  it("throws when Supabase returns an error", async () => {
    mockResult.error = { message: "update failed" };
    await expect(
      updateProjectStatus(db, "abc-123", "uploaded"),
    ).rejects.toThrow("update failed");
  });
});
