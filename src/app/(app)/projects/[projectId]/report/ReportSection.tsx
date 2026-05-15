"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { ParseResult, ColumnMapping, CleaningSummary } from "@/types";
import type { QuantitativeAnalysis } from "@/lib/analysis";
import type { TextAnalysis } from "@/lib/text";
import type { InsightReport } from "@/lib/insights";
import { cleanDataset } from "@/lib/clean";
import { serializeCSV } from "@/lib/export";

// ── sessionStorage helpers ────────────────────────────────────────────────────

const subscribe: Parameters<typeof import("react").useSyncExternalStore>[0] =
  () => () => {};

type AnalysisPayload = {
  quant: QuantitativeAnalysis;
  text: TextAnalysis;
  insights: InsightReport;
};

const previewCache = new Map<
  string,
  { raw: string | null; result: ParseResult | null }
>();
const mappingCache = new Map<
  string,
  { raw: string | null; result: ColumnMapping[] | null }
>();
const cleaningCache = new Map<
  string,
  { raw: string | null; result: CleaningSummary | null }
>();
const analysisCache = new Map<
  string,
  { raw: string | null; result: AnalysisPayload | null }
>();

function readStored<T>(
  key: string,
  cache: Map<string, { raw: string | null; result: T | null }>,
): T | null {
  const raw = sessionStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.result;
  let result: T | null = null;
  if (raw) {
    try {
      result = JSON.parse(raw) as T;
    } catch {
      result = null;
    }
  }
  cache.set(key, { raw, result });
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
}

export default function ReportSection({ projectId }: Props) {
  const preview = useSyncExternalStore(
    subscribe,
    () => readStored<ParseResult>(`preview:${projectId}`, previewCache),
    () => null,
  );
  const mappings = useSyncExternalStore(
    subscribe,
    () => readStored<ColumnMapping[]>(`mapping:${projectId}`, mappingCache),
    () => null,
  );
  const cleaning = useSyncExternalStore(
    subscribe,
    () => readStored<CleaningSummary>(`cleaning:${projectId}`, cleaningCache),
    () => null,
  );
  const analysis = useSyncExternalStore(
    subscribe,
    () => readStored<AnalysisPayload>(`analysis:${projectId}`, analysisCache),
    () => null,
  );

  function handleDownloadCSV() {
    if (!preview || !mappings) return;
    const { dataset } = cleanDataset(preview.dataset, mappings);
    const csv = serializeCSV(dataset);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned_${preview.originalFilename ?? "export.csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            No analysis found — complete the analysis step first.
          </p>
        </div>
        <Link
          href={`/projects/${projectId}/analysis`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Back to analysis
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Export actions */}
      <div className="space-y-3 print:hidden">
        <div className="rounded-lg border border-zinc-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">Cleaned CSV</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {cleaning
                ? `${cleaning.totalRows.toLocaleString()} rows · ${cleaning.totalChanges.toLocaleString()} change(s) applied`
                : "Dataset with whitespace and invalid values fixed"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={!preview || !mappings}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download CSV
          </button>
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">Report (PDF)</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Print this page to save as PDF
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable report body */}
      <div className="space-y-8">
        <InsightsSummary report={analysis.insights} />
        <QuantSummary quant={analysis.quant} />
        <TextSummary text={analysis.text} />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/projects/${projectId}/analysis`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Back to analysis
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}

// ── Report sections ───────────────────────────────────────────────────────────

function InsightsSummary({ report }: { report: InsightReport }) {
  if (report.insights.length === 0) return null;
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900 mb-2">Key insights</h2>
      <p className="text-xs text-zinc-500 mb-4">{report.summary}</p>
      <div className="space-y-2">
        {report.insights.map((ins) => (
          <div key={ins.id} className="flex gap-3">
            <span
              className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                ins.severity === "positive"
                  ? "bg-emerald-500"
                  : ins.severity === "negative"
                    ? "bg-red-500"
                    : "bg-zinc-300"
              }`}
            />
            <div>
              <p className="text-xs font-medium text-zinc-800">{ins.title}</p>
              <p className="text-xs text-zinc-500">{ins.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuantSummary({ quant }: { quant: QuantitativeAnalysis }) {
  const hasData =
    quant.nps.length > 0 ||
    quant.ratings.length > 0 ||
    quant.numerics.length > 0 ||
    quant.categories.length > 0;
  if (!hasData) return null;

  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900 mb-3">
        Quantitative summary
      </h2>
      <div className="space-y-4">
        {quant.nps.map((r) => (
          <div key={r.columnName}>
            <p className="text-xs font-medium text-zinc-700 mb-1">
              {r.columnName} — NPS
            </p>
            <p className="text-2xl font-bold text-zinc-900">{r.score}</p>
            <p className="text-xs text-zinc-500">
              {r.promoterPct}% promoters · {r.passivePct}% passives ·{" "}
              {r.detractorPct}% detractors · {r.totalResponses.toLocaleString()}{" "}
              responses
            </p>
          </div>
        ))}
        {quant.ratings.map((r) => (
          <div key={r.columnName}>
            <p className="text-xs font-medium text-zinc-700 mb-0.5">
              {r.columnName} — Rating
            </p>
            <p className="text-xs text-zinc-500">
              Mean {r.mean} · Median {r.median} · Range {r.min}–{r.max} ·{" "}
              {r.totalResponses.toLocaleString()} responses
            </p>
          </div>
        ))}
        {quant.numerics.map((r) => (
          <div key={r.columnName}>
            <p className="text-xs font-medium text-zinc-700 mb-0.5">
              {r.columnName} — Numeric
            </p>
            <p className="text-xs text-zinc-500">
              Mean {r.mean} · Median {r.median} · Std dev {r.stdDev} ·{" "}
              {r.totalResponses.toLocaleString()} responses
            </p>
          </div>
        ))}
        {quant.categories.map((r) => (
          <div key={r.columnName}>
            <p className="text-xs font-medium text-zinc-700 mb-0.5">
              {r.columnName} — Category
            </p>
            <p className="text-xs text-zinc-500">
              {r.uniqueCount} unique values ·{" "}
              {r.totalResponses.toLocaleString()} responses · top:{" "}
              {r.frequencies
                .slice(0, 3)
                .map((f) => `${f.value} (${f.pct}%)`)
                .join(", ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TextSummary({ text }: { text: TextAnalysis }) {
  if (text.columns.length === 0) return null;
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900 mb-3">
        Open-text summary
      </h2>
      <div className="space-y-4">
        {text.columns.map((col) => (
          <div key={col.columnName}>
            <p className="text-xs font-medium text-zinc-700 mb-0.5">
              {col.columnName}
            </p>
            <p className="text-xs text-zinc-500">
              {col.totalResponses.toLocaleString()} responses · avg length{" "}
              {col.lengthStats.mean} chars · {col.sentiment.positivePct}%
              positive · {col.sentiment.negativePct}% negative
            </p>
            {col.topWords.length > 0 && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Top words:{" "}
                {col.topWords
                  .slice(0, 5)
                  .map((w) => w.word)
                  .join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
