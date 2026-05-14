import { describe, it, expect } from "vitest";
import { generateInsights } from "./index";
import type { QuantitativeAnalysis } from "@/lib/analysis";
import type { TextAnalysis } from "@/lib/text";

function emptyQuant(): QuantitativeAnalysis {
  return { nps: [], ratings: [], numerics: [], categories: [] };
}

function emptyText(): TextAnalysis {
  return { columns: [] };
}

function makeSentiment(positivePct: number, negativePct: number) {
  const neutralPct = 100 - positivePct - negativePct;
  return {
    positive: positivePct,
    negative: negativePct,
    neutral: neutralPct,
    total: 100,
    positivePct,
    negativePct,
    neutralPct,
  };
}

// ── NPS insights ──────────────────────────────────────────────────────────────

describe("generateInsights — NPS", () => {
  it("generates a score insight for each NPS column", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "score",
          score: 20,
          promoters: 3,
          passives: 2,
          detractors: 1,
          promoterPct: 50,
          passivePct: 33,
          detractorPct: 17,
          totalResponses: 6,
          mean: 7.5,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.id === "nps_score_score")).toBe(true);
  });

  it("marks NPS >= 30 as positive severity", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "s",
          score: 50,
          promoters: 5,
          passives: 3,
          detractors: 2,
          promoterPct: 50,
          passivePct: 30,
          detractorPct: 20,
          totalResponses: 10,
          mean: 8,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    const scoreInsight = insights.find((i) => i.id === "nps_score_s");
    expect(scoreInsight?.severity).toBe("positive");
  });

  it("marks NPS < 0 as negative severity", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "s",
          score: -10,
          promoters: 1,
          passives: 2,
          detractors: 7,
          promoterPct: 10,
          passivePct: 20,
          detractorPct: 70,
          totalResponses: 10,
          mean: 4,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    const scoreInsight = insights.find((i) => i.id === "nps_score_s");
    expect(scoreInsight?.severity).toBe("negative");
  });

  it("adds high-detractor insight when detractorPct > 40", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "s",
          score: -32,
          promoters: 1,
          passives: 2,
          detractors: 7,
          promoterPct: 10,
          passivePct: 20,
          detractorPct: 70,
          totalResponses: 10,
          mean: 4,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.id === "nps_high_detractors_s")).toBe(true);
  });

  it("adds strong-promoter insight when promoterPct > 60", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "s",
          score: 55,
          promoters: 7,
          passives: 2,
          detractors: 1,
          promoterPct: 70,
          passivePct: 20,
          detractorPct: 10,
          totalResponses: 10,
          mean: 9,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.id === "nps_strong_promoters_s")).toBe(true);
  });
});

// ── Rating insights ───────────────────────────────────────────────────────────

describe("generateInsights — rating", () => {
  it("generates a mean insight per rating column", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      ratings: [
        {
          columnName: "stars",
          mean: 3.8,
          median: 4,
          min: 1,
          max: 5,
          distribution: {},
          totalResponses: 20,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.columnName === "stars")).toBe(true);
  });

  it("marks mean >= 4 as positive", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      ratings: [
        {
          columnName: "stars",
          mean: 4.2,
          median: 4,
          min: 1,
          max: 5,
          distribution: {},
          totalResponses: 20,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    const ratingInsight = insights.find((i) => i.columnName === "stars");
    expect(ratingInsight?.severity).toBe("positive");
  });
});

// ── Numeric insights ──────────────────────────────────────────────────────────

describe("generateInsights — numeric", () => {
  it("generates a mean insight per numeric column", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      numerics: [
        {
          columnName: "age",
          mean: 35,
          median: 33,
          stdDev: 8,
          min: 18,
          max: 65,
          totalResponses: 50,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.columnName === "age")).toBe(true);
  });

  it("adds high-variability insight when stdDev > 50% of mean", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      numerics: [
        {
          columnName: "age",
          mean: 30,
          median: 25,
          stdDev: 20,
          min: 1,
          max: 90,
          totalResponses: 50,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.id === "numeric_spread_age")).toBe(true);
  });
});

// ── Category insights ─────────────────────────────────────────────────────────

describe("generateInsights — category", () => {
  it("generates a top-value insight per category column", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [
        {
          columnName: "segment",
          frequencies: [
            { value: "Enterprise", count: 8, pct: 80 },
            { value: "SMB", count: 2, pct: 20 },
          ],
          uniqueCount: 2,
          totalResponses: 10,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    const cat = insights.find((i) => i.id === "category_top_segment");
    expect(cat).toBeDefined();
    expect(cat?.title).toContain("Enterprise");
  });

  it("returns no insight for category with empty frequencies", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [
        {
          columnName: "seg",
          frequencies: [],
          uniqueCount: 0,
          totalResponses: 0,
        },
      ],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights.some((i) => i.columnName === "seg")).toBe(false);
  });
});

// ── Text insights ─────────────────────────────────────────────────────────────

describe("generateInsights — text", () => {
  it("generates sentiment and top-words insights per text column", () => {
    const text: TextAnalysis = {
      columns: [
        {
          columnName: "comment",
          wordFrequencies: [],
          topWords: [
            { word: "great", count: 10, pct: 30 },
            { word: "fast", count: 5, pct: 15 },
          ],
          lengthStats: { mean: 20, median: 18, min: 5, max: 50 },
          sentiment: makeSentiment(70, 10),
          totalResponses: 20,
        },
      ],
    };
    const { insights } = generateInsights(emptyQuant(), text);
    expect(insights.some((i) => i.id === "text_sentiment_comment")).toBe(true);
    expect(insights.some((i) => i.id === "text_top_words_comment")).toBe(true);
  });

  it("marks >50% positive sentiment as positive severity", () => {
    const text: TextAnalysis = {
      columns: [
        {
          columnName: "c",
          wordFrequencies: [],
          topWords: [],
          lengthStats: { mean: 10, median: 10, min: 5, max: 15 },
          sentiment: makeSentiment(60, 5),
          totalResponses: 10,
        },
      ],
    };
    const { insights } = generateInsights(emptyQuant(), text);
    const s = insights.find((i) => i.id === "text_sentiment_c");
    expect(s?.severity).toBe("positive");
  });

  it("marks >30% negative sentiment as negative severity", () => {
    const text: TextAnalysis = {
      columns: [
        {
          columnName: "c",
          wordFrequencies: [],
          topWords: [],
          lengthStats: { mean: 10, median: 10, min: 5, max: 15 },
          sentiment: makeSentiment(10, 40),
          totalResponses: 10,
        },
      ],
    };
    const { insights } = generateInsights(emptyQuant(), text);
    const s = insights.find((i) => i.id === "text_sentiment_c");
    expect(s?.severity).toBe("negative");
  });
});

// ── Summary ───────────────────────────────────────────────────────────────────

describe("generateInsights — summary", () => {
  it("includes column count in summary", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "s",
          score: 10,
          promoters: 1,
          passives: 1,
          detractors: 1,
          promoterPct: 33,
          passivePct: 33,
          detractorPct: 34,
          totalResponses: 3,
          mean: 7,
        },
      ],
    };
    const { summary } = generateInsights(quant, emptyText());
    expect(summary).toContain("1 column");
  });

  it("returns a non-empty summary for empty inputs", () => {
    const { summary } = generateInsights(emptyQuant(), emptyText());
    expect(summary.length).toBeGreaterThan(0);
  });
});
