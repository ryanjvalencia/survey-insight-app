"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ParseResult, ColumnMapping, ColumnType } from "@/types";
import { inferColumnTypes } from "@/lib/infer";
import { cleanDataset } from "@/lib/clean";
import { analyzeQuantitative } from "@/lib/analysis";
import { analyzeText } from "@/lib/text";
import { buildCharts } from "@/lib/charts";
import { generateInsights } from "@/lib/insights";
import {
  applyColumnTypes,
  saveColumnTypes,
  toColumnTypes,
  type ColumnTypes,
} from "@/lib/localdata";
import { getBrowserStore } from "@/lib/localdata/indexeddb";
import { buildStoredAnalysis } from "@/lib/results";
import LocalDataNotice from "@/components/localdata/LocalDataNotice";
import { useLocalProjectData } from "@/components/localdata/useLocalProjectData";
import { saveAnalysis } from "../actions";

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
  const local = useLocalProjectData(projectId);

  if (local.status !== "ready") {
    return <LocalDataNotice kind={local.status} projectId={projectId} />;
  }
  if (!local.upload || local.upload.dataset.headers.length === 0) {
    return <LocalDataNotice kind="missing" projectId={projectId} />;
  }
  return (
    <MappingEditor
      projectId={projectId}
      upload={local.upload}
      savedTypes={local.columnTypes}
    />
  );
}

function MappingEditor({
  projectId,
  upload,
  savedTypes,
}: {
  projectId: string;
  upload: ParseResult;
  savedTypes: ColumnTypes | null;
}) {
  const router = useRouter();
  // Inference runs once per mount; saved choices (from earlier visits to this
  // step) are layered on top so they survive navigation and reloads.
  const [mappings, setMappings] = useState<ColumnMapping[]>(() =>
    applyColumnTypes(inferColumnTypes(upload.dataset), savedTypes),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(columnName: string, newType: ColumnType) {
    const next = mappings.map((m) =>
      m.name === columnName ? { ...m, type: newType } : m,
    );
    setMappings(next);
    saveColumnTypes(getBrowserStore(), projectId, toColumnTypes(next)).catch(() =>
      setError("Couldn't save your column choices on this device."),
    );
  }

  async function handleNext() {
    setSaving(true);
    setError(null);

    const cleaningResult = cleanDataset(upload.dataset, mappings);
    const quant = analyzeQuantitative(cleaningResult.dataset, mappings);
    const text = analyzeText(cleaningResult.dataset, mappings);
    const insights = generateInsights(quant, text);
    const charts = buildCharts(quant, text);

    // Column choices stay on this device; the report's cleaned-CSV export
    // re-runs cleaning on the raw rows, which never leave the browser.
    await saveColumnTypes(getBrowserStore(), projectId, toColumnTypes(mappings)).catch(
      () => null,
    );

    const payload = buildStoredAnalysis({
      cleaning: cleaningResult.summary,
      quant,
      text,
      insights,
      charts,
    });
    const saved = await saveAnalysis(projectId, payload).catch(() => null);
    if (!saved?.ok) {
      setError(
        saved?.error ??
          "Couldn't reach the server. Check your connection and try again.",
      );
      setSaving(false);
      return;
    }
    router.push(`/projects/${projectId}/analysis`);
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
            {mappings.map((m, i) => {
              const samples = getSamples(upload.dataset, m.name);
              const badge = confidenceBadge(m.confidence);
              const effectiveType = m.type;
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

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

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
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Analyzing…" : "Next: Analyze →"}
        </button>
      </div>
    </div>
  );
}
