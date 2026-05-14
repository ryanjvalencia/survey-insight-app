import type {
  ColumnMapping,
  ColumnType,
  Dataset,
  SchemaIssue,
  SchemaValidationResult,
} from "@/types";

const ANALYSABLE_TYPES: ReadonlySet<ColumnType> = new Set([
  "nps",
  "rating",
  "numeric",
  "open_text",
]);

const SKIP_TYPES: ReadonlySet<ColumnType> = new Set(["ignore", "id"]);

const LOW_FILL_THRESHOLD = 0.5;

/**
 * Validates a parsed Dataset against confirmed ColumnMappings.
 * Reports structural errors (nothing to analyse, empty columns) as errors,
 * and data-quality problems (invalid values, low fill rate) as warnings.
 * Never logs or returns cell values — only counts and percentages.
 */
export function validateSchema(
  dataset: Dataset,
  mappings: ColumnMapping[],
): SchemaValidationResult {
  const issues: SchemaIssue[] = [];

  const hasAnalysable = mappings.some((m) => ANALYSABLE_TYPES.has(m.type));
  if (!hasAnalysable) {
    issues.push({
      columnName: "",
      columnType: "unknown",
      code: "NO_ANALYSABLE_COLUMNS",
      message:
        "No NPS, rating, numeric, or open-text columns are mapped — nothing to analyse.",
      severity: "error",
      affectedCount: 0,
    });
  }

  for (const mapping of mappings) {
    if (SKIP_TYPES.has(mapping.type)) continue;

    const rawValues = dataset.rows.map((r) => r[mapping.name] ?? "");
    const nonEmpty = rawValues.filter((v) => v.trim() !== "");
    const emptyCount = dataset.rowCount - nonEmpty.length;

    if (nonEmpty.length === 0) {
      issues.push({
        columnName: mapping.name,
        columnType: mapping.type,
        code: "COLUMN_ALL_EMPTY",
        message: `"${mapping.name}" has no non-empty values.`,
        severity: "error",
        affectedCount: dataset.rowCount,
      });
      continue;
    }

    if (nonEmpty.length / dataset.rowCount < LOW_FILL_THRESHOLD) {
      const pct = Math.round((emptyCount / dataset.rowCount) * 100);
      issues.push({
        columnName: mapping.name,
        columnType: mapping.type,
        code: "COLUMN_LOW_FILL_RATE",
        message: `"${mapping.name}" is ${pct}% empty (${emptyCount.toLocaleString()} of ${dataset.rowCount.toLocaleString()} rows).`,
        severity: "warning",
        affectedCount: emptyCount,
      });
    }

    if (mapping.type === "nps") checkNPS(mapping.name, nonEmpty, issues);
    else if (mapping.type === "rating")
      checkRating(mapping.name, nonEmpty, issues);
    else if (mapping.type === "numeric")
      checkNumeric(mapping.name, nonEmpty, issues);
    else if (mapping.type === "date") checkDate(mapping.name, nonEmpty, issues);
  }

  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
  };
}

function checkNPS(
  name: string,
  values: string[],
  issues: SchemaIssue[],
): void {
  let invalidCount = 0;
  for (const v of values) {
    const n = Number(v.trim());
    if (!Number.isInteger(n) || n < 0 || n > 10) invalidCount++;
  }
  if (invalidCount === 0) return;
  issues.push({
    columnName: name,
    columnType: "nps",
    code: "NPS_INVALID_VALUES",
    message: `"${name}" has ${invalidCount.toLocaleString()} value(s) outside the valid NPS range (integer 0–10).`,
    severity: "warning",
    affectedCount: invalidCount,
  });
}

function checkRating(
  name: string,
  values: string[],
  issues: SchemaIssue[],
): void {
  let invalidCount = 0;
  for (const v of values) {
    const n = Number(v.trim());
    if (!Number.isInteger(n) || n < 1) invalidCount++;
  }
  if (invalidCount === 0) return;
  issues.push({
    columnName: name,
    columnType: "rating",
    code: "RATING_INVALID_VALUES",
    message: `"${name}" has ${invalidCount.toLocaleString()} value(s) that are not positive integers.`,
    severity: "warning",
    affectedCount: invalidCount,
  });
}

function checkNumeric(
  name: string,
  values: string[],
  issues: SchemaIssue[],
): void {
  let invalidCount = 0;
  for (const v of values) {
    if (isNaN(Number(v.trim()))) invalidCount++;
  }
  if (invalidCount === 0) return;
  issues.push({
    columnName: name,
    columnType: "numeric",
    code: "NUMERIC_INVALID_VALUES",
    message: `"${name}" has ${invalidCount.toLocaleString()} non-numeric value(s).`,
    severity: "warning",
    affectedCount: invalidCount,
  });
}

function checkDate(
  name: string,
  values: string[],
  issues: SchemaIssue[],
): void {
  let invalidCount = 0;
  for (const v of values) {
    const d = new Date(v.trim());
    if (isNaN(d.getTime())) invalidCount++;
  }
  if (invalidCount === 0) return;
  issues.push({
    columnName: name,
    columnType: "date",
    code: "DATE_INVALID_VALUES",
    message: `"${name}" has ${invalidCount.toLocaleString()} value(s) that could not be parsed as a date.`,
    severity: "warning",
    affectedCount: invalidCount,
  });
}
