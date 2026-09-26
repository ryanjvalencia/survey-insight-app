import type { CleaningSummary } from "@/types";
import type { QuantitativeAnalysis } from "@/lib/analysis";
import type { TextAnalysis } from "@/lib/text";
import type { InsightReport } from "@/lib/insights";
import type { ChartSet } from "@/lib/charts";

export const STORED_ANALYSIS_VERSION = 1;

/** Category frequency rows kept per column when persisting. */
export const MAX_STORED_CATEGORIES = 20;

/** Upper bound on the serialized payload accepted by the server. */
export const MAX_STORED_ANALYSIS_BYTES = 512 * 1024;

/**
 * Aggregated analysis results as persisted to the database. Contains counts,
 * statistics, and labels only — never raw rows or full responses.
 */
export interface StoredAnalysis {
  version: typeof STORED_ANALYSIS_VERSION;
  cleaning: CleaningSummary;
  quant: QuantitativeAnalysis;
  text: TextAnalysis;
  insights: InsightReport;
  charts: ChartSet;
}

/**
 * Builds the payload to persist, minimizing data derived from user content:
 * - `wordFrequencies` (every distinct word respondents typed, which can
 *   include names) is emptied; only the displayed `topWords` are kept.
 * - Category frequency tables keep the top MAX_STORED_CATEGORIES values, so a
 *   high-cardinality column mapped as "category" can't persist every value.
 *   `uniqueCount` and `totalResponses` still describe the full column.
 */
export function buildStoredAnalysis(input: {
  cleaning: CleaningSummary;
  quant: QuantitativeAnalysis;
  text: TextAnalysis;
  insights: InsightReport;
  charts: ChartSet;
}): StoredAnalysis {
  return {
    version: STORED_ANALYSIS_VERSION,
    cleaning: input.cleaning,
    quant: {
      ...input.quant,
      categories: input.quant.categories.map((c) => ({
        ...c,
        frequencies: c.frequencies.slice(0, MAX_STORED_CATEGORIES),
      })),
    },
    text: {
      columns: input.text.columns.map((c) => ({ ...c, wordFrequencies: [] })),
    },
    insights: input.insights,
    charts: input.charts,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasArrays(v: unknown, keys: string[]): boolean {
  return isRecord(v) && keys.every((k) => Array.isArray(v[k]));
}

/** Serialized size in bytes (UTF-8). */
export function serializedSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

/**
 * Validates an analysis payload received from the browser. Checks the
 * version, top-level structure, and size. Returns the payload re-minimized
 * with buildStoredAnalysis (so the server enforces the data limits even if a
 * client skips them), or null when malformed or too large.
 */
export function parseStoredAnalysis(input: unknown): StoredAnalysis | null {
  if (!isRecord(input)) return null;
  if (input.version !== STORED_ANALYSIS_VERSION) return null;

  const { cleaning, quant, text, insights, charts } = input;
  if (!hasArrays(cleaning, ["columns"])) return null;
  if (!hasArrays(quant, ["nps", "ratings", "numerics", "categories"])) return null;
  if (!hasArrays(text, ["columns"])) return null;
  if (!hasArrays(insights, ["insights"]) || typeof (insights as Record<string, unknown>).summary !== "string") {
    return null;
  }
  if (!hasArrays(charts, ["charts"])) return null;
  if (!(quant as QuantitativeAnalysis).categories.every((c) => isRecord(c) && Array.isArray(c.frequencies))) {
    return null;
  }
  if (!(text as TextAnalysis).columns.every((c) => isRecord(c))) return null;

  const stored = buildStoredAnalysis({
    cleaning: cleaning as CleaningSummary,
    quant: quant as QuantitativeAnalysis,
    text: text as TextAnalysis,
    insights: insights as InsightReport,
    charts: charts as ChartSet,
  });
  if (serializedSize(stored) > MAX_STORED_ANALYSIS_BYTES) return null;
  return stored;
}
