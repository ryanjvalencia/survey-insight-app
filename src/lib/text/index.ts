import type { ColumnMapping, Dataset } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WordFrequency {
  word: string;
  count: number;
  pct: number;
}

export interface ResponseLengthStats {
  mean: number;
  median: number;
  min: number;
  max: number;
}

/** Proxy sentiment: counts responses that start with a positive/negative word. */
export interface SentimentCounts {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  positivePct: number;
  negativePct: number;
  neutralPct: number;
}

export interface TextColumnAnalysis {
  columnName: string;
  wordFrequencies: WordFrequency[];
  topWords: WordFrequency[];
  lengthStats: ResponseLengthStats;
  sentiment: SentimentCounts;
  totalResponses: number;
}

export interface TextAnalysis {
  columns: TextColumnAnalysis[];
}

// ── Stop words ────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","shall","can","need",
  "i","you","he","she","it","we","they","me","him","her","us","them",
  "my","your","his","its","our","their","this","that","these","those",
  "what","which","who","how","when","where","why","not","no","so","if",
  "as","by","from","up","about","into","than","more","also","just","very",
]);

// ── Sentiment word lists ──────────────────────────────────────────────────────

const POSITIVE_WORDS = new Set([
  "good","great","excellent","amazing","wonderful","fantastic","love","like",
  "best","helpful","easy","fast","happy","satisfied","perfect","awesome",
  "positive","pleased","recommend","impressive","outstanding","superb",
  "friendly","efficient","reliable","clear","useful","brilliant","nice",
]);

const NEGATIVE_WORDS = new Set([
  "bad","poor","terrible","awful","horrible","hate","dislike","worst",
  "slow","difficult","unhappy","unsatisfied","disappointing","frustrating",
  "negative","issue","problem","bug","error","broken","wrong","confusing",
  "useless","complicated","annoying","failure","fail","missing","lacking",
]);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyses open-text columns in the dataset.
 * Returns word frequencies, response length stats, and proxy sentiment.
 * Never logs or returns raw response content.
 */
export function analyzeText(
  dataset: Dataset,
  mappings: ColumnMapping[],
): TextAnalysis {
  const textMappings = mappings.filter((m) => m.type === "open_text");
  const columns = textMappings
    .map((m) => analyzeColumn(m.name, dataset))
    .filter((c) => c.totalResponses > 0);
  return { columns };
}

// ── Column analysis ───────────────────────────────────────────────────────────

function analyzeColumn(columnName: string, dataset: Dataset): TextColumnAnalysis {
  const responses = dataset.rows
    .map((r) => r[columnName] ?? "")
    .filter((v) => v.trim() !== "");

  const wordCounts = new Map<string, number>();
  const lengths: number[] = [];

  for (const response of responses) {
    lengths.push(response.length);
    for (const word of tokenize(response)) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }

  const totalWords = Array.from(wordCounts.values()).reduce((a, b) => a + b, 0);
  const wordFrequencies: WordFrequency[] = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({
      word,
      count,
      pct: totalWords > 0 ? round2((count / totalWords) * 100) : 0,
    }));

  return {
    columnName,
    wordFrequencies,
    topWords: wordFrequencies.slice(0, 20),
    lengthStats: computeLengthStats(lengths),
    sentiment: computeSentiment(responses),
    totalResponses: responses.length,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function computeLengthStats(lengths: number[]): ResponseLengthStats {
  if (lengths.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0 };
  }
  const sorted = [...lengths].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  return {
    mean: round2(lengths.reduce((a, b) => a + b, 0) / lengths.length),
    median: med,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function computeSentiment(responses: string[]): SentimentCounts {
  let positive = 0;
  let negative = 0;
  const total = responses.length;

  for (const r of responses) {
    const words = tokenize(r);
    const posHits = words.filter((w) => POSITIVE_WORDS.has(w)).length;
    const negHits = words.filter((w) => NEGATIVE_WORDS.has(w)).length;
    if (posHits > negHits) positive++;
    else if (negHits > posHits) negative++;
    // tie or zero hits → neutral
  }

  const neutral = total - positive - negative;
  return {
    positive,
    negative,
    neutral,
    total,
    positivePct: total > 0 ? round2((positive / total) * 100) : 0,
    negativePct: total > 0 ? round2((negative / total) * 100) : 0,
    neutralPct: total > 0 ? round2((neutral / total) * 100) : 0,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
