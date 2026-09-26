"use client";

import Link from "next/link";
import type { QuantitativeAnalysis } from "@/lib/analysis";
import type { TextAnalysis } from "@/lib/text";
import type { InsightReport } from "@/lib/insights";
import type { StoredAnalysis } from "@/lib/results";
import { cleanDataset } from "@/lib/clean";
import { serializeCSV } from "@/lib/export";
import { inferColumnTypes } from "@/lib/infer";
import { applyColumnTypes } from "@/lib/localdata";
import { useLocalProjectData } from "@/components/localdata/useLocalProjectData";
import { formatCount, formatNumber, formatPercent, humanizeColumn } from "@/lib/format";
import NpsMeter from "@/components/charts/NpsMeter";
import Icon, { type IconName } from "@/components/ui/Icon";
import { NAV_BACK } from "@/components/ui/PageTransition";
import { btnGhost, btnPrimary, btnSecondary, card, sectionTitle } from "@/components/ui/styles";

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  projectName: string;
  analysis: StoredAnalysis | null;
}

export default function ReportSection({ projectId, projectName, analysis }: Props) {
  // Raw rows and column choices live only on this device (IndexedDB); the
  // cleaned CSV is rebuilt here and never sent to the server.
  const local = useLocalProjectData(projectId);
  const upload = local.status === "ready" ? local.upload : null;
  const canDownloadCSV = upload !== null;

  function handleDownloadCSV() {
    if (!upload) return;
    const columnTypes = local.status === "ready" ? local.columnTypes : null;
    const mappings = applyColumnTypes(inferColumnTypes(upload.dataset), columnTypes);
    const { dataset } = cleanDataset(upload.dataset, mappings);
    const csv = serializeCSV(dataset);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned_${upload.originalFilename ?? "export.csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  if (!analysis) {
    return (
      <div className={`${card} animate-fade-up px-6 py-14 text-center`}>
        <p className="text-base font-semibold text-ink">No report yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
          Run the analysis first — the report is built from its results.
        </p>
        <Link
          href={`/projects/${projectId}/analysis`}
          transitionTypes={NAV_BACK}
          className={`${btnSecondary} mt-6`}
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to analysis
        </Link>
      </div>
    );
  }

  const nps = analysis.quant.nps[0];
  const generated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Export actions */}
      <div className="grid gap-3 sm:grid-cols-2 print:hidden">
        <ExportCard
          icon="download"
          title="Cleaned data (CSV)"
          description={
            canDownloadCSV
              ? `${formatCount(analysis.cleaning.totalRows)} rows · ${formatCount(analysis.cleaning.totalChanges)} fixes applied`
              : local.status === "loading"
                ? "Checking this device for your file…"
                : "Re-upload your file on this device to download it. Raw data is never stored on our servers."
          }
          action="Download CSV"
          onClick={handleDownloadCSV}
          disabled={!canDownloadCSV}
        />
        <ExportCard
          icon="printer"
          title="Client report (PDF)"
          description="Opens your browser's print dialog — choose “Save as PDF”."
          action="Print / Save PDF"
          onClick={handlePrint}
          primary
        />
      </div>

      {/* Printable report document */}
      <article className={`${card} animate-fade-up overflow-hidden print:shadow-none print:ring-0`}>
        <header className="border-b border-line-soft bg-gradient-to-br from-brand-50 via-surface to-surface px-6 py-8 sm:px-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
            Survey insight report
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{projectName}</h2>
          <p className="mt-2 text-sm text-ink-2">
            {generated} · {formatCount(analysis.cleaning.totalRows)} responses ·{" "}
            {analysis.cleaning.totalColumns} questions
          </p>
        </header>

        <div className="space-y-10 px-6 py-8 sm:px-10">
          <InsightsSummary report={analysis.insights} />
          {nps && (
            <section className="break-inside-avoid">
              <h3 className={`${sectionTitle} mb-5`}>
                Net Promoter Score — {humanizeColumn(nps.columnName)}
              </h3>
              <NpsMeter
                score={nps.score}
                mean={nps.mean}
                promoterPct={nps.promoterPct}
                passivePct={nps.passivePct}
                detractorPct={nps.detractorPct}
              />
            </section>
          )}
          <QuantSummary quant={analysis.quant} />
          <TextSummary text={analysis.text} />
        </div>

        <footer className="border-t border-line-soft px-6 py-4 text-xs text-ink-3 sm:px-10">
          Prepared with Survey Insight. Figures are computed from the cleaned dataset; individual
          responses are not included.
        </footer>
      </article>

      <div className="flex items-center justify-between print:hidden">
        <Link href={`/projects/${projectId}/analysis`} transitionTypes={NAV_BACK} className={btnSecondary}>
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to analysis
        </Link>
        <Link href="/dashboard" transitionTypes={NAV_BACK} className={btnGhost}>
          All projects
        </Link>
      </div>
    </div>
  );
}

