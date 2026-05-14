import { describe, it, expect } from "vitest";
import { inferColumnTypes } from "./index";
import type { Dataset } from "@/types";

function makeDataset(
  headers: string[],
  rows: Record<string, string>[],
): Dataset {
  return { headers, rows, rowCount: rows.length, parseWarnings: [] };
}

function makeRows(header: string, values: string[]): Record<string, string>[] {
  return values.map((v) => ({ [header]: v }));
}

describe("inferColumnTypes", () => {
  it("returns an empty array for a dataset with no headers", () => {
    const result = inferColumnTypes(makeDataset([], []));
    expect(result).toEqual([]);
  });

  it("sets type equal to inferredType initially", () => {
    const dataset = makeDataset(
      ["score"],
      makeRows("score", ["1", "2", "3", "4", "5"]),
    );
    const [col] = inferColumnTypes(dataset);
    expect(col.type).toBe(col.inferredType);
  });

  it("returns confidence between 0 and 1 for all inferences", () => {
    const dataset = makeDataset(
      ["a", "b", "c"],
      [{ a: "hello", b: "2024-01-01", c: "42" }],
    );
    for (const col of inferColumnTypes(dataset)) {
      expect(col.confidence).toBeGreaterThanOrEqual(0);
      expect(col.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("infers 'ignore' for a column with all empty values", () => {
    const dataset = makeDataset(["empty"], makeRows("empty", ["", "  ", ""]));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("ignore");
    expect(col.confidence).toBe(1.0);
  });

  it("infers 'ignore' for a column with no rows", () => {
    const dataset = makeDataset(["col"], []);
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("ignore");
  });

  it("infers 'nps' for a column named 'nps_score' with values 0-10", () => {
    const values = ["0", "5", "7", "10", "3", "8", "0", "9", "10", "1"];
    const dataset = makeDataset(["nps_score"], makeRows("nps_score", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("nps");
    expect(col.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("infers 'nps' from values when 0 is present and max is 10", () => {
    const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
    const dataset = makeDataset(["promoter"], makeRows("promoter", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("nps");
  });

  it("infers 'nps' for column matching 'net_promoter_score'", () => {
    const dataset = makeDataset(
      ["net_promoter_score"],
      makeRows("net_promoter_score", ["5", "9", "3"]),
    );
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("nps");
  });

  it("infers 'rating' for a column named 'satisfaction' with values 1-5", () => {
    const values = ["1", "2", "3", "4", "5", "3", "4", "5", "2", "1"];
    const dataset = makeDataset(
      ["satisfaction"],
      makeRows("satisfaction", values),
    );
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("rating");
  });

  it("infers 'rating' from integer values in range 1-5 with low cardinality", () => {
    const values = ["1", "2", "3", "4", "5", "3", "4", "5", "2", "1"];
    const dataset = makeDataset(["q1"], makeRows("q1", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("rating");
  });

  it("infers 'numeric' for a column with decimal numbers", () => {
    const values = ["1.5", "2.3", "100.0", "0.5", "999.9"];
    const dataset = makeDataset(["amount"], makeRows("amount", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("numeric");
  });

  it("infers 'numeric' for large integers that exceed rating range", () => {
    const values = ["100", "200", "300", "450", "1000"];
    const dataset = makeDataset(["revenue"], makeRows("revenue", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("numeric");
  });

  it("infers 'date' for a column with ISO date strings", () => {
    const values = [
      "2024-01-01",
      "2024-02-15",
      "2024-03-20",
      "2023-12-31",
      "2024-06-01",
    ];
    const dataset = makeDataset(["submitted"], makeRows("submitted", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("date");
  });

  it("infers 'date' for a column named 'created_at' with date values", () => {
    const values = ["2024-01-01", "2024-01-02", "2024-01-03"];
    const dataset = makeDataset(
      ["created_at"],
      makeRows("created_at", values),
    );
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("date");
  });

  it("infers 'category' for a column with few unique text values", () => {
    const values = Array(20)
      .fill(null)
      .map((_, i) => ["Yes", "No", "Maybe"][i % 3]);
    const dataset = makeDataset(["opted_in"], makeRows("opted_in", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("category");
  });

  it("infers 'category' for a column named 'gender'", () => {
    const values = ["Male", "Female", "Non-binary", "Female", "Male"];
    const dataset = makeDataset(["gender"], makeRows("gender", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("category");
  });

  it("infers 'category' for a column named 'status'", () => {
    const values = ["Active", "Inactive", "Active", "Churned", "Active"];
    const dataset = makeDataset(["status"], makeRows("status", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("category");
  });

  it("infers 'open_text' for a column with long free-form text values", () => {
    const values = [
      "The product is absolutely fantastic, I love the clean design and ease of use.",
      "Customer service was helpful but the onboarding took longer than expected.",
      "Would recommend to colleagues — the reporting features save me hours every week.",
      "Integration with our existing tools was seamless and the support team was great.",
      "Some minor UI bugs but overall a solid product with excellent customer service.",
    ];
    const dataset = makeDataset(
      ["open_feedback"],
      makeRows("open_feedback", values),
    );
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("open_text");
  });

  it("infers 'open_text' for a column named 'comments'", () => {
    const values = ["Good", "Fine", "OK"];
    const dataset = makeDataset(["comments"], makeRows("comments", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("open_text");
  });

  it("infers 'id' for a column named 'respondent_id'", () => {
    const values = ["1", "2", "3", "4", "5"];
    const dataset = makeDataset(
      ["respondent_id"],
      makeRows("respondent_id", values),
    );
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("id");
  });

  it("infers 'unknown' when no name or value heuristic matches", () => {
    const values = ["abc123", "def456", "xyz789", "qrs012", "uvw345"];
    const dataset = makeDataset(["code"], makeRows("code", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("unknown");
  });

  it("returns confidence 0.95 when name and value heuristics agree", () => {
    const values = ["0", "5", "7", "10", "3", "0", "8", "9", "10", "1"];
    const dataset = makeDataset(["nps"], makeRows("nps", values));
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("nps");
    expect(col.confidence).toBe(0.95);
  });

  it("handles a multi-column dataset and returns one mapping per header", () => {
    const dataset = makeDataset(
      ["id", "nps", "comment"],
      [
        { id: "1", nps: "7", comment: "Great" },
        { id: "2", nps: "9", comment: "Loved it" },
      ],
    );
    const result = inferColumnTypes(dataset);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.name)).toEqual(["id", "nps", "comment"]);
  });

  it("samples at most 100 rows and still infers correctly for large datasets", () => {
    const manyRows: Record<string, string>[] = Array(500)
      .fill(null)
      .map((_, i) => ({ big: String(i % 5 === 0 ? 0 : (i % 10) + 1) }));
    // Some zeros exist → should detect NPS
    const dataset = makeDataset(["big"], manyRows);
    dataset.rowCount = manyRows.length;
    const [col] = inferColumnTypes(dataset);
    expect(col.inferredType).toBe("nps");
  });
});
