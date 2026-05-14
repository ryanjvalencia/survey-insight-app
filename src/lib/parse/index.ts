import type { Dataset, ParseResult } from "@/types";

/**
 * Parses CSV text into a ParseResult.
 * Handles: UTF-8 BOM, CRLF/LF/CR line endings, quoted fields (including
 * embedded commas and newlines), escaped quotes (""), short/long rows.
 * Never logs or exposes cell values — warnings describe structure only.
 */
export function parseCSV(text: string, filename: string): ParseResult {
  const rawRows = tokenize(text);
  // Drop rows that are a single blank/whitespace field (genuine blank lines).
  // Rows like ["","",""] (from ",," ) are kept so header detection can flag them.
  const nonEmpty = rawRows.filter(
    (r) => !(r.length === 1 && r[0].trim() === "")
  );

  if (nonEmpty.length === 0) {
    return {
      dataset: emptyDataset(["File contains no content."]),
      originalFilename: sanitizeFilename(filename),
    };
  }

  const headers = nonEmpty[0].map((h) => h.trim());

  if (headers.length === 0 || headers.every((h) => h === "")) {
    return {
      dataset: emptyDataset(["First row contains no column headers."]),
      originalFilename: sanitizeFilename(filename),
    };
  }

  const dataRows = nonEmpty.slice(1);
  const warnings: string[] = [];
  let shortCount = 0;
  let longCount = 0;

  const rows: Record<string, string>[] = dataRows.map((raw) => {
    if (raw.length < headers.length) shortCount++;
    else if (raw.length > headers.length) longCount++;

    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = raw[i] ?? "";
    }
    return record;
  });

  if (shortCount > 0) {
    warnings.push(
      `${shortCount} row(s) had fewer fields than headers; missing values filled with empty string.`
    );
  }
  if (longCount > 0) {
    warnings.push(
      `${longCount} row(s) had more fields than headers; extra fields were ignored.`
    );
  }

  const dataset: Dataset = {
    headers,
    rows,
    rowCount: rows.length,
    parseWarnings: warnings,
  };

  return { dataset, originalFilename: sanitizeFilename(filename) };
}

/**
 * Tokenizes CSV text into a 2-D array of raw string fields.
 * Implements RFC 4180 with extensions: CRLF, LF, and bare CR as line endings;
 * multi-line quoted fields; "" as an escaped double-quote inside a quoted field.
 */
function tokenize(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Strip UTF-8 BOM
  const src = text.startsWith("﻿") ? text.slice(1) : text;
  const len = src.length;

  for (let i = 0; i < len; i++) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          // Escaped quote inside quoted field
          field += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\r") {
        if (src[i + 1] === "\n") i++; // consume LF in CRLF
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }

  // Flush final field / row
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function emptyDataset(warnings: string[]): Dataset {
  return { headers: [], rows: [], rowCount: 0, parseWarnings: warnings };
}

/**
 * Strips characters unsafe for use in Content-Disposition filenames.
 * Applied to originalFilename before it leaves this module.
 */
function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-]/g, "_");
}
