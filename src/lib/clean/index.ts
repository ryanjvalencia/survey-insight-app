import type {
  ColumnCleaningStats,
  ColumnMapping,
  ColumnType,
  CleaningResult,
  Dataset,
} from "@/types";

/**
 * Cleans a parsed Dataset according to confirmed ColumnMappings.
 * Operations per column type:
 *   - All types: trim whitespace
 *   - nps:     non-integer or non-numeric → nullify; out of [0,10] → clamp
 *   - rating:  non-integer or < 1 → nullify or clamp (< 1 clamped to 1)
 *   - numeric: strip currency/thousands formatting; non-finite → nullify
 *   - date:    parse and reformat to YYYY-MM-DD; unparseable → nullify
 *   - ignore/id/category/open_text/unknown: trim only
 *
 * Never logs or returns cell values — only counts in CleaningSummary.
 */
export function cleanDataset(
  dataset: Dataset,
  mappings: ColumnMapping[],
): CleaningResult {
  const typeMap = new Map<string, ColumnType>(
    mappings.map((m) => [m.name, m.type]),
  );

  const statsMap = new Map<string, ColumnCleaningStats>(
    dataset.headers.map((h) => [
      h,
      { columnName: h, trimmed: 0, nullified: 0, clamped: 0, normalized: 0 },
    ]),
  );

  const cleanedRows = dataset.rows.map((row) => {
    const cleaned: Record<string, string> = {};
    for (const header of dataset.headers) {
      const raw = row[header] ?? "";
      const type = typeMap.get(header) ?? "unknown";
      const stats = statsMap.get(header)!;
      cleaned[header] = cleanValue(raw, type, stats);
    }
    return cleaned;
  });

  const columns = Array.from(statsMap.values());
  const totalChanges = columns.reduce(
    (acc, c) => acc + c.trimmed + c.nullified + c.clamped + c.normalized,
    0,
  );

  return {
    dataset: { ...dataset, rows: cleanedRows },
    summary: {
      totalRows: dataset.rowCount,
      totalColumns: dataset.headers.length,
      columns,
      totalChanges,
    },
  };
}

function cleanValue(
  raw: string,
  type: ColumnType,
  stats: ColumnCleaningStats,
): string {
  const trimmed = raw.trim();
  if (trimmed !== raw) stats.trimmed++;
  if (!trimmed) return trimmed;

  switch (type) {
    case "nps":
      return cleanNPS(trimmed, stats);
    case "rating":
      return cleanRating(trimmed, stats);
    case "numeric":
      return cleanNumeric(trimmed, stats);
    case "date":
      return cleanDate(trimmed, stats);
    default:
      return trimmed;
  }
}

function cleanNPS(v: string, stats: ColumnCleaningStats): string {
  const n = Number(v);
  if (!Number.isInteger(n) || isNaN(n)) {
    stats.nullified++;
    return "";
  }
  if (n < 0) {
    stats.clamped++;
    return "0";
  }
  if (n > 10) {
    stats.clamped++;
    return "10";
  }
  return String(n);
}

function cleanRating(v: string, stats: ColumnCleaningStats): string {
  const n = Number(v);
  if (!Number.isInteger(n) || isNaN(n)) {
    stats.nullified++;
    return "";
  }
  if (n < 1) {
    stats.clamped++;
    return "1";
  }
  return String(n);
}

function cleanNumeric(v: string, stats: ColumnCleaningStats): string {
  const stripped = v.replace(/[$£€,]/g, "");
  const n = Number(stripped);
  if (isNaN(n) || !isFinite(n)) {
    stats.nullified++;
    return "";
  }
  const result = String(n);
  if (result !== v) stats.normalized++;
  return result;
}

function cleanDate(v: string, stats: ColumnCleaningStats): string {
  const d = new Date(v);
  if (isNaN(d.getTime())) {
    stats.nullified++;
    return "";
  }
  const iso = d.toISOString().slice(0, 10);
  if (iso !== v) stats.normalized++;
  return iso;
}
