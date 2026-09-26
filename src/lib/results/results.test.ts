import { describe, it, expect } from "vitest";
import { parseCSV } from "@/lib/parse";
import { cleanDataset } from "@/lib/clean";
import { analyzeQuantitative } from "@/lib/analysis";
import { analyzeText } from "@/lib/text";
import { generateInsights } from "@/lib/insights";
import { buildCharts } from "@/lib/charts";
import type { ColumnMapping } from "@/types";
import {
  MAX_STORED_ANALYSIS_BYTES,
  MAX_STORED_CATEGORIES,
  STORED_ANALYSIS_VERSION,
  buildStoredAnalysis,
  parseStoredAnalysis,
  serializedSize,
} from "./index";

// Synthetic fixture: 30 responses, one open-text column mentioning a made-up
// name that must not survive into the stored payload's full word list.
function runPipeline(categoryValues = 30) {
  const rows = ["nps,team,comment"];
  for (let i = 0; i < 30; i++) {
    rows.push(`${i % 11},team-${i % categoryValues},great service from zorblat friendly staff`);
  }
  const { dataset } = parseCSV(rows.join("\n"), "fixture.csv");
  const mappings: ColumnMapping[] = [
    { name: "nps", type: "nps", inferredType: "nps", confidence: 1 },
    { name: "team", type: "category", inferredType: "category", confidence: 1 },
    { name: "comment", type: "open_text", inferredType: "open_text", confidence: 1 },
  ];
  const cleaning = cleanDataset(dataset, mappings);
  const quant = analyzeQuantitative(cleaning.dataset, mappings);
  const text = analyzeText(cleaning.dataset, mappings);
  return {
    cleaning: cleaning.summary,
    quant,
    text,
    insights: generateInsights(quant, text),
    charts: buildCharts(quant, text),
  };
}

describe("buildStoredAnalysis", () => {
  it("tags the payload with the current version", () => {
    expect(buildStoredAnalysis(runPipeline()).version).toBe(STORED_ANALYSIS_VERSION);
  });

  it("drops the full per-word vocabulary but keeps the displayed top words", () => {
    const input = runPipeline();
    expect(input.text.columns[0].wordFrequencies.length).toBeGreaterThan(0);

    const stored = buildStoredAnalysis(input);
    expect(stored.text.columns[0].wordFrequencies).toEqual([]);
    expect(stored.text.columns[0].topWords).toEqual(input.text.columns[0].topWords);
  });

  it(`keeps at most ${MAX_STORED_CATEGORIES} category values but preserves the unique count`, () => {
    const input = runPipeline(30);
    const original = input.quant.categories[0];
    expect(original.frequencies.length).toBe(30);

    const stored = buildStoredAnalysis(input).quant.categories[0];
    expect(stored.frequencies).toHaveLength(MAX_STORED_CATEGORIES);
    expect(stored.frequencies).toEqual(original.frequencies.slice(0, MAX_STORED_CATEGORIES));
    expect(stored.uniqueCount).toBe(original.uniqueCount);
  });

  it("does not mutate its input", () => {
    const input = runPipeline();
    const before = JSON.stringify(input);
    buildStoredAnalysis(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("keeps cleaning, insights, and charts unchanged", () => {
    const input = runPipeline();
    const stored = buildStoredAnalysis(input);
    expect(stored.cleaning).toEqual(input.cleaning);
    expect(stored.insights).toEqual(input.insights);
    expect(stored.charts).toEqual(input.charts);
  });
});

describe("parseStoredAnalysis", () => {
  const valid = () => buildStoredAnalysis(runPipeline());

  it("accepts a payload produced by buildStoredAnalysis", () => {
    const payload = valid();
    expect(parseStoredAnalysis(payload)).toEqual(payload);
  });

  it("round-trips through JSON, as it does via the database", () => {
    const payload = valid();
    expect(parseStoredAnalysis(JSON.parse(JSON.stringify(payload)))).toEqual(payload);
  });

  it("re-applies minimization when a client sends the full vocabulary", () => {
    const raw = { ...runPipeline(30), version: STORED_ANALYSIS_VERSION };
    const parsed = parseStoredAnalysis(raw);
    expect(parsed?.text.columns[0].wordFrequencies).toEqual([]);
    expect(parsed?.quant.categories[0].frequencies).toHaveLength(MAX_STORED_CATEGORIES);
  });

  it("rejects non-objects and arrays", () => {
    for (const input of [null, undefined, "x", 1, []]) {
      expect(parseStoredAnalysis(input)).toBeNull();
    }
  });

  it("rejects a missing or unknown version", () => {
    const noVersion: Record<string, unknown> = { ...valid() };
    delete noVersion.version;
    expect(parseStoredAnalysis(noVersion)).toBeNull();
    expect(parseStoredAnalysis({ ...valid(), version: 2 })).toBeNull();
  });

  it("rejects payloads missing any required section", () => {
    for (const key of ["cleaning", "quant", "text", "insights", "charts"] as const) {
      const payload: Record<string, unknown> = { ...valid() };
      delete payload[key];
      expect(parseStoredAnalysis(payload)).toBeNull();
    }
  });

  it("rejects sections with the wrong shape", () => {
    const payload = valid();
    expect(parseStoredAnalysis({ ...payload, quant: { ...payload.quant, nps: "x" } })).toBeNull();
    expect(parseStoredAnalysis({ ...payload, charts: {} })).toBeNull();
    expect(parseStoredAnalysis({ ...payload, insights: { insights: [] } })).toBeNull();
    expect(
      parseStoredAnalysis({ ...payload, quant: { ...payload.quant, categories: [null] } }),
    ).toBeNull();
  });

  it(`rejects payloads larger than ${MAX_STORED_ANALYSIS_BYTES / 1024} KB`, () => {
    const payload = valid();
    const huge = {
      ...payload,
      insights: { ...payload.insights, summary: "x".repeat(MAX_STORED_ANALYSIS_BYTES) },
    };
    expect(serializedSize(huge)).toBeGreaterThan(MAX_STORED_ANALYSIS_BYTES);
    expect(parseStoredAnalysis(huge)).toBeNull();
  });
});

describe("serializedSize", () => {
  it("counts UTF-8 bytes, not characters", () => {
    expect(serializedSize("é")).toBe(4); // quotes + 2-byte character
  });
});
