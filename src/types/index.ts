export type ProjectStatus =
  | "created"
  | "uploaded"
  | "previewed"
  | "mapped"
  | "analyzed"
  | "completed";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  status: ProjectStatus;
}

export type ColumnType =
  | "rating"
  | "nps"
  | "category"
  | "date"
  | "open_text"
  | "numeric"
  | "id"
  | "ignore"
  | "unknown";

export interface ColumnMapping {
  name: string;
  type: ColumnType;
  inferredType: ColumnType;
  confidence: number;
}

export interface Dataset {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  parseWarnings: string[];
}

export interface ParseResult {
  dataset: Dataset;
  originalFilename: string;
}
