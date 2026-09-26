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
import Icon from "@/components/ui/Icon";
import { NAV_BACK, NAV_FORWARD } from "@/components/ui/PageTransition";
import { btnPrimary, btnSecondary, card } from "@/components/ui/styles";
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
    return { label: "Confident", className: "bg-good-bg text-good-text" };
  if (confidence >= 0.6)
    return { label: "Likely", className: "bg-warning-bg text-warning-text" };
  return { label: "Please check", className: "bg-critical-bg text-critical-text" };
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
    router.push(`/projects/${projectId}/analysis`, { transitionTypes: NAV_FORWARD });
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-max text-sm">
          <thead className="bg-surface-muted">
            <tr>
              {["Column", "Sample values", "We detected", "Treat as"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-ink-2"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {mappings.map((m) => {
              const samples = getSamples(upload.dataset, m.name);
              const badge = confidenceBadge(m.confidence);
              const userChanged = m.type !== m.inferredType;
              return (
                <tr key={m.name} className="transition-colors hover:bg-surface-muted">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{m.name}</td>
                  <td className="max-w-xs px-4 py-3">
                    {samples.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {samples.map((v, i) => (
                          <span
                            key={i}
                            className="max-w-40 truncate rounded-md bg-surface-sunken px-1.5 py-0.5 text-xs text-ink-2"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-3">No values</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink-2">{TYPE_LABELS[m.inferredType]}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={m.type}
                        aria-label={`Type for ${m.name}`}
                        onChange={(e) => handleTypeChange(m.name, e.target.value as ColumnType)}
                        className={[
                          "rounded-lg border bg-surface px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-4 focus:ring-brand-100",
                          userChanged
                            ? "border-brand-500 text-brand-800 font-medium"
                            : "border-line text-ink hover:border-line-strong",
                        ].join(" ")}
                      >
                        {ALL_COLUMN_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                      {userChanged && (
                        <span className="animate-pop rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-800">
                          Changed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div
          role="alert"
          className="flex animate-fade-up items-start gap-3 rounded-xl bg-critical-bg px-4 py-3 text-sm text-critical-text ring-1 ring-critical/20"
        >
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href={`/projects/${projectId}/preview`} transitionTypes={NAV_BACK} className={btnSecondary}>
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to preview
        </Link>
        <button type="button" onClick={handleNext} disabled={saving} className={btnPrimary}>
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Analyzing…
            </>
          ) : (
            <>
              <Icon name="sparkle" className="h-4 w-4" />
              Run analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
