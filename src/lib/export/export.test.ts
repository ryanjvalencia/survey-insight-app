import { describe, it, expect } from "vitest";
import { serializeCSV } from "./index";
import type { Dataset } from "@/types";

function makeDataset(
  headers: string[],
  rows: Record<string, string>[],
): Dataset {
  return { headers, rows, rowCount: rows.length, parseWarnings: [] };
}

describe("serializeCSV", () => {
  it("serializes headers and rows with CRLF line endings", () => {
    const dataset = makeDataset(
      ["name", "score"],
      [{ name: "Alice", score: "9" }],
    );
    const csv = serializeCSV(dataset);
    expect(csv).toBe("name,score\r\nAlice,9");
  });

  it("handles multiple rows", () => {
    const dataset = makeDataset(
      ["a", "b"],
      [{ a: "1", b: "x" }, { a: "2", b: "y" }],
    );
    const csv = serializeCSV(dataset);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("a,b");
    expect(lines[1]).toBe("1,x");
    expect(lines[2]).toBe("2,y");
  });

  it("quotes fields containing commas", () => {
    const dataset = makeDataset(
      ["comment"],
      [{ comment: "hello, world" }],
    );
    const csv = serializeCSV(dataset);
    expect(csv).toContain('"hello, world"');
  });

  it("quotes fields containing double quotes and escapes them", () => {
    const dataset = makeDataset(
      ["comment"],
      [{ comment: 'say "hi"' }],
    );
    const csv = serializeCSV(dataset);
    expect(csv).toContain('"say ""hi"""');
  });

  it("quotes fields containing newlines", () => {
    const dataset = makeDataset(
      ["note"],
      [{ note: "line1\nline2" }],
    );
    const csv = serializeCSV(dataset);
    expect(csv).toContain('"line1\nline2"');
  });

  it("uses empty string for missing field values", () => {
    const dataset = makeDataset(
      ["a", "b"],
      [{ a: "1" }],
    );
    const csv = serializeCSV(dataset);
    expect(csv).toBe("a,b\r\n1,");
  });

  it("returns only the header row for empty dataset", () => {
    const dataset = makeDataset(["col"], []);
    const csv = serializeCSV(dataset);
    expect(csv).toBe("col");
  });

  it("does not quote plain values", () => {
    const dataset = makeDataset(
      ["score"],
      [{ score: "8" }],
    );
    const csv = serializeCSV(dataset);
    expect(csv).toBe("score\r\n8");
  });
});
