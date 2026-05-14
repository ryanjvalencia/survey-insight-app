import { describe, it, expect } from "vitest";
import { analyzeText } from "./index";
import type { ColumnMapping, Dataset } from "@/types";

function makeDataset(
  headers: string[],
  rows: Record<string, string>[],
): Dataset {
  return { headers, rows, rowCount: rows.length, parseWarnings: [] };
}

function makeMapping(
  name: string,
  type: ColumnMapping["type"],
): ColumnMapping {
  return { name, type, inferredType: type, confidence: 0.9 };
}

// ── Column selection ──────────────────────────────────────────────────────────

describe("analyzeText — column selection", () => {
  it("analyses only open_text columns", () => {
    const dataset = makeDataset(
      ["comment", "score"],
      [{ comment: "great product", score: "9" }],
    );
    const result = analyzeText(dataset, [
      makeMapping("comment", "open_text"),
      makeMapping("score", "nps"),
    ]);
    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].columnName).toBe("comment");
  });

  it("returns empty columns array when no open_text mappings exist", () => {
    const dataset = makeDataset(["score"], [{ score: "8" }]);
    const result = analyzeText(dataset, [makeMapping("score", "nps")]);
    expect(result.columns).toHaveLength(0);
  });

  it("excludes columns where all responses are empty", () => {
    const dataset = makeDataset(["c"], [{ c: "" }, { c: "   " }]);
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    expect(result.columns).toHaveLength(0);
  });
});

// ── Word frequencies ──────────────────────────────────────────────────────────

describe("analyzeText — word frequencies", () => {
  it("counts word occurrences case-insensitively", () => {
    const dataset = makeDataset(
      ["feedback"],
      [{ feedback: "Great product" }, { feedback: "great service" }],
    );
    const result = analyzeText(dataset, [makeMapping("feedback", "open_text")]);
    const { wordFrequencies } = result.columns[0];
    const great = wordFrequencies.find((w) => w.word === "great");
    expect(great?.count).toBe(2);
  });

  it("excludes stop words from frequencies", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "the product is good" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const { wordFrequencies } = result.columns[0];
    expect(wordFrequencies.some((w) => w.word === "the")).toBe(false);
    expect(wordFrequencies.some((w) => w.word === "is")).toBe(false);
  });

  it("excludes words shorter than 3 characters", () => {
    const dataset = makeDataset(["c"], [{ c: "ok go do it" }]);
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const { wordFrequencies } = result.columns[0];
    expect(wordFrequencies.every((w) => w.word.length >= 3)).toBe(true);
  });

  it("sorts wordFrequencies by descending count", () => {
    const dataset = makeDataset(
      ["c"],
      [
        { c: "good product" },
        { c: "good service" },
        { c: "excellent product" },
      ],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const freqs = result.columns[0].wordFrequencies;
    for (let i = 1; i < freqs.length; i++) {
      expect(freqs[i - 1].count).toBeGreaterThanOrEqual(freqs[i].count);
    }
  });

  it("topWords contains at most 20 entries", () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    const dataset = makeDataset(["c"], [{ c: words }]);
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    expect(result.columns[0].topWords.length).toBeLessThanOrEqual(20);
  });

  it("strips punctuation from words", () => {
    const dataset = makeDataset(["c"], [{ c: "great!" }]);
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const { wordFrequencies } = result.columns[0];
    expect(wordFrequencies.some((w) => w.word === "great")).toBe(true);
    expect(wordFrequencies.some((w) => w.word.includes("!"))).toBe(false);
  });
});

// ── Response length stats ─────────────────────────────────────────────────────

describe("analyzeText — response length stats", () => {
  it("computes mean, median, min, max of response character lengths", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "hi" }, { c: "hello" }, { c: "world!" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const { lengthStats } = result.columns[0];
    expect(lengthStats.min).toBe(2);
    expect(lengthStats.max).toBe(6);
    expect(lengthStats.mean).toBeCloseTo((2 + 5 + 6) / 3, 1);
    expect(typeof lengthStats.median).toBe("number");
  });

  it("excludes empty values from length calculation", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "hello" }, { c: "" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    expect(result.columns[0].totalResponses).toBe(1);
    expect(result.columns[0].lengthStats.min).toBe(5);
  });
});

// ── Sentiment ─────────────────────────────────────────────────────────────────

describe("analyzeText — proxy sentiment", () => {
  it("classifies positive responses", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "great product love it" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    expect(result.columns[0].sentiment.positive).toBe(1);
    expect(result.columns[0].sentiment.negative).toBe(0);
  });

  it("classifies negative responses", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "terrible experience had problems" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    expect(result.columns[0].sentiment.negative).toBe(1);
    expect(result.columns[0].sentiment.positive).toBe(0);
  });

  it("classifies neutral responses (no sentiment words)", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "submitted form yesterday" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    expect(result.columns[0].sentiment.neutral).toBe(1);
  });

  it("positivePct + negativePct + neutralPct ≈ 100", () => {
    const dataset = makeDataset(
      ["c"],
      [
        { c: "great excellent love" },
        { c: "terrible awful" },
        { c: "submitted yesterday" },
      ],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const s = result.columns[0].sentiment;
    expect(s.positivePct + s.negativePct + s.neutralPct).toBeCloseTo(100, 1);
  });

  it("reports total matching totalResponses", () => {
    const dataset = makeDataset(
      ["c"],
      [{ c: "good" }, { c: "bad" }, { c: "meh" }],
    );
    const result = analyzeText(dataset, [makeMapping("c", "open_text")]);
    const s = result.columns[0].sentiment;
    expect(s.total).toBe(result.columns[0].totalResponses);
  });
});

// ── Multiple columns ──────────────────────────────────────────────────────────

describe("analyzeText — multiple open_text columns", () => {
  it("returns independent analysis for each column", () => {
    const dataset = makeDataset(
      ["c1", "c2"],
      [
        { c1: "great product", c2: "bad experience" },
        { c1: "love the service", c2: "poor quality" },
      ],
    );
    const result = analyzeText(dataset, [
      makeMapping("c1", "open_text"),
      makeMapping("c2", "open_text"),
    ]);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].columnName).toBe("c1");
    expect(result.columns[1].columnName).toBe("c2");
  });
});
