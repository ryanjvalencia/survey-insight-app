import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/ids";
import { sanitizeFilename } from "@/lib/parse";

export interface DatasetRecord {
  id: string;
  projectId: string;
  originalFilename: string;
  rowCount: number;
  columnCount: number;
  createdAt: string;
}

type Row = {
  id: string;
  project_id: string;
  original_filename: string;
  row_count: number;
  column_count: number;
  created_at: string;
};

export interface DatasetMeta {
  projectId: string;
  originalFilename: string;
  rowCount: number;
  columnCount: number;
}

const MAX_ROWS = 50_000;
const MAX_COLUMNS = 1_000;
const MAX_FILENAME_LENGTH = 255;

function isIntInRange(n: unknown, min: number, max: number): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max;
}

/**
 * Validates dataset metadata arriving from the browser before it is stored.
 * Returns null for anything malformed. The filename is re-sanitized here
 * because client input can't be trusted.
 */
export function parseDatasetMeta(input: unknown): DatasetMeta | null {
  if (typeof input !== "object" || input === null) return null;
  const { projectId, originalFilename, rowCount, columnCount } =
    input as Record<string, unknown>;
  if (!isUuid(projectId)) return null;
  if (typeof originalFilename !== "string" || originalFilename.length === 0) return null;
  if (!isIntInRange(rowCount, 0, MAX_ROWS)) return null;
  if (!isIntInRange(columnCount, 1, MAX_COLUMNS)) return null;
  return {
    projectId,
    originalFilename: sanitizeFilename(originalFilename).slice(0, MAX_FILENAME_LENGTH),
    rowCount,
    columnCount,
  };
}

function toRecord(row: Row): DatasetRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    originalFilename: row.original_filename,
    rowCount: row.row_count,
    columnCount: row.column_count,
    createdAt: row.created_at,
  };
}

export async function saveDataset(
  db: SupabaseClient,
  input: DatasetMeta,
): Promise<DatasetRecord> {
  const { data, error } = await db
    .from("datasets")
    .insert({
      project_id: input.projectId,
      original_filename: input.originalFilename,
      row_count: input.rowCount,
      column_count: input.columnCount,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toRecord(data as Row);
}
