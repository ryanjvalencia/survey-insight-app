import { supabase } from "@/lib/supabase/client";

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

export async function saveDataset(input: {
  projectId: string;
  originalFilename: string;
  rowCount: number;
  columnCount: number;
}): Promise<DatasetRecord> {
  const { data, error } = await supabase
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
