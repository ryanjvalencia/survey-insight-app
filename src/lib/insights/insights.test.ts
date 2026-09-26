import { describe, it, expect } from "vitest";
import { generateInsights, roundForHeadline } from "./index";
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
          bins: [],
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
          bins: [],
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
  it("generates one sentiment insight per text column that names the top words", () => {
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
    const sentiment = insights.find((i) => i.id === "text_sentiment_comment");
    expect(sentiment?.body).toContain("“great” and “fast”");
    expect(insights.filter((i) => i.columnName === "comment")).toHaveLength(1);
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
  it("states the number of findings and responses in the summary", () => {
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
    expect(summary).toBe("1 finding from 3 responses — most important first.");
  });

  it("returns a non-empty summary for empty inputs", () => {
    const { summary } = generateInsights(emptyQuant(), emptyText());
    expect(summary.length).toBeGreaterThan(0);
  });
});

describe("generateInsights — NPS wording", () => {
  it("states the −100 to +100 scale and the 0–10 average so the score isn't misread", () => {
    const quant = {
      ...emptyQuant(),
      nps: [
        {
          columnName: "nps_score",
          score: 17.6,
          promoters: 46,
          passives: 25,
          detractors: 29,
          promoterPct: 46,
          passivePct: 25,
          detractorPct: 29,
          totalResponses: 100,
          mean: 7.9,
        },
      ],
    };
    const [insight] = generateInsights(quant, emptyText()).insights;
    expect(insight.title).toBe("More customers would recommend you than warn others off");
    expect(insight.metric).toEqual({ value: "+17.6", label: "Net Promoter Score" });
    expect(insight.body).toContain("−100 to +100");
    expect(insight.body).toContain("average answer was 7.9 out of 10");
    expect(insight.body).toContain("“Good” range");
  });
});

// ── Readability rules ─────────────────────────────────────────────────────────

function numeric(columnName: string, over: Partial<QuantitativeAnalysis["numerics"][number]> = {}) {
  return {
    columnName,
    mean: 125_300,
    median: 124_900,
    stdDev: 20_000,
    min: 510,
    max: 250_481,
    totalResponses: 100,
    bins: [],
    ...over,
  };
}

describe("generateInsights — readable column names and values", () => {
  it("formats money columns with a dollar sign and commas", () => {
    const quant = { ...emptyQuant(), numerics: [numeric("annual_revenue")] };
    const [insight] = generateInsights(quant, emptyText()).insights;
    expect(insight.title).toBe("The typical annual revenue is about $125,000");
    expect(insight.body).toContain("above $124,900 and half below");
    expect(insight.body).toContain("$510 to $250,481");
    expect(insight.metric?.value).toBe("$125,000");
  });

  it("uses a plain phrase instead of the quoted column name", () => {
    const quant = { ...emptyQuant(), numerics: [numeric("annual_revenue")] };
    const all = generateInsights(quant, emptyText()).insights.map((i) => i.title + i.body).join(" ");
    expect(all).not.toContain("annual_revenue");
    expect(all).not.toContain('"');
  });

  it("does not add dollar signs to non-money columns", () => {
    const quant = { ...emptyQuant(), numerics: [numeric("company_size", { median: 42, mean: 45, min: 1, max: 900 })] };
    const [insight] = generateInsights(quant, emptyText()).insights;
    expect(insight.title).toBe("The typical company size is 42");
    expect(insight.body).not.toContain("$");
  });

  it("flags a skewed average and recommends the median", () => {
    const quant = { ...emptyQuant(), numerics: [numeric("salary", { mean: 90_000, median: 60_000 })] };
    const skew = generateInsights(quant, emptyText()).insights.find((i) => i.id === "numeric_skew_salary");
    expect(skew?.title).toBe("A few large values pull the average salary up");
    expect(skew?.body).toContain("$90,000");
  });

  it("keeps full-question column names as written", () => {
    const quant = { ...emptyQuant(), numerics: [numeric("How many employees work at your company?", { median: 42 })] };
    const [insight] = generateInsights(quant, emptyText()).insights;
    expect(insight.title).toBe("The typical value is 42");
    expect(insight.body).toContain("How many employees work at your company?");
  });
});

