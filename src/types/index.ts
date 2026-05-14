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

export type ValidationCode =
  | "INVALID_MIME_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "NO_HEADERS"
  | "NO_DATA_ROWS"
  | "INCONSISTENT_COLUMNS"
  | "EXCEEDS_ROW_LIMIT";

export interface ValidationIssue {
  code: ValidationCode;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  rowCount?: number;
  columnCount?: number;
}
