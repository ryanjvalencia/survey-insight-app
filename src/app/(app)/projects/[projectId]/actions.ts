"use server";

import { saveAnalysisResult } from "@/lib/db/analysis";
import { parseDatasetMeta, saveDataset } from "@/lib/db/datasets";
import { updateProjectStatus } from "@/lib/db/projects";
import { isUuid } from "@/lib/ids";
import { parseStoredAnalysis } from "@/lib/results";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Stores dataset metadata (counts and sanitized filename only — never rows)
 * and marks the project as uploaded. RLS rejects projects the caller
 * doesn't own.
 */
export async function recordUpload(input: unknown): Promise<ActionResult> {
  const meta = parseDatasetMeta(input);
  if (!meta) return { ok: false, error: "Invalid upload details." };

  const db = await createSupabaseServerClient();
  try {
    await saveDataset(db, meta);
    await updateProjectStatus(db, meta.projectId, "uploaded");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save the upload to your project." };
  }
}

/**
 * Persists aggregated analysis results (no raw rows) and marks the project
 * analyzed. The payload is re-validated and re-minimized server-side.
 */
export async function saveAnalysis(
  projectId: unknown,
  payload: unknown,
): Promise<ActionResult> {
  if (!isUuid(projectId)) return { ok: false, error: "Invalid project." };
  const result = parseStoredAnalysis(payload);
  if (!result) {
    return { ok: false, error: "These results are too large or malformed to save." };
  }

  const db = await createSupabaseServerClient();
  try {
    await saveAnalysisResult(db, projectId, result);
    await updateProjectStatus(db, projectId, "analyzed");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save the analysis to your project." };
  }
}
