"use client";

import { useSyncExternalStore } from "react";
import type { ParseResult } from "@/types";

const MAX_PREVIEW_ROWS = 25;

// sessionStorage doesn't emit same-tab events, so subscribe is a no-op.
const subscribe: Parameters<typeof import("react").useSyncExternalStore>[0] =
  () => () => {};

// Module-level cache prevents JSON.parse on every render.
// Keyed by projectId. Cleared when the stored raw string changes.
const snapshotCache = new Map<string, { raw: string | null; result: ParseResult | null }>();

function readSnapshot(projectId: string): ParseResult | null {
  const raw = sessionStorage.getItem(`preview:${projectId}`);
  const cached = snapshotCache.get(projectId);
  if (cached && cached.raw === raw) return cached.result;

  let result: ParseResult | null = null;
  if (raw) {
    try {
      result = JSON.parse(raw) as ParseResult;
    } catch {
      result = null;
    }
  }
  snapshotCache.set(projectId, { raw, result });
  return result;
}

interface PreviewTableProps {
  projectId: string;
}

export default function PreviewTable({ projectId }: PreviewTableProps) {
  const result = useSyncExternalStore(
    subscribe,
    () => readSnapshot(projectId),
    () => null,
  );

  // result is null during SSR (server snapshot returns null).
  // After hydration the client snapshot runs and returns the stored data.
  if (result === null || result.dataset.headers.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">
          No data loaded yet — upload a file first.
        </p>
      </div>
    );
  }

  const { dataset } = result;
  const previewRows = dataset.rows.slice(0, MAX_PREVIEW_ROWS);

  return (
    <div className="space-y-4">
      {dataset.parseWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">
            Parse warnings
          </p>
          <ul className="space-y-0.5">
            {dataset.parseWarnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>{dataset.headers.length} columns</span>
        <span>{dataset.rowCount.toLocaleString()} rows</span>
        {dataset.rowCount > MAX_PREVIEW_ROWS && (
          <span>Showing first {MAX_PREVIEW_ROWS} rows</span>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {dataset.headers.map((header) => (
                <th
                  key={header}
                  className="text-left px-3 py-2 text-xs font-medium text-zinc-500 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-100 last:border-0 ${
                  i % 2 !== 0 ? "bg-zinc-50/50" : ""
                }`}
              >
                {dataset.headers.map((header) => (
                  <td
                    key={header}
                    className="px-3 py-2 text-xs text-zinc-700 max-w-xs truncate"
                  >
                    {row[header] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
