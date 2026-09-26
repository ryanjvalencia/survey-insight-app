import Link from "next/link";
import type { CleaningSummary } from "@/types";
import { formatNpsScore, type ChartSpec } from "@/lib/charts";
import { generateInsights } from "@/lib/insights";
import type { StoredAnalysis } from "@/lib/results";
import {
  compactNumber,
  formatCount,
  formatNumber,
  formatPercent,
  humanizeColumn,
} from "@/lib/format";
import ChartCard from "@/components/charts/ChartCard";
import ColumnChart from "@/components/charts/ColumnChart";
import DonutChart from "@/components/charts/DonutChart";
import NpsMeter from "@/components/charts/NpsMeter";
import BarList from "@/components/charts/BarList";
import InsightSpotlight from "@/components/insights/InsightSpotlight";
import Icon, { type IconName } from "@/components/ui/Icon";
import { NAV_BACK, NAV_FORWARD } from "@/components/ui/PageTransition";
import { btnPrimary, btnSecondary, card, sectionTitle } from "@/components/ui/styles";

interface Props {
  projectId: string;
  analysis: StoredAnalysis | null;
}

export default function AnalysisDashboard({ projectId, analysis }: Props) {
  if (!analysis) {
    return (
      <div className={`${card} animate-fade-up px-6 py-14 text-center`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Icon name="chart" className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-ink">No analysis yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-2">
          Upload your file and confirm the column types to generate insights and charts.
        </p>
        <Link
          href={`/projects/${projectId}/upload`}
          transitionTypes={NAV_BACK}
          className={`${btnPrimary} mt-6`}
        >
          <Icon name="upload" className="h-4 w-4" />
          Upload data
        </Link>
      </div>
    );
  }

  // Regenerated from the stored aggregates so every project — including ones
  // analyzed before a wording change — shows the current insight rules.
  const insightReport = generateInsights(analysis.quant, analysis.text);

  return (
    <div className="space-y-10">
      <InsightSpotlight
        insights={insightReport.insights}
        summary={insightReport.summary}
        hasTextInsights={analysis.text.columns.length > 0}
      />
      <KpiRow analysis={analysis} />
      <ChartsSection analysis={analysis} />
      <CleaningSection summary={analysis.cleaning} />

      <div className="flex items-center justify-between pt-2">
        <Link href={`/projects/${projectId}/mapping`} transitionTypes={NAV_BACK} className={btnSecondary}>
          <Icon name="arrowLeft" className="h-4 w-4" />
          Adjust columns
        </Link>
        <Link href={`/projects/${projectId}/report`} transitionTypes={NAV_FORWARD} className={btnPrimary}>
          View report
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

// ── KPI row ───────────────────────────────────────────────────────────────────

function KpiRow({ analysis }: { analysis: StoredAnalysis }) {
  const nps = analysis.quant.nps[0];
  const rating = analysis.quant.ratings[0];
  const tiles: Array<{ label: string; value: string; note: string; icon: IconName }> = [
    {
      label: "Responses analyzed",
      value: formatCount(analysis.cleaning.totalRows),
      note: `${analysis.cleaning.totalColumns} columns`,
      icon: "table",
    },
  ];
  if (nps) {
    tiles.push({
      label: "Net Promoter Score",
      value: formatNpsScore(nps.score),
      note: `${formatPercent(nps.promoterPct)} promoters`,
      icon: "trendUp",
    });
  }
  if (rating) {
    tiles.push({
      label: `Average ${humanizeColumn(rating.columnName).toLowerCase()}`,
      value: formatNumber(rating.mean),
      note: `out of ${rating.max} · ${formatCount(rating.totalResponses)} ratings`,
      icon: "sparkle",
    });
  }
  tiles.push({
    label: "Cells cleaned",
    value: formatCount(analysis.cleaning.totalChanges),
    note: "whitespace, formats, invalid values",
    icon: "checkCircle",
  });

  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={`${card} animate-fade-up p-4 sm:p-5`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-2">{t.label}</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name={t.icon} className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{t.value}</p>
          <p className="mt-1 truncate text-xs text-ink-3">{t.note}</p>
        </div>
      ))}
    </section>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────

function ChartsSection({ analysis }: { analysis: StoredAnalysis }) {
  const charts = analysis.charts.charts;
  if (charts.length === 0) return null;
  return (
    <section>
      <h2 className={`${sectionTitle} mb-4`}>Charts</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {charts.map((chart, i) => (
          <ChartFor key={`${chart.type}-${chart.columnName}-${i}`} chart={chart} analysis={analysis} />
        ))}
      </div>
    </section>
  );
}

function ChartFor({ chart, analysis }: { chart: ChartSpec; analysis: StoredAnalysis }) {
  const name = humanizeColumn(chart.columnName);

  if (chart.type === "nps_gauge") {
    return (
      <ChartCard
        className="lg:col-span-2"
        title={`${name} — Net Promoter Score`}
        subtitle={`${formatCount(chart.totalResponses)} responses`}
        table={{
          columns: ["Group", "Share"],
          rows: [
            ["Promoters (9–10)", formatPercent(chart.promoterPct)],
            ["Passives (7–8)", formatPercent(chart.passivePct)],
            ["Detractors (0–6)", formatPercent(chart.detractorPct)],
            ["NPS", formatNpsScore(chart.score)],
          ],
        }}
      >
        <NpsMeter
          score={chart.score}
          mean={chart.mean}
          promoterPct={chart.promoterPct}
          passivePct={chart.passivePct}
          detractorPct={chart.detractorPct}
        />
      </ChartCard>
    );
  }

  if (chart.type === "bar") {
    const total = chart.data.reduce((a, d) => a + d.value, 0);
    return (
      <ChartCard
        title={`${name} — rating distribution`}
        subtitle={`${formatCount(total)} ratings`}
        table={{
          columns: ["Rating", "Responses", "Share"],
          rows: chart.data.map((d) => [d.label, formatCount(d.value), formatPercent(total ? (d.value / total) * 100 : 0)]),
        }}
      >
        <ColumnChart
          variant="categorical"
          unit="responses"
          ariaLabel={`${name} rating distribution`}
          columns={chart.data.map((d) => ({ label: d.label, value: d.value, detail: `Rated ${d.label}` }))}
        />
      </ChartCard>
    );
  }

  if (chart.type === "histogram") {
    const bins = chart.bins ?? [];
    const edges = bins.length > 0 ? [...bins.map((b) => b.lo), bins[bins.length - 1].hi] : undefined;
    return (
      <ChartCard
        title={`${name} — distribution`}
        subtitle={`Average ${compactNumber(chart.mean)} · median ${compactNumber(chart.median)}`}
        table={{
          columns: ["Range", "Responses"],
          rows: bins.map((b) => [`${formatNumber(b.lo)} – ${formatNumber(b.hi)}`, formatCount(b.count)]),
        }}
      >
        {bins.length > 0 ? (
          <ColumnChart
            variant="histogram"
            unit="responses"
            edges={edges}
            ariaLabel={`${name} distribution histogram`}
            columns={bins.map((b) => ({
              label: compactNumber(b.lo),
              value: b.count,
              detail: `${formatNumber(b.lo)} – ${formatNumber(b.hi)}`,
            }))}
          />
        ) : (
          <p className="text-sm text-ink-2">Re-run the analysis to see this distribution.</p>
        )}
      </ChartCard>
    );
  }

  if (chart.type === "pie") {
    return (
      <ChartCard
        title={`${name} — breakdown`}
        subtitle={chart.data.some((d) => d.label === "Other") ? "Top 5 values, the rest grouped as Other" : undefined}
        table={{
          columns: ["Value", "Responses"],
          rows: chart.data.map((d) => [d.label, formatCount(d.value)]),
        }}
      >
        <DonutChart ariaLabel={`${name} breakdown`} slices={chart.data} />
      </ChartCard>
    );
  }

  // word_cloud_data → ranked list of the most frequent words
  const textCol = analysis.text.columns.find((c) => c.columnName === chart.columnName);
  const words = chart.words.slice(0, 10);
  return (
    <ChartCard
      title={`${name} — most mentioned words`}
      subtitle={
        textCol
          ? `${formatCount(textCol.totalResponses)} responses · ${formatPercent(textCol.sentiment.positivePct)} positive · ${formatPercent(textCol.sentiment.negativePct)} negative`
          : undefined
      }
      table={{ columns: ["Word", "Mentions"], rows: words.map((w) => [w.word, formatCount(w.count)]) }}
    >
      {words.length > 0 ? (
        <BarList
          unit="mentions"
          ariaLabel={`Most mentioned words in ${name}`}
          items={words.map((w) => ({ label: w.word, value: w.count }))}
        />
      ) : (
        <p className="text-sm text-ink-2">No recurring words found.</p>
      )}
    </ChartCard>
  );
}

// ── Cleaning summary ──────────────────────────────────────────────────────────

function CleaningSection({ summary }: { summary: CleaningSummary }) {
  const changed = summary.columns.filter(
    (c) => c.trimmed + c.nullified + c.clamped + c.normalized > 0,
  );

  return (
    <details className={`${card} group animate-fade-up`}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-good-bg text-good-text">
          <Icon name="checkCircle" className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">What we cleaned</p>
          <p className="text-xs text-ink-2">
            {summary.totalChanges === 0
              ? `No changes needed — all ${formatCount(summary.totalRows)} rows were already clean.`
              : `${formatCount(summary.totalChanges)} fixes across ${changed.length} column${changed.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {summary.totalChanges > 0 && (
          <Icon name="arrowRight" className="h-4 w-4 text-ink-3 transition-transform duration-200 group-open:rotate-90" />
        )}
      </summary>

      {changed.length > 0 && (
        <div className="overflow-x-auto border-t border-line-soft px-5 pb-5 pt-3 sm:px-6">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr>
                {["Column", "Trimmed", "Emptied (invalid)", "Capped to range", "Reformatted"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`whitespace-nowrap px-3 py-2 text-xs font-medium text-ink-2 ${i === 0 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {changed.map((c) => (
                <tr key={c.columnName}>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{humanizeColumn(c.columnName)}</td>
                  <CountCell value={c.trimmed} />
                  <CountCell value={c.nullified} warn />
                  <CountCell value={c.clamped} warn />
                  <CountCell value={c.normalized} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

function CountCell({ value, warn }: { value: number; warn?: boolean }) {
  if (value === 0) return <td className="px-3 py-2 text-right text-line-strong">—</td>;
  return (
    <td className={`tabular px-3 py-2 text-right ${warn ? "font-semibold text-warning-text" : "text-ink-2"}`}>
      {formatCount(value)}
    </td>
  );
}