function ExportCard({
  icon,
  title,
  description,
  action,
  onClick,
  disabled,
  primary,
}: {
  icon: IconName;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <div className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${primary ? btnPrimary : btnSecondary} mt-auto self-start`}
      >
        {action}
      </button>
    </div>
  );
}

// ── Report sections ───────────────────────────────────────────────────────────

const INSIGHT_ICON = {
  positive: { icon: "trendUp", tile: "bg-good-bg text-good-text", label: "Strength" },
  negative: { icon: "trendDown", tile: "bg-critical-bg text-critical-text", label: "Needs attention" },
  neutral: { icon: "info", tile: "bg-brand-50 text-brand-700", label: "Observation" },
} as const;

function InsightsSummary({ report }: { report: InsightReport }) {
  if (report.insights.length === 0) return null;
  return (
    <section>
      <h3 className={sectionTitle}>Key insights</h3>
      <p className="mb-5 mt-1 text-sm text-ink-2">{report.summary}</p>
      <div className="space-y-4">
        {report.insights.map((ins) => {
          const s = INSIGHT_ICON[ins.severity];
          return (
            <div key={ins.id} className="flex break-inside-avoid gap-3">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.tile}`}>
                <Icon name={s.icon} className="h-4 w-4" title={s.label} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{ins.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{ins.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SummaryTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string>>;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="break-inside-avoid">
      <h3 className={`${sectionTitle} mb-3`}>{title}</h3>
      <div className="overflow-x-auto rounded-xl ring-1 ring-line-soft">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-surface-muted">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-ink-2 ${i === 0 ? "text-left" : "text-right"}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2.5 ${i === 0 ? "text-left font-medium text-ink" : "tabular text-right text-ink-2"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Ratings, numeric columns, and categories (NPS is shown by the meter). */
function QuantSummary({ quant }: { quant: QuantitativeAnalysis }) {
  return (
    <>
      <SummaryTable
        title="Ratings"
        columns={["Question", "Average", "Median", "Range", "Responses"]}
        rows={quant.ratings.map((r) => [
          humanizeColumn(r.columnName),
          formatNumber(r.mean),
          formatNumber(r.median),
          `${r.min}–${r.max}`,
          formatCount(r.totalResponses),
        ])}
      />
      <SummaryTable
        title="Numeric answers"
        columns={["Question", "Average", "Median", "Std. dev.", "Responses"]}
        rows={quant.numerics.map((r) => [
          humanizeColumn(r.columnName),
          formatNumber(r.mean),
          formatNumber(r.median),
          formatNumber(r.stdDev),
          formatCount(r.totalResponses),
        ])}
      />
      <SummaryTable
        title="Categories"
        columns={["Question", "Most common", "Share", "Distinct values", "Responses"]}
        rows={quant.categories.map((r) => [
          humanizeColumn(r.columnName),
          r.frequencies[0]?.value ?? "—",
          r.frequencies[0] ? formatPercent(r.frequencies[0].pct) : "—",
          formatCount(r.uniqueCount),
          formatCount(r.totalResponses),
        ])}
      />
    </>
  );
}

function TextSummary({ text }: { text: TextAnalysis }) {
  if (text.columns.length === 0) return null;
  return (
    <section className="break-inside-avoid">
      <h3 className={`${sectionTitle} mb-3`}>Open-text responses</h3>
      <div className="space-y-4">
        {text.columns.map((col) => (
          <div key={col.columnName} className="rounded-xl p-4 ring-1 ring-line-soft">
            <p className="text-sm font-semibold text-ink">{humanizeColumn(col.columnName)}</p>
            <p className="mt-1 text-sm text-ink-2">
              {formatCount(col.totalResponses)} responses · {formatPercent(col.sentiment.positivePct)} positive ·{" "}
              {formatPercent(col.sentiment.negativePct)} negative · average {formatCount(col.lengthStats.mean)} characters
            </p>
            {col.topWords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {col.topWords.slice(0, 8).map((w) => (
                  <span
                    key={w.word}
                    className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800"
                  >
                    {w.word} <span className="tabular font-normal text-brand-700">{formatCount(w.count)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
