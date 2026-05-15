import type { Dataset } from "@/types";

/**
 * Serializes a Dataset to RFC 4180 CSV text.
 * Values containing commas, double quotes, or newlines are quoted.
 * Returns a string with CRLF line endings as required by the spec.
 */
export function serializeCSV(dataset: Dataset): string {
  const rows: string[] = [];
  rows.push(dataset.headers.map(escapeField).join(","));
  for (const row of dataset.rows) {
    rows.push(dataset.headers.map((h) => escapeField(row[h] ?? "")).join(","));
  }
  return rows.join("\r\n");
}

function escapeField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
