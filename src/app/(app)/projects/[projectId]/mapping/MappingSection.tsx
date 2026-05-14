"use client";

import { useSyncExternalStore, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ParseResult, ColumnMapping, ColumnType } from "@/types";
import { inferColumnTypes } from "@/lib/infer";

const subscribe: Parameters<typeof import("react").useSyncExternalStore>[0] =
  () => () => {};

const previewCache = new Map<
  string,
  { raw: string | null; result: ParseResult | null }
>();

function readPreview(projectId: string): ParseResult | null {
  const raw = sessionStorage.getItem(`preview:${projectId}`);
  const cached = previewCache.get(projectId);
  if (cached && cached.raw === raw) return cached.result;

  let result: ParseResult | null = null;
  if (raw) {
    try {
      result = JSON.parse(raw) as ParseResult;
    } catch {
      result = null;
    }
  }
  previewCache.set(projectId, { raw, result });
  return result;
}

const SAMPLE_COUNT = 3;
const MAX_SAMPLE_LEN = 30;

const ALL_COLUMN_TYPES: ColumnType[] = [
  "nps",
  "rating",
  "numeric",
  "date",
  "category",
  "open_text",
  "id",
  "ignore",
  "unknown",
];

const TYPE_LABELS: Record<ColumnType, string> = {
  nps: "NPS (0–10)",
  rating: "Rating",
  numeric: "Numeric",
  date: "Date",
  category: "Category",
  open_text: "Open text",
  id: "ID / key",
  ignore: "Ignore",
  unknown: "Unknown",
};

function getSamples(
  dataset: ParseResult["dataset"],
  columnName: string,
): string[] {
  const samples: string[] = [];
  for (const row of dataset.rows) {
    if (samples.length >= SAMPLE_COUNT) break;
    const v = row[columnName];
    if (v && v.trim()) {
      const trimmed = v.trim();
      samples.push(
        trimmed.length > MAX_SAMPLE_LEN
          ? trimmed.slice(0, MAX_SAMPLE_LEN) + "…"
          : trimmed,
      );
    }
  }
  return samples;
}

function confidenceBadge(confidence: number): {
  label: string;
  className: string;
} {
  if (confidence >= 0.85)
    return {
      label: "high",
      className:
        "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
  if (confidence >= 0.6)
    return {
      label: "med",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  return {
    label: "low",
    className: "bg-red-50 text-red-600 border border-red-200",
  };
}

interface MappingSectionProps {
  projectId: string;
}

export default function MappingSection({ projectId }: MappingSectionProps) {
  const router = useRouter();

  const result = useSyncExternalStore(
    subscribe,
    () => readPreview(projectId),
    () => null,
  );

  const inferredMappings = useMemo(
    () => (result ? inferColumnTypes(result.dataset) : null),
    [result],
  );

  const [overrides, setOverrides] = useState<Map<string, ColumnType>>(
    new Map(),
  );

  function handleTypeChange(columnName: string, newType: ColumnType) {
    setOverrides((prev) => new Map(prev).set(columnName, newType));
  }

  function handleNext() {
    if (!inferredMappings || !result) return;
    const finalMappings: ColumnMapping[] = inferredMappings.map((m) => ({
      ...m,
      type: overrides.get(m.name) ?? m.type,
    }));
    sessionStorage.setItem(`mapping:${projectId}`, JSON.stringify(finalMappings));
    router.push(`/projects/${projectId}/analysis`);
  }

  if (!result || !inferredMappings) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            No data loaded yet — upload a file first.
          </p>
        </div>
        <div className="flex justify-start">
          <Link
            href={`/projects/${projectId}/preview`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ← Back to preview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 whitespace-nowrap">
                Column
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 whitespace-nowrap">
                Sample values
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 whitespace-nowrap">
                Inferred type
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-zinc-500 whitespace-nowrap">
                Your choice
              </th>
            </tr>
          </thead>
          <tbody>
            {inferredMappings.map((m, i) => {
              const samples = getSamples(result.dataset, m.name);
              const badge = confidenceBadge(m.confidence);
              const effectiveType = overrides.get(m.name) ?? m.type;
              const userChanged = effectiveType !== m.inferredType;
              return (
                <tr
                  key={m.name}
                  className={`border-b border-zinc-100 last:border-0 ${i % 2 !== 0 ? "bg-zinc-50/50" : ""}`}
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-zinc-800 whitespace-nowrap">
                    {m.name}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    {samples.length > 0 ? (
                      <span className="text-xs text-zinc-500">
                        {samples.join(", ")}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">
                        {TYPE_LABELS[m.inferredType]}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={effectiveType}
                      onChange={(e) =>
                        handleTypeChange(m.name, e.target.value as ColumnType)
                      }
                      className={`rounded border text-xs px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
                        userChanged
                          ? "border-blue-400 text-blue-800"
                          : "border-zinc-200 text-zinc-700"
                      }`}
                    >
                      {ALL_COLUMN_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/projects/${projectId}/preview`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Back to preview
        </Link>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Next: Analyze →
        </button>
      </div>
    </div>
  );
}
