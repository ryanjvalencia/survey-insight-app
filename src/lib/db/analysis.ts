import type { SupabaseClient } from "@supabase/supabase-js";
import { parseStoredAnalysis, type StoredAnalysis } from "@/lib/results";

// One current analysis per project; re-analyzing replaces it. RLS allows
// access only when the parent project belongs to the caller.

export async function saveAnalysisResult(
  db: SupabaseClient,
  projectId: string,
  result: StoredAnalysis,
): Promise<void> {
  const { error } = await db
    .from("analysis_results")
    .upsert(
      { project_id: projectId, result, updated_at: new Date().toISOString() },
      { onConflict: "project_id" },
    );
  if (error) throw new Error(error.message);
}

export async function getAnalysisResult(
  db: SupabaseClient,
  projectId: string,
): Promise<StoredAnalysis | null> {
  const { data, error } = await db
    .from("analysis_results")
    .select("result")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // Re-validate on read: rows from an older payload version return null
  // (treated as "not analyzed yet") instead of crashing the page.
  return data ? parseStoredAnalysis(data.result) : null;
}
