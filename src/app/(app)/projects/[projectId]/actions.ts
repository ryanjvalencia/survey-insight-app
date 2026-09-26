"use server";

import { parseDatasetMeta, saveDataset } from "@/lib/db/datasets";
import { updateProjectStatus } from "@/lib/db/projects";
import { isUuid } from "@/lib/ids";
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

export async function markAnalyzed(projectId: unknown): Promise<ActionResult> {
  if (!isUuid(projectId)) return { ok: false, error: "Invalid project." };

  const db = await createSupabaseServerClient();
  try {
    await updateProjectStatus(db, projectId, "analyzed");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the project status." };
  }
}
