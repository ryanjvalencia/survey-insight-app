import type {
  NPSResult,
  RatingResult,
  NumericResult,
  CategoryResult,
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
  };
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
  const buckets = buildBuckets(r.min, r.max, 10);
  return {
    type: "histogram",
    columnName: r.columnName,
    title: `${r.columnName} distribution`,
    data: buckets,
    mean: r.mean,
    median: r.median,
  };
}

function categoryPie(r: CategoryResult): PieChart {
  const topN = r.frequencies.slice(0, 10);
  const otherCount = r.frequencies
    .slice(10)
    .reduce((acc, f) => acc + f.count, 0);
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
function buildBuckets(min: number, max: number, n: number): BarDataPoint[] {
  if (min === max) {
    return [{ label: String(min), value: 1 }];
  }
  const step = (max - min) / n;
  return Array.from({ length: n }, (_, i) => {
    const lo = min + i * step;
    const hi = lo + step;
    return {
      label: `${round1(lo)}–${round1(hi)}`,
      value: 0,
    };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
