import { formatNpsScore } from "@/lib/charts";
import { formatPercent } from "@/lib/format";

interface NpsMeterProps {
  score: number;
  mean: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

/**
 * Common NPS benchmark bands. NPS runs −100 to +100; these are widely used
 * reference ranges, not an industry-specific target.
 */
const BANDS = [
  { from: -100, to: 0, label: "Needs work", color: "#f3d3d3" },
  { from: 0, to: 30, label: "Good", color: "#e4e3de" },
  { from: 30, to: 70, label: "Great", color: "var(--color-brand-200)" },
  { from: 70, to: 100, label: "Excellent", color: "var(--color-brand-300)" },
] as const;

const TICKS = [-100, 0, 30, 70, 100];

function position(value: number): number {
  return ((Math.max(-100, Math.min(100, value)) + 100) / 200) * 100;
}

export function npsBand(score: number): string {
  return BANDS.find((b) => score < b.to || b.to === 100)?.label ?? "";
}

export default function NpsMeter({ score, mean, promoterPct, passivePct, detractorPct }: NpsMeterProps) {
  const pos = position(score);
  const segments = [
    { key: "Detractors (0–6)", pct: detractorPct, color: "var(--color-diverge-neg)", ink: "text-white" },
    { key: "Passives (7–8)", pct: passivePct, color: "var(--color-series-other)", ink: "text-ink" },
    { key: "Promoters (9–10)", pct: promoterPct, color: "var(--color-diverge-pos)", ink: "text-white" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="text-5xl font-semibold tracking-tight text-ink">{formatNpsScore(score)}</p>
        <div className="pb-1.5">
          <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200">
            {npsBand(score)}
          </span>
          <p className="mt-1 text-xs text-ink-2">
            Scale −100 to +100 · average answer {mean} / 10
          </p>
        </div>
      </div>

      {/* Benchmark track with the score marker */}
      <div>
        <div className="relative pt-9">
          <div
            className="animate-marker-in absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${pos}%` }}
          >
            <span className="tabular rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white shadow-raised">
              {formatNpsScore(score)}
            </span>
            <span className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink" />
          </div>
          <div className="relative flex h-3 gap-[2px] overflow-hidden rounded-full">
            {BANDS.map((b) => (
              <div
                key={b.label}
                style={{ width: `${((b.to - b.from) / 200) * 100}%`, background: b.color }}
              />
            ))}
            <div
              aria-hidden="true"
              className="animate-marker-in absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink shadow-md"
              style={{ left: `${pos}%` }}
            />
          </div>
        </div>
        <div className="relative mt-2 h-4">
          {TICKS.map((t) => (
            <span
              key={t}
              className={[
                "tabular absolute text-[11px] text-ink-3",
                t === -100 ? "" : t === 100 ? "-translate-x-full" : "-translate-x-1/2",
              ].join(" ")}
              style={{ left: `${position(t)}%` }}
            >
              {t > 0 ? `+${t}` : t < 0 ? `−${-t}` : "0"}
            </span>
          ))}
        </div>
        <div className="mt-1 flex text-[11px] font-medium text-ink-2">
          {BANDS.map((b) => (
            <span
              key={b.label}
              className="truncate text-center"
              style={{ width: `${((b.to - b.from) / 200) * 100}%` }}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Respondent breakdown: part-to-whole, diverging red ↔ gray ↔ blue */}
      <div>
        <p className="mb-2 text-xs font-medium text-ink-2">How respondents answered</p>
        <div className="flex h-7 gap-[2px] overflow-hidden rounded-md">
          {segments.map((s) =>
            s.pct > 0 ? (
              <div
                key={s.key}
                className={`animate-grow-x flex origin-left items-center justify-center text-[11px] font-semibold ${s.ink}`}
                style={{ width: `${s.pct}%`, background: s.color }}
                title={`${s.key}: ${formatPercent(s.pct)}`}
              >
                {s.pct >= 12 ? formatPercent(s.pct) : ""}
              </div>
            ) : null,
          )}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
              {s.key}
              <span className="tabular font-semibold text-ink">{formatPercent(s.pct)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
