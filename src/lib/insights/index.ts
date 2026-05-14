import type { QuantitativeAnalysis } from "@/lib/analysis";
import type { TextAnalysis } from "@/lib/text";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InsightSeverity = "positive" | "neutral" | "negative";

export interface Insight {
  id: string;
  title: string;
  body: string;
  severity: InsightSeverity;
  columnName: string;
}

export interface InsightReport {
  insights: Insight[];
  summary: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates rule-based plain-English insights from analysis results.
 * No AI API calls — all rules are deterministic.
 * Never includes raw response content.
 */
export function generateInsights(
  quant: QuantitativeAnalysis,
  text: TextAnalysis,
): InsightReport {
  const insights: Insight[] = [
    ...quant.nps.flatMap(npsInsights),
    ...quant.ratings.flatMap(ratingInsights),
    ...quant.numerics.flatMap(numericInsights),
    ...quant.categories.flatMap(categoryInsights),
    ...text.columns.flatMap(textInsights),
  ];

  const summary = buildSummary(insights, quant, text);
  return { insights, summary };
}

// ── NPS insights ──────────────────────────────────────────────────────────────

function npsInsights(r: {
  columnName: string;
  score: number;
  promoterPct: number;
  detractorPct: number;
  passivePct: number;
  totalResponses: number;
}): Insight[] {
  const results: Insight[] = [];

  const severity: InsightSeverity =
    r.score >= 30 ? "positive" : r.score >= 0 ? "neutral" : "negative";

  results.push({
    id: `nps_score_${r.columnName}`,
    title: `NPS score: ${r.score}`,
    body: `"${r.columnName}" has an NPS of ${r.score} from ${r.totalResponses.toLocaleString()} responses. ${r.promoterPct}% are promoters, ${r.passivePct}% passives, and ${r.detractorPct}% detractors.`,
    severity,
    columnName: r.columnName,
  });

  if (r.detractorPct > 40) {
    results.push({
      id: `nps_high_detractors_${r.columnName}`,
      title: "High detractor rate",
      body: `${r.detractorPct}% of respondents gave a score of 6 or below on "${r.columnName}". Investigating root causes could significantly improve the NPS.`,
      severity: "negative",
      columnName: r.columnName,
    });
  }

  if (r.promoterPct > 60) {
    results.push({
      id: `nps_strong_promoters_${r.columnName}`,
      title: "Strong promoter base",
      body: `More than ${r.promoterPct}% of respondents are promoters on "${r.columnName}". Leveraging this group for referrals or testimonials could amplify growth.`,
      severity: "positive",
      columnName: r.columnName,
    });
  }

  return results;
}

// ── Rating insights ───────────────────────────────────────────────────────────

function ratingInsights(r: {
  columnName: string;
  mean: number;
  min: number;
  max: number;
  totalResponses: number;
}): Insight[] {
  const severity: InsightSeverity =
    r.mean >= 4 ? "positive" : r.mean >= 2.5 ? "neutral" : "negative";

  return [
    {
      id: `rating_mean_${r.columnName}`,
      title: `Average rating: ${r.mean}`,
      body: `"${r.columnName}" averaged ${r.mean} out of a ${r.min}–${r.max} range across ${r.totalResponses.toLocaleString()} responses.`,
      severity,
      columnName: r.columnName,
    },
  ];
}

// ── Numeric insights ──────────────────────────────────────────────────────────

function numericInsights(r: {
  columnName: string;
  mean: number;
  median: number;
  stdDev: number;
  totalResponses: number;
}): Insight[] {
  const insights: Insight[] = [
    {
      id: `numeric_mean_${r.columnName}`,
      title: `"${r.columnName}" average: ${r.mean}`,
      body: `Mean is ${r.mean}, median is ${r.median} (std dev ${r.stdDev}) across ${r.totalResponses.toLocaleString()} responses.`,
      severity: "neutral",
      columnName: r.columnName,
    },
  ];

  if (r.stdDev > r.mean * 0.5 && r.mean !== 0) {
    insights.push({
      id: `numeric_spread_${r.columnName}`,
      title: `High variability in "${r.columnName}"`,
      body: `The standard deviation (${r.stdDev}) is more than 50% of the mean (${r.mean}), indicating a wide spread of values in "${r.columnName}".`,
      severity: "neutral",
      columnName: r.columnName,
    });
  }

  return insights;
}

// ── Category insights ─────────────────────────────────────────────────────────

function categoryInsights(r: {
  columnName: string;
  frequencies: Array<{ value: string; count: number; pct: number }>;
  uniqueCount: number;
  totalResponses: number;
}): Insight[] {
  if (r.frequencies.length === 0) return [];

  const top = r.frequencies[0];
  return [
    {
      id: `category_top_${r.columnName}`,
      title: `Most common "${r.columnName}": ${top.value}`,
      body: `"${top.value}" accounts for ${top.pct}% of responses (${top.count.toLocaleString()} of ${r.totalResponses.toLocaleString()}) in "${r.columnName}". There are ${r.uniqueCount} unique values total.`,
      severity: "neutral",
      columnName: r.columnName,
    },
  ];
}

// ── Text insights ─────────────────────────────────────────────────────────────

function textInsights(r: {
  columnName: string;
  topWords: Array<{ word: string; count: number }>;
  sentiment: {
    positivePct: number;
    negativePct: number;
    total: number;
  };
  totalResponses: number;
}): Insight[] {
  const insights: Insight[] = [];

  const sentimentSeverity: InsightSeverity =
    r.sentiment.positivePct > 50
      ? "positive"
      : r.sentiment.negativePct > 30
        ? "negative"
        : "neutral";

  insights.push({
    id: `text_sentiment_${r.columnName}`,
    title: `Sentiment in "${r.columnName}"`,
    body: `Of ${r.totalResponses.toLocaleString()} responses, ${r.sentiment.positivePct}% appear positive and ${r.sentiment.negativePct}% appear negative (proxy sentiment — word-list based).`,
    severity: sentimentSeverity,
    columnName: r.columnName,
  });

  if (r.topWords.length > 0) {
    const topThree = r.topWords.slice(0, 3).map((w) => `"${w.word}"`);
    insights.push({
      id: `text_top_words_${r.columnName}`,
      title: `Top themes in "${r.columnName}"`,
      body: `The most frequently used words in "${r.columnName}" are ${topThree.join(", ")}.`,
      severity: "neutral",
      columnName: r.columnName,
    });
  }

  return insights;
}

// ── Summary ───────────────────────────────────────────────────────────────────

function buildSummary(
  insights: Insight[],
  quant: QuantitativeAnalysis,
  text: TextAnalysis,
): string {
  const parts: string[] = [];

  const totalCols =
    quant.nps.length +
    quant.ratings.length +
    quant.numerics.length +
    quant.categories.length +
    text.columns.length;

  parts.push(`Analysed ${totalCols} column(s).`);

  const negativeCount = insights.filter((i) => i.severity === "negative").length;
  const positiveCount = insights.filter((i) => i.severity === "positive").length;

  if (positiveCount > 0)
    parts.push(`${positiveCount} positive finding(s).`);
  if (negativeCount > 0)
    parts.push(`${negativeCount} area(s) needing attention.`);

  return parts.join(" ");
}
