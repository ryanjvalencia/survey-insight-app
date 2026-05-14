import type { ColumnMapping, ColumnType, Dataset } from "@/types";

const SAMPLE_LIMIT = 100;

export function inferColumnTypes(dataset: Dataset): ColumnMapping[] {
  return dataset.headers.map((name) => {
    const values = sampleNonEmpty(dataset, name);
    const hint = nameHint(name);
    const stats = values.length > 0 ? computeStats(values, dataset.rowCount) : null;
    const vHint = stats ? valueHint(stats) : null;
    const inferredType = resolveType(hint, vHint, values.length);
    const confidence = resolveConfidence(hint, vHint, inferredType, values.length);
    return { name, type: inferredType, inferredType, confidence };
  });
}

function sampleNonEmpty(dataset: Dataset, column: string): string[] {
  const result: string[] = [];
  for (const row of dataset.rows) {
    const v = row[column];
    if (v !== undefined && v.trim() !== "") {
      result.push(v.trim());
    }
    if (result.length >= SAMPLE_LIMIT) break;
  }
  return result;
}

// Match "nps" as a word-component in underscore/hyphen/space separated names,
// e.g. "nps", "nps_score", "customer_nps", "my_nps_score".
const NPS_NAME_RE = /(^|[_\s\-])nps([_\s\-]|$)|net.?promoter/i;

const NAME_HINTS: Array<[RegExp, ColumnType]> = [
  [NPS_NAME_RE, "nps"],
  [/_id$|^id$|^id_|^respondent|^response_id/i, "id"],
  [/\b(rating|score|stars)\b/i, "rating"],
  [/\b(date|time|timestamp|created_at|updated_at)\b/i, "date"],
  [/comments?|feedback|reason|description|notes?|texts?|response|answer/i, "open_text"],
  [/\b(category|type|segment|group|status|department|region|country|gender)\b/i, "category"],
];

function nameHint(name: string): ColumnType | null {
  for (const [pattern, type] of NAME_HINTS) {
    if (pattern.test(name)) return type;
  }
  return null;
}

function isNumeric(v: string): boolean {
  return v !== "" && !isNaN(Number(v));
}

function isIntegerStr(v: string): boolean {
  const n = Number(v);
  return !isNaN(n) && Number.isInteger(n);
}

// Require a recognizable date pattern before attempting Date parse to avoid false positives
const DATE_RE = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/;

function isDateStr(v: string): boolean {
  if (!DATE_RE.test(v)) return false;
  return !isNaN(new Date(v).getTime());
}

interface ValueStats {
  numericRatio: number;
  integerRatio: number;
  dateRatio: number;
  uniqueCount: number;
  uniqueRatio: number;
  min: number;
  max: number;
  avgLength: number;
  hasZero: boolean;
}

function computeStats(values: string[], totalRows: number): ValueStats {
  const numericVals = values.filter(isNumeric);
  const integerVals = values.filter(isIntegerStr);
  const dateVals = values.filter(isDateStr);
  const nums = numericVals.map(Number);
  const unique = new Set(values);

  return {
    numericRatio: numericVals.length / values.length,
    integerRatio: integerVals.length / values.length,
    dateRatio: dateVals.length / values.length,
    uniqueCount: unique.size,
    uniqueRatio: unique.size / Math.min(values.length, totalRows),
    min: nums.length > 0 ? Math.min(...nums) : Infinity,
    max: nums.length > 0 ? Math.max(...nums) : -Infinity,
    avgLength: values.reduce((s, v) => s + v.length, 0) / values.length,
    hasZero: numericVals.some((v) => Number(v) === 0),
  };
}

function valueHint(s: ValueStats): ColumnType | null {
  // NPS: integers in [0, 10] with at least one zero, ≤11 unique values
  if (
    s.numericRatio >= 0.9 &&
    s.integerRatio >= 0.9 &&
    s.hasZero &&
    s.min >= 0 &&
    s.max <= 10 &&
    s.uniqueCount <= 11
  ) {
    return "nps";
  }

  // Rating: integers in [1, 10] with low cardinality
  if (
    s.numericRatio >= 0.9 &&
    s.integerRatio >= 0.9 &&
    s.min >= 1 &&
    s.max <= 10 &&
    s.uniqueCount <= 10
  ) {
    return "rating";
  }

  // Numeric: mostly parseable as numbers
  if (s.numericRatio >= 0.9) return "numeric";

  // Date: mostly match date pattern
  if (s.dateRatio >= 0.8) return "date";

  // Open text: long average value length (checked before category to avoid misclassifying)
  if (s.avgLength > 25) return "open_text";

  // Category: low cardinality non-numeric, not all unique (uniqueRatio guard prevents codes)
  if (s.numericRatio < 0.5 && s.uniqueCount <= 15 && s.uniqueRatio < 0.5) {
    return "category";
  }

  // Open text: high cardinality non-numeric with medium-length values
  if (s.numericRatio < 0.5 && s.avgLength > 10 && s.uniqueRatio > 0.5) {
    return "open_text";
  }

  return null;
}

// Name hint always wins when present; fall back to value hint, then "unknown".
function resolveType(
  hint: ColumnType | null,
  vHint: ColumnType | null,
  valueCount: number,
): ColumnType {
  if (valueCount === 0) return "ignore";
  if (hint !== null) return hint;
  return vHint ?? "unknown";
}

function resolveConfidence(
  hint: ColumnType | null,
  vHint: ColumnType | null,
  inferredType: ColumnType,
  valueCount: number,
): number {
  if (valueCount === 0) return 1.0;

  const nameAgrees = hint === inferredType;
  const valueAgrees = vHint === inferredType;

  if (nameAgrees && valueAgrees) return 0.95;
  if (nameAgrees || valueAgrees) return 0.75;
  if (inferredType === "unknown") return 0.4;
  return 0.5;
}