describe("generateInsights — ratings", () => {
  it("reports top-box and bottom-box shares on the inferred scale", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      ratings: [
        {
          columnName: "satisfaction_rating",
          mean: 3.9,
          median: 4,
          min: 1,
          max: 5,
          distribution: { "1": 5, "2": 5, "3": 20, "4": 40, "5": 30 },
          totalResponses: 100,
        },
      ],
    };
    const [insight] = generateInsights(quant, emptyText()).insights;
    expect(insight.title).toBe("Satisfaction is solid, with room to grow");
    expect(insight.body).toContain("3.9 out of 5");
    expect(insight.body).toContain("70% gave a 4 or 5");
    expect(insight.body).toContain("10% gave a 1 or 2");
    expect(insight.metric).toEqual({ value: "3.9 / 5", label: "average satisfaction" });
  });
});

describe("generateInsights — categories", () => {
  it("describes an even spread instead of naming a misleading 'winner'", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [
        {
          columnName: "department",
          frequencies: [
            { value: "Ops", count: 15, pct: 15 },
            { value: "Sales", count: 14, pct: 14 },
            { value: "HR", count: 14, pct: 14 },
          ],
          uniqueCount: 7,
          totalResponses: 100,
        },
      ],
    };
    const [insight] = generateInsights(quant, emptyText()).insights;
    expect(insight.title).toBe("Responses are spread evenly across 7 department groups");
  });
});

describe("generateInsights — ordering", () => {
  it("returns the most important insights first (NPS before numbers and categories)", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      numerics: [numeric("annual_revenue")],
      nps: [
        {
          columnName: "nps",
          score: 20,
          promoters: 40,
          passives: 40,
          detractors: 20,
          promoterPct: 40,
          passivePct: 40,
          detractorPct: 20,
          totalResponses: 100,
          mean: 7.5,
        },
      ],
    };
    const ids = generateInsights(quant, emptyText()).insights.map((i) => i.id);
    expect(ids[0]).toBe("nps_score_nps");
    const priorities = generateInsights(quant, emptyText()).insights.map((i) => i.priority ?? 0);
    expect([...priorities].sort((a, b) => b - a)).toEqual(priorities);
  });
});

describe("roundForHeadline", () => {
  it("rounds to three significant figures", () => {
    expect(roundForHeadline(126_646)).toBe(127_000);
    expect(roundForHeadline(1_234_567)).toBe(1_230_000);
    expect(roundForHeadline(4_321)).toBe(4_320);
  });

  it("leaves small numbers alone", () => {
    expect(roundForHeadline(42)).toBe(42);
    expect(roundForHeadline(7.5)).toBe(7.5);
    expect(roundForHeadline(0)).toBe(0);
  });
});

describe("generateInsights — balanced samples", () => {
  function evenCategory(columnName: string, uniqueCount: number) {
    const pct = 100 / uniqueCount;
    return {
      columnName,
      frequencies: [
        { value: "A", count: 10, pct },
        { value: "B", count: 10, pct },
        { value: "C", count: 10, pct },
      ],
      uniqueCount,
      totalResponses: 100,
    };
  }

  it("combines several evenly split categories into one insight", () => {
    const quant: QuantitativeAnalysis = {
      ...emptyQuant(),
      categories: [evenCategory("department", 7), evenCategory("region", 4), evenCategory("plan", 4)],
    };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights).toHaveLength(1);
    expect(insights[0].title).toBe("Your sample is well balanced across department, region and plan");
    expect(insights[0].severity).toBe("positive");
  });

  it("keeps a single evenly split category as its own insight", () => {
    const quant: QuantitativeAnalysis = { ...emptyQuant(), categories: [evenCategory("region", 4)] };
    const { insights } = generateInsights(quant, emptyText());
    expect(insights[0].id).toBe("category_top_region");
  });
});
