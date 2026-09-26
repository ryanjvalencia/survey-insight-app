import Link from "next/link";
import type { CleaningSummary } from "@/types";
import { formatNpsScore, type ChartSet } from "@/lib/charts";
import type { InsightReport } from "@/lib/insights";
import type { StoredAnalysis } from "@/lib/results";

interface Props {
  projectId: string;
  analysis: StoredAnalysis | null;
}

export default function AnalysisDashboard({ projectId, analysis }: Props) {
  if (!analysis) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            This project hasn&apos;t been analyzed yet. Upload your file and
            confirm the column types to run the analysis.
          </p>
        </div>
        <div className="flex justify-start">
          <Link
            href={`/projects/${projectId}/upload`}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Upload data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <CleaningSection summary={analysis.cleaning} />
      <InsightsSection report={analysis.insights} />
      <ChartsSection charts={analysis.charts} />

      <div className="flex items-center justify-between pt-4">
        <Link
          href={`/projects/${projectId}/mapping`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Back to mapping
        </Link>
        <Link
          href={`/projects/${projectId}/report`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Next: Report →
        </Link>
      </div>
    </div>
  );
}

// ── Cleaning summary ──────────────────────────────────────────────────────────

function CleaningSection({ summary }: { summary: CleaningSummary }) {
  const changed = summary.columns.filter(
    (c) => c.trimmed + c.nullified + c.clamped + c.normalized > 0,
  );
  if (summary.totalChanges === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">
          Data cleaning
        </h2>
        <p className="text-sm text-zinc-500">
          No changes needed — all {summary.totalRows.toLocaleString()} rows
          were already clean.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-700 mb-3">
        Data cleaning
      </h2>
      <p className="text-xs text-zinc-500 mb-3">
        {summary.totalChanges.toLocaleString()} change(s) across{" "}
        {changed.length} column(s) of{" "}
        {summary.totalRows.toLocaleString()} rows.
      </p>
      <div className="rounded-lg border border-zinc-200 overflow-x-auto">
        <table className="w-full text-xs min-w-max">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              {["Column", "Trimmed", "Nullified", "Clamped", "Normalized"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-medium text-zinc-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {changed.map((c, i) => (
              <tr
                key={c.columnName}
                className={`border-b border-zinc-100 last:border-0 ${i % 2 !== 0 ? "bg-zinc-50/50" : ""}`}
              >
                <td className="px-3 py-2 font-medium text-zinc-800 whitespace-nowrap">
                  {c.columnName}
                </td>
                <Stat value={c.trimmed} />
                <Stat value={c.nullified} warn />
                <Stat value={c.clamped} warn />
                <Stat value={c.normalized} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ value, warn }: { value: number; warn?: boolean }) {
  if (value === 0)
    return <td className="px-3 py-2 text-zinc-300">—</td>;
  return (
    <td
      className={`px-3 py-2 font-medium ${warn ? "text-amber-700" : "text-zinc-700"}`}
    >
      {value.toLocaleString()}
    </td>
  );
}

// ── Insights ──────────────────────────────────────────────────────────────────

function InsightsSection({ report }: { report: InsightReport }) {
  if (report.insights.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-700 mb-1">Insights</h2>
      <p className="text-xs text-zinc-400 mb-3">{report.summary}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {report.insights.map((ins) => (
          <div
            key={ins.id}
            className={`rounded-lg border px-4 py-3 ${
              ins.severity === "positive"
                ? "border-emerald-200 bg-emerald-50"
                : ins.severity === "negative"
                  ? "border-red-200 bg-red-50"
                  : "border-zinc-200 bg-white"
            }`}
          >
            <p
              className={`text-xs font-semibold mb-1 ${
                ins.severity === "positive"
                  ? "text-emerald-800"
                  : ins.severity === "negative"
                    ? "text-red-800"
                    : "text-zinc-700"
              }`}
            >
              {ins.title}
            </p>
            <p
              className={`text-xs ${
                ins.severity === "positive"
                  ? "text-emerald-700"
                  : ins.severity === "negative"
                    ? "text-red-700"
                    : "text-zinc-500"
              }`}
            >
              {ins.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────

function ChartsSection({ charts }: { charts: ChartSet }) {
  if (charts.charts.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-700 mb-3">Charts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {charts.charts.map((chart, i) => (
          <ChartCard key={i} chart={chart} />
        ))}
      </div>
    </section>
  );
}

function ChartCard({
  chart,
}: {
  chart: ChartSet["charts"][number];
}) {
  if (chart.type === "nps_gauge") {
    return (
      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-xs font-medium text-zinc-500 mb-3">
          {chart.columnName} — NPS
        </p>
        <p className="text-5xl font-bold text-zinc-900">
          {formatNpsScore(chart.score)}
        </p>
        <p className="text-xs text-zinc-400 mt-1 mb-4">
          Net Promoter Score, −100 to +100
          {Number.isFinite(chart.mean) && <> · average answer {chart.mean} / 10</>}
        </p>
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-700">
            {chart.promoterPct}% promoters
          </span>
          <span className="text-zinc-400">{chart.passivePct}% passives</span>
          <span className="text-red-600">{chart.detractorPct}% detractors</span>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          {chart.totalResponses.toLocaleString()} responses
        </p>
      </div>
    );
  }

  if (chart.type === "bar" || chart.type === "histogram") {
    const maxVal = Math.max(...chart.data.map((d) => d.value), 1);
    return (
      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-xs font-medium text-zinc-500 mb-3">{chart.title}</p>
        <div className="space-y-1">
          {chart.data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-16 shrink-0 truncate">
                {d.label}
              </span>
              <div className="flex-1 h-4 bg-zinc-100 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-zinc-700 rounded-sm"
                  style={{ width: `${(d.value / maxVal) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 w-6 text-right shrink-0">
                {d.value}
              </span>
            </div>
          ))}
        </div>
        {chart.type === "histogram" && (
          <p className="text-[10px] text-zinc-400 mt-2">
            Mean: {chart.mean} · Median: {chart.median}
          </p>
        )}
      </div>
    );
  }

  if (chart.type === "pie") {
    const total = chart.data.reduce((a, d) => a + d.value, 0);
    return (
      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-xs font-medium text-zinc-500 mb-3">{chart.title}</p>
        <div className="space-y-1">
          {chart.data.map((d) => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 truncate max-w-[60%]">
                {d.label}
              </span>
              <span className="text-xs text-zinc-400">
                {d.value} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chart.type === "word_cloud_data") {
    return (
      <div className="rounded-lg border border-zinc-200 p-4">
        <p className="text-xs font-medium text-zinc-500 mb-3">
          {chart.columnName} — top words
        </p>
        <div className="flex flex-wrap gap-2">
          {chart.words.map((w) => (
            <span
              key={w.word}
              className="text-zinc-700 font-medium"
              style={{ fontSize: `${Math.max(10, Math.round(w.weight * 18))}px` }}
            >
              {w.word}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
