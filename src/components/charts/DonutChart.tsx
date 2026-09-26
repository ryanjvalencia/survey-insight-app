"use client";

import { useState } from "react";
import { formatCount, formatPercent } from "@/lib/format";

export interface Slice {
  label: string;
  value: number;
}

interface DonutChartProps {
  slices: Slice[];
  ariaLabel: string;
}

const RADIUS = 46;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** ~2px surface gap between slices at the rendered size. */
const GAP = 1.6;

/** Slices keep a fixed series slot; "Other" is always neutral gray. */
function sliceColor(label: string, index: number): string {
  return label === "Other" ? "var(--color-series-other)" : `var(--color-series-${index + 1})`;
}

export default function DonutChart({ slices, ariaLabel }: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const total = slices.reduce((acc, s) => acc + s.value, 0);

  const lengths = slices.map((s) => (total > 0 ? (s.value / total) * CIRCUMFERENCE : 0));
  const arcs = slices.map((s, i) => ({
    ...s,
    index: i,
    length: lengths[i],
    // Start of this arc = sum of all previous arc lengths.
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  const focus = active !== null ? slices[active] : null;

  return (
    <figure aria-label={ariaLabel} className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0 animate-pop">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-surface-sunken)" strokeWidth={STROKE} />
          {arcs.map((a) =>
            a.length > 0 ? (
              <circle
                key={a.index}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={sliceColor(a.label, a.index)}
                strokeWidth={active === a.index ? STROKE + 4 : STROKE}
                strokeDasharray={`${Math.max(0, a.length - (slices.length > 1 ? GAP : 0))} ${CIRCUMFERENCE}`}
                strokeDashoffset={-a.offset}
                className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                opacity={active !== null && active !== a.index ? 0.35 : 1}
                onPointerEnter={() => setActive(a.index)}
                onPointerLeave={() => setActive(null)}
              />
            ) : null,
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {focus ? (
            <>
              <span className="text-xl font-semibold text-ink">
                {formatPercent((focus.value / total) * 100)}
              </span>
              <span className="max-w-20 truncate text-[11px] text-ink-2">{focus.label}</span>
            </>
          ) : (
            <>
              <span className="text-xl font-semibold text-ink">{formatCount(total)}</span>
              <span className="text-[11px] text-ink-3">responses</span>
            </>
          )}
        </div>
      </div>

      {/* Legend doubles as the direct-label channel: every value is visible. */}
      <ul className="w-full min-w-0 flex-1 space-y-1">
        {slices.map((s, i) => (
          <li key={s.label}>
            <button
              type="button"
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className={[
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                active === i ? "bg-surface-sunken" : "hover:bg-surface-muted",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-[3px]"
                style={{ background: sliceColor(s.label, i) }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink" title={s.label}>
                {s.label}
              </span>
              <span className="tabular text-sm font-semibold text-ink">
                {total > 0 ? formatPercent((s.value / total) * 100) : "—"}
              </span>
              <span className="tabular w-14 text-right text-xs text-ink-3">{formatCount(s.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
