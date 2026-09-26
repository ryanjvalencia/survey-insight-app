import type {
  NPSResult,
  RatingResult,
  NumericResult,
  CategoryResult,
  HistogramBin,
  QuantitativeAnalysis,
} from "@/lib/analysis";
import type { TextColumnAnalysis, TextAnalysis } from "@/lib/text";

// ── Chart types ───────────────────────────────────────────────────────────────

export type ChartType =
  | "nps_gauge"
  | "bar"
  | "histogram"
  | "pie"
  | "word_cloud_data";

export interface BarDataPoint {
  label: string;
  value: number;
}

export interface NPSGaugeChart {
  type: "nps_gauge";
  columnName: string;
  score: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  totalResponses: number;
  /** Average raw answer on the 0–10 scale (the NPS itself is −100 to +100). */
  mean: number;
}

export interface BarChart {
  type: "bar";
  columnName: string;
  title: string;
  data: BarDataPoint[];
  xLabel: string;
  yLabel: string;
}

export interface HistogramChart {
  type: "histogram";
  columnName: string;
  title: string;
  data: BarDataPoint[];
  /** Exact bin edges and counts (absent in results saved before bins existed). */
  bins?: HistogramBin[];
  mean: number;
  median: number;
}

export interface PieChart {
  type: "pie";
  columnName: string;
  title: string;
  data: BarDataPoint[];
}

export interface WordCloudDataChart {
  type: "word_cloud_data";
  columnName: string;
  words: Array<{ word: string; count: number; weight: number }>;
}

export type ChartSpec =
  | NPSGaugeChart
  | BarChart
  | HistogramChart
  | PieChart
  | WordCloudDataChart;

export interface ChartSet {
  charts: ChartSpec[];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Transforms analysis results into chart-ready data structures.
 * Returns one ChartSpec per column (type determined by column type).
 */
export function buildCharts(
  quant: QuantitativeAnalysis,
  text: TextAnalysis,
): ChartSet {
  const charts: ChartSpec[] = [
    ...quant.nps.map(npsGauge),
    ...quant.ratings.map(ratingBar),
    ...quant.numerics.map(numericHistogram),
    ...quant.categories.map(categoryPie),
    ...text.columns.map(wordCloudData),
  ];
  return { charts };
}

// ── Transformers ──────────────────────────────────────────────────────────────

function npsGauge(r: NPSResult): NPSGaugeChart {
  return {
    type: "nps_gauge",
    columnName: r.columnName,
    score: r.score,
    promoterPct: r.promoterPct,
    passivePct: r.passivePct,
    detractorPct: r.detractorPct,
    totalResponses: r.totalResponses,
    mean: r.mean,
  };
}

/**
 * Formats a Net Promoter Score (−100 to +100) with an explicit sign, e.g.
 * "+17.6", "−4", "0". Uses a true minus sign for readability.
 */
export function formatNpsScore(score: number): string {
  if (!Number.isFinite(score)) return "—";
  const rounded = Math.round(score * 10) / 10;
  if (rounded === 0) return "0";
  const abs = Math.abs(rounded).toString();
  return rounded > 0 ? `+${abs}` : `−${abs}`;
}

function ratingBar(r: RatingResult): BarChart {
  const sortedKeys = Object.keys(r.distribution).sort(
    (a, b) => Number(a) - Number(b),
  );
  return {
    type: "bar",
    columnName: r.columnName,
    title: `${r.columnName} distribution`,
    data: sortedKeys.map((k) => ({ label: k, value: r.distribution[k] })),
    xLabel: "Rating",
    yLabel: "Responses",
  };
}

function numericHistogram(r: NumericResult): HistogramChart {
  // Older saved results predate `bins`; show an empty chart rather than crash.
  const bins = r.bins ?? [];
  return {
    type: "histogram",
    columnName: r.columnName,
    title: `${r.columnName} distribution`,
    bins,
    data: bins.map((b) => ({
      label: b.lo === b.hi ? formatBinEdge(b.lo) : `${formatBinEdge(b.lo)}–${formatBinEdge(b.hi)}`,
      value: b.count,
    })),
    mean: r.mean,
    median: r.median,
  };
}

/**
 * Most slices a pie shows. Beyond this, the smallest categories fold into
 * "Other" — past ~6 segments slices become too thin to compare.
 */
export const MAX_PIE_SLICES = 6;

function categoryPie(r: CategoryResult): PieChart {
  const fitsAll = r.frequencies.length <= MAX_PIE_SLICES;
  const topN = fitsAll ? r.frequencies : r.frequencies.slice(0, MAX_PIE_SLICES - 1);
  const shown = topN.reduce((acc, f) => acc + f.count, 0);
  // Derive "Other" from the column total so it stays correct even when the
  // frequency list was truncated for storage.
  const otherCount = Math.max(0, r.totalResponses - shown);
  const data: BarDataPoint[] = topN.map((f) => ({
    label: f.value,
    value: f.count,
  }));
  if (otherCount > 0) data.push({ label: "Other", value: otherCount });
  return {
    type: "pie",
    columnName: r.columnName,
    title: `${r.columnName} breakdown`,
    data,
  };
}

function wordCloudData(r: TextColumnAnalysis): WordCloudDataChart {
  const maxCount = r.topWords[0]?.count ?? 1;
  return {
    type: "word_cloud_data",
    columnName: r.columnName,
    words: r.topWords.map((w) => ({
      word: w.word,
      count: w.count,
      weight: Math.round((w.count / maxCount) * 100) / 100,
    })),
  };
}

/**
 * Builds N evenly-spaced histogram buckets between min and max.
 * Returns count=0 for empty buckets (callers may filter as needed).
 */
/** Short bin label: whole numbers with separators for large values, else 1 dp. */
export function formatBinEdge(n: number): string {
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString("en-US");
  return String(Math.round(n * 10) / 10);
}
