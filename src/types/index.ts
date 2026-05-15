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

export interface ColumnCleaningStats {
  columnName: string;
  trimmed: number;
  nullified: number;
  clamped: number;
  normalized: number;
}

export interface CleaningSummary {
  totalRows: number;
  totalColumns: number;
  columns: ColumnCleaningStats[];
  totalChanges: number;
}

export interface CleaningResult {
  dataset: Dataset;
  summary: CleaningSummary;
}

export type SchemaIssueCode =
  | "NO_ANALYSABLE_COLUMNS"
  | "COLUMN_ALL_EMPTY"
  | "COLUMN_LOW_FILL_RATE"
  | "NPS_INVALID_VALUES"
  | "RATING_INVALID_VALUES"
  | "NUMERIC_INVALID_VALUES"
  | "DATE_INVALID_VALUES";

export interface SchemaIssue {
  columnName: string;
  columnType: ColumnType;
  code: SchemaIssueCode;
  message: string;
  severity: "error" | "warning";
  affectedCount: number;
}

export interface SchemaValidationResult {
  valid: boolean;
  issues: SchemaIssue[];
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
