import type { ColumnMapping, Dataset } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NPSResult {
  columnName: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  totalResponses: number;
  mean: number;
}

export interface RatingResult {
  columnName: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  distribution: Record<string, number>;
  totalResponses: number;
}

export interface NumericResult {
  columnName: string;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  totalResponses: number;
}

export interface CategoryResult {
  columnName: string;
  frequencies: Array<{ value: string; count: number; pct: number }>;
  uniqueCount: number;
  totalResponses: number;
}

export interface QuantitativeAnalysis {
  nps: NPSResult[];
  ratings: RatingResult[];
  numerics: NumericResult[];
  categories: CategoryResult[];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes quantitative statistics for all mapped columns.
 * Only considers non-empty values. Never logs or returns cell values.
 */
export function analyzeQuantitative(
  dataset: Dataset,
  mappings: ColumnMapping[],
): QuantitativeAnalysis {
  const result: QuantitativeAnalysis = {
    nps: [],
    ratings: [],
    numerics: [],
    categories: [],
  };

  for (const m of mappings) {
    const values = nonEmpty(dataset, m.name);
    if (values.length === 0) continue;

    if (m.type === "nps") {
      const nums = toNumbers(values);
      if (nums.length > 0) result.nps.push(computeNPS(m.name, nums));
    } else if (m.type === "rating") {
      const nums = toNumbers(values);
      if (nums.length > 0) result.ratings.push(computeRating(m.name, nums));
    } else if (m.type === "numeric") {
      const nums = toNumbers(values);
      if (nums.length > 0) result.numerics.push(computeNumeric(m.name, nums));
    } else if (m.type === "category") {
      result.categories.push(computeCategory(m.name, values));
    }
  }

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nonEmpty(dataset: Dataset, col: string): string[] {
  return dataset.rows.map((r) => r[col] ?? "").filter((v) => v.trim() !== "");
}

function toNumbers(values: string[]): number[] {
  return values.map(Number).filter((n) => isFinite(n) && !isNaN(n));
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stdDev(nums: number[], avg: number): number {
  const variance =
    nums.reduce((acc, n) => acc + (n - avg) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Column-type computations ──────────────────────────────────────────────────

function computeNPS(name: string, nums: number[]): NPSResult {
  const promoters = nums.filter((n) => n >= 9).length;
  const passives = nums.filter((n) => n >= 7 && n <= 8).length;
  const detractors = nums.filter((n) => n <= 6).length;
  const total = nums.length;
  const score = round2(((promoters - detractors) / total) * 100);
  const avg = round2(mean(nums));
  return {
    columnName: name,
    score,
    promoters,
    passives,
    detractors,
    promoterPct: round2((promoters / total) * 100),
    passivePct: round2((passives / total) * 100),
    detractorPct: round2((detractors / total) * 100),
    totalResponses: total,
    mean: avg,
  };
}

function computeRating(name: string, nums: number[]): RatingResult {
  const sorted = [...nums].sort((a, b) => a - b);
  const distribution: Record<string, number> = {};
  for (const n of nums) {
    const key = String(n);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }
  return {
    columnName: name,
    mean: round2(mean(nums)),
    median: median(sorted),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    distribution,
    totalResponses: nums.length,
  };
}

function computeNumeric(name: string, nums: number[]): NumericResult {
  const sorted = [...nums].sort((a, b) => a - b);
  const avg = mean(nums);
  return {
    columnName: name,
    mean: round2(avg),
    median: median(sorted),
    stdDev: round2(stdDev(nums, avg)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    totalResponses: nums.length,
  };
}

function computeCategory(name: string, values: string[]): CategoryResult {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const total = values.length;
  const frequencies = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      count,
      pct: round2((count / total) * 100),
    }));
  return {
    columnName: name,
    frequencies,
    uniqueCount: counts.size,
    totalResponses: total,
  };
}
