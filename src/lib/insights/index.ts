import type {
  CategoryResult,
  NPSResult,
  NumericResult,
  QuantitativeAnalysis,
  RatingResult,
} from "@/lib/analysis";
import type { TextAnalysis, TextColumnAnalysis } from "@/lib/text";
import { formatNpsScore } from "@/lib/charts";
import { formatCount, formatPercent } from "@/lib/format";
import { capitalize, formatValue, interpretColumn } from "./columns";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InsightSeverity = "positive" | "neutral" | "negative";

export interface Insight {
  id: string;
  /** Plain-language headline stating what the finding means. */
  title: string;
  /** One or two sentences: the evidence and why it matters / what to do. */
  body: string;
  severity: InsightSeverity;
  columnName: string;
  /** The single figure to feature alongside the headline. */
  metric?: { value: string; label: string };
  /** Short topic tag, e.g. "Recommendation" or "Annual revenue". */
  topic?: string;
  /** Higher is more important; insights are returned sorted by it. */
  priority?: number;
}

export interface InsightReport {
  insights: Insight[];
  summary: string;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates rule-based, plain-English insights from analysis results.
 * Deterministic — no AI API calls. Uses aggregates only (counts, averages,
 * category labels, top words), never individual responses. Insights are
 * sorted most important first.
 */
export function generateInsights(
  quant: QuantitativeAnalysis,
  text: TextAnalysis,
): InsightReport {
  const insights: Insight[] = [
    ...quant.nps.flatMap(npsInsights),
    ...quant.ratings.flatMap(ratingInsights),
    ...quant.numerics.flatMap(numericInsights),
    ...categoryGroupInsights(quant.categories),
    ...text.columns.flatMap(textInsights),
  ].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  return { insights, summary: buildSummary(insights, quant, text) };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Rounds to 3 significant figures for headlines: 126_646 → 127_000. */
export function roundForHeadline(n: number): number {
  if (n === 0 || !Number.isFinite(n)) return n;
  const magnitude = 10 ** (Math.floor(Math.log10(Math.abs(n))) - 2);
  return magnitude >= 1 ? Math.round(n / magnitude) * magnitude : n;
}

/** One decimal place for averages on small scales: 4.07 → "4.1". */
function oneDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

/** 41 → "about 4 in 10". */
function inTen(pct: number): string {
  return `about ${Math.round(pct / 10)} in 10`;
}

function listWords(words: string[]): string {
  const quoted = words.map((w) => `“${w}”`);
  if (quoted.length <= 1) return quoted.join("");
  return `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}`;
}

/** Benchmark band for an NPS score (common reference ranges). */
function npsBand(score: number): string {
  if (score < 0) return "Needs work";
  if (score < 30) return "Good";
  if (score < 70) return "Great";
  return "Excellent";
}

// ── NPS ───────────────────────────────────────────────────────────────────────

function npsInsights(r: NPSResult): Insight[] {
  const results: Insight[] = [];
  const score = formatNpsScore(r.score);

  const severity: InsightSeverity =
    r.score >= 30 ? "positive" : r.score >= 0 ? "neutral" : "negative";

  const headline =
    r.score >= 50
      ? "Customers are eager to recommend you"
      : r.score >= 30
        ? "Customers are strong advocates"
        : r.score > 5
          ? "More customers would recommend you than warn others off"
          : r.score >= -5
            ? "Customers are split on recommending you"
            : "More customers would warn others off than recommend you";

  const nextStep =
    r.score >= 30
      ? "Keep promoters engaged — they're your best source of referrals and reviews."
      : `The ${formatPercent(r.passivePct)} who answered 7–8 are on the fence and the easiest to win over.`;

  results.push({
    id: `nps_score_${r.columnName}`,
    title: headline,
    body: `${formatPercent(r.promoterPct)} would recommend you (9–10) and ${formatPercent(r.detractorPct)} wouldn't (0–6), for a Net Promoter Score of ${score} on a −100 to +100 scale — in the “${npsBand(r.score)}” range. The average answer was ${oneDecimal(r.mean)} out of 10. ${nextStep}`,
    severity,
    columnName: r.columnName,
    metric: { value: score, label: "Net Promoter Score" },
    topic: "Recommendation",
    priority: 100,
  });

  if (r.detractorPct > 40) {
    results.push({
      id: `nps_high_detractors_${r.columnName}`,
      title: `${capitalize(inTen(r.detractorPct))} customers would advise others against you`,
      body: `${formatPercent(r.detractorPct)} of respondents scored 6 or lower. Reaching out to these customers is the fastest way to find — and fix — what's driving dissatisfaction.`,
      severity: "negative",
      columnName: r.columnName,
      metric: { value: formatPercent(r.detractorPct), label: "detractors" },
      topic: "Recommendation",
      priority: 95,
    });
  }

  if (r.promoterPct > 60) {
    results.push({
      id: `nps_strong_promoters_${r.columnName}`,
      title: "Most customers are enthusiastic fans",
      body: `${formatPercent(r.promoterPct)} scored 9 or 10. Ask them for referrals, reviews, or case studies while goodwill is high.`,
      severity: "positive",
      columnName: r.columnName,
      metric: { value: formatPercent(r.promoterPct), label: "promoters" },
      topic: "Recommendation",
      priority: 90,
    });
  }

  return results;
}

// ── Ratings ───────────────────────────────────────────────────────────────────

/** Infers the rating scale's top value from the highest answer seen. */
function ratingScale(max: number): number {
  if (max <= 5) return 5;
  if (max <= 7) return 7;
  return 10;
}

function ratingInsights(r: RatingResult): Insight[] {
  const meaning = interpretColumn(r.columnName);
  const { inferred } = meaning;
  // "satisfaction rating" → "satisfaction": the sentence already says it's a score.
  const label = inferred ? meaning.label.replace(/\s(rating|score)$/, "") : meaning.label;
  const scale = ratingScale(r.max);
  const share = r.mean / scale;
  const topFrom = scale - 1; // e.g. 4–5 on a 5-point scale
  const bottomTo = Math.max(1, Math.floor(scale * 0.4)); // e.g. 1–2 on a 5-point scale

  let top = 0;
  let bottom = 0;
  for (const [answer, count] of Object.entries(r.distribution)) {
    const v = Number(answer);
    if (v >= topFrom) top += count;
    if (v <= bottomTo) bottom += count;
  }
  const topPct = r.totalResponses > 0 ? (top / r.totalResponses) * 100 : 0;
  const bottomPct = r.totalResponses > 0 ? (bottom / r.totalResponses) * 100 : 0;

  const subject = inferred ? capitalize(label) : `Ratings for ${label}`;
  const [headline, severity]: [string, InsightSeverity] =
    share >= 0.8
      ? [`${subject} is high`, "positive"]
      : share >= 0.65
        ? [`${subject} is solid, with room to grow`, "neutral"]
        : share >= 0.45
          ? [`${subject} is mixed`, "neutral"]
          : [`${subject} is low`, "negative"];

  const topRange = `${topFrom} or ${scale}`;
  const bottomRange = bottomTo > 1 ? `1 or ${bottomTo}` : "1";

  return [
    {
      id: `rating_mean_${r.columnName}`,
      title: headline,
      body: `The average score was ${oneDecimal(r.mean)} out of ${scale} across ${formatCount(r.totalResponses)} responses. ${formatPercent(topPct)} gave a ${topRange}, while ${formatPercent(bottomPct)} gave a ${bottomRange}.`,
      severity,
      columnName: r.columnName,
      metric: {
        value: `${oneDecimal(r.mean)} / ${scale}`,
        label: `average ${inferred ? label : "rating"}`,
      },
      topic: inferred ? capitalize(label) : "Rating",
      priority: 80,
    },
  ];
}

// ── Numeric ───────────────────────────────────────────────────────────────────

function numericInsights(r: NumericResult): Insight[] {
  const { label, inferred, kind } = interpretColumn(r.columnName);
  const fmt = (n: number) => formatValue(n, kind);
  // Headlines round large numbers ("about $127,000"); details stay exact.
  const headlineValue = (n: number) => {
    const rounded = roundForHeadline(n);
    return rounded === n ? fmt(n) : `about ${fmt(rounded)}`;
  };
  const noun = inferred ? label : "value";
  const topic = inferred ? capitalize(label) : "Numbers";

  const insights: Insight[] = [
    {
      id: `numeric_mean_${r.columnName}`,
      title: `The typical ${noun} is ${headlineValue(r.median)}`,
      body: `Half of respondents are above ${fmt(r.median)} and half below${inferred ? "" : ` for ${label}`}. Answers range from ${fmt(r.min)} to ${fmt(r.max)}, with an average of ${fmt(r.mean)}.`,
      severity: "neutral",
      columnName: r.columnName,
      metric: { value: fmt(roundForHeadline(r.median)), label: `typical ${noun}` },
      topic,
      priority: 50,
    },
  ];

  const skewed = r.median > 0 && r.mean > r.median * 1.25;
  if (skewed) {
    insights.push({
      id: `numeric_skew_${r.columnName}`,
      title: `A few large values pull the average ${noun} up`,
      body: `The average (${fmt(r.mean)}) is well above the typical ${noun} (${fmt(r.median)}). When describing a typical respondent, quote the median rather than the average.`,
      severity: "neutral",
      columnName: r.columnName,
      metric: { value: fmt(r.mean), label: `average ${noun}` },
      topic,
      priority: 46,
    });
  } else if (r.stdDev > r.mean * 0.5 && r.mean !== 0) {
    insights.push({
      id: `numeric_spread_${r.columnName}`,
      title: `${capitalize(noun)} varies widely between respondents`,
      body: `Answers range from ${fmt(r.min)} to ${fmt(r.max)}. Compare like with like — for example by segment or plan — before drawing conclusions from the average.`,
      severity: "neutral",
      columnName: r.columnName,
      metric: { value: `${fmt(r.min)} – ${fmt(r.max)}`, label: "range" },
      topic,
      priority: 45,
    });
  }

  return insights;
}

// ── Categories ────────────────────────────────────────────────────────────────

/** True when no value stands out: the largest share is near an even split. */
function isEvenSpread(r: CategoryResult): boolean {
  const top = r.frequencies[0];
  return Boolean(top) && r.uniqueCount >= 3 && top.pct < (100 / r.uniqueCount) * 1.4;
}

/**
 * One insight per category column, except that several evenly split columns
 * are combined into a single "balanced sample" insight to avoid repetition.
 */
function categoryGroupInsights(categories: CategoryResult[]): Insight[] {
  const withData = categories.filter((c) => c.frequencies.length > 0);
  const even = withData.filter(isEvenSpread);
  if (even.length < 2) return withData.flatMap(categoryInsights);

  const names = even.map((c) => interpretColumn(c.columnName).label);
  const list =
    names.length === 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const detail = even
    .map((c) => `${capitalize(interpretColumn(c.columnName).label)}: ${c.uniqueCount} groups, largest ${c.frequencies[0].value} at ${formatPercent(c.frequencies[0].pct)}.`)
    .join(" ");

  return [
    ...withData.filter((c) => !isEvenSpread(c)).flatMap(categoryInsights),
    {
      id: `category_balanced_${even.map((c) => c.columnName).join("_")}`,
      title: `Your sample is well balanced across ${list}`,
      body: `No single group dominates, so overall results aren't skewed toward one segment. ${detail}`,
      severity: "positive",
      columnName: even[0].columnName,
      metric: { value: String(even.length), label: "balanced breakdowns" },
      topic: "Sample mix",
      priority: 42,
    },
  ];
}

function categoryInsights(r: CategoryResult): Insight[] {
  if (r.frequencies.length === 0) return [];
  const { label, inferred } = interpretColumn(r.columnName);
  const [top, second, third] = r.frequencies;
  const group = inferred ? label : "answer";
  const topic = inferred ? capitalize(label) : "Breakdown";

  const followers = [second, third]
    .filter(Boolean)
    .map((f) => `${f.value} (${formatPercent(f.pct)})`);
  const followedBy = followers.length > 0 ? `, followed by ${followers.join(" and ")}` : "";

  const isEven = isEvenSpread(r);

  const title =
    top.pct >= 50
      ? `Most responses come from ${top.value}`
      : isEven
        ? `Responses are spread evenly across ${r.uniqueCount} ${group} groups`
        : `${top.value} is the largest ${group} group`;

  const body = isEven
    ? `No single ${group} dominates: the largest, ${top.value}, is ${formatPercent(top.pct)} of responses${followedBy}. Results reflect a balanced mix.`
    : `${top.value} accounts for ${formatPercent(top.pct)} of responses${followedBy}. Keep this mix in mind — overall results lean toward ${top.value}.`;

  return [
    {
      id: `category_top_${r.columnName}`,
      title,
      body,
      severity: "neutral",
      columnName: r.columnName,
      metric: { value: formatPercent(top.pct), label: top.value },
      topic,
      priority: 40,
    },
  ];
}

// ── Open text ─────────────────────────────────────────────────────────────────

function textInsights(r: TextColumnAnalysis): Insight[] {
  if (r.totalResponses === 0) return [];
  const { label, inferred } = interpretColumn(r.columnName);
  const pos = r.sentiment.positivePct;
  const neg = r.sentiment.negativePct;
  const subject = inferred ? capitalize(label) : "Written answers";

  const [title, severity]: [string, InsightSeverity] =
    pos > 50 && pos >= neg + 20
      ? [`${subject} are mostly positive`, "positive"]
      : neg > 30 || neg > pos + 10
        ? [`${subject} raise more complaints than praise`, "negative"]
        : [`${subject} are mixed`, "neutral"];

  const topics =
    r.topWords.length > 0
      ? ` The most mentioned words were ${listWords(r.topWords.slice(0, 3).map((w) => w.word))}.`
      : "";

  return [
    {
      id: `text_sentiment_${r.columnName}`,
      title,
      body: `${formatPercent(pos)} of ${formatCount(r.totalResponses)} written answers read as positive and ${formatPercent(neg)} as negative.${topics}`,
      severity,
      columnName: r.columnName,
      metric: { value: formatPercent(pos), label: "positive" },
      topic: inferred ? capitalize(label) : "Comments",
      priority: severity === "negative" ? 85 : 70,
    },
  ];
}

// ── Summary ───────────────────────────────────────────────────────────────────

function buildSummary(
  insights: Insight[],
  quant: QuantitativeAnalysis,
  text: TextAnalysis,
): string {
  if (insights.length === 0) {
    return "No findings yet — mark at least one column as NPS, rating, numeric, category, or open text.";
  }
  const responses = Math.max(
    0,
    ...[...quant.nps, ...quant.ratings, ...quant.numerics, ...quant.categories, ...text.columns].map(
      (c) => c.totalResponses,
    ),
  );
  const strengths = insights.filter((i) => i.severity === "positive").length;
  const concerns = insights.filter((i) => i.severity === "negative").length;
  const parts: string[] = [];
  if (strengths > 0) parts.push(`${strengths} strength${strengths === 1 ? "" : "s"}`);
  if (concerns > 0) parts.push(`${concerns} ${concerns === 1 ? "area" : "areas"} to watch`);
  const tally = parts.length > 0 ? `, including ${parts.join(" and ")}` : "";

  return `${insights.length} finding${insights.length === 1 ? "" : "s"} from ${formatCount(responses)} responses${tally} — most important first.`;
}
