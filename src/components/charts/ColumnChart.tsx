"use client";

import { useState } from "react";
import { compactNumber, formatCount, niceTicks } from "@/lib/format";

export interface Column {
  /** Short label under a categorical column (unused for histograms). */
  label: string;
  value: number;
  /** Full description for the tooltip, e.g. "$25,507 – $50,504". */
  detail: string;
}

interface ColumnChartProps {
  columns: Column[];
  /**
   * "histogram": contiguous bins with 2px gaps, x-axis ticks at bin edges.
   * "categorical": separated columns with a label under each.
   */
  variant: "histogram" | "categorical";
  /** Bin edges for histograms (columns.length + 1 values). */
  edges?: number[];
  /** What the y-value counts, e.g. "responses". */
  unit: string;
  ariaLabel: string;
}

const PLOT_HEIGHT = "h-52";

export default function ColumnChart({ columns, variant, edges, unit, ariaLabel }: ColumnChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(0, ...columns.map((c) => c.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const peak = columns.findIndex((c) => c.value === max);
  const isHistogram = variant === "histogram";

  return (
    <figure aria-label={ariaLabel} className="select-none">
      <div className="flex">
        {/* Y axis */}
        <div className={`relative ${PLOT_HEIGHT} w-10 shrink-0`} aria-hidden="true">
          {ticks.map((t) => (
            <span
              key={t}
              className="tabular absolute right-2 -translate-y-1/2 text-[11px] text-ink-3"
              style={{ bottom: `${(t / top) * 100}%` }}
            >
              {compactNumber(t)}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className={`relative ${PLOT_HEIGHT} flex-1 border-b border-line-strong`}>
          {ticks.slice(1).map((t) => (
            <div
              key={t}
              aria-hidden="true"
              className="absolute inset-x-0 h-px bg-line-soft"
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}

          <div
            className={`absolute inset-0 flex items-end ${isHistogram ? "gap-[2px]" : "justify-around gap-2"}`}
          >
            {columns.map((c, i) => {
              const heightPct = top > 0 ? (c.value / top) * 100 : 0;
              const isActive = active === i;
              return (
                <div
                  key={i}
                  role="img"
                  tabIndex={0}
                  aria-label={`${c.detail}: ${formatCount(c.value)} ${unit}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className={`relative flex h-full items-end justify-center outline-none ${isHistogram ? "flex-1" : "flex-1 max-w-24"}`}
                >
                  {/* Direct label on the tallest column only */}
                  {i === peak && c.value > 0 && !isActive && (
                    <span
                      className="tabular absolute -translate-y-full pb-1 text-[11px] font-semibold text-ink-2"
                      style={{ bottom: `${heightPct}%` }}
                    >
                      {compactNumber(c.value)}
                    </span>
                  )}
                  <div
                    className={[
                      "animate-grow-y origin-bottom rounded-t-[4px] transition-[filter,opacity] duration-150",
                      isHistogram ? "w-full" : "w-full max-w-10",
                      active !== null && !isActive ? "opacity-45" : "",
                      isActive ? "brightness-110" : "",
                    ].join(" ")}
                    style={{
                      height: `${heightPct}%`,
                      minHeight: c.value > 0 ? 2 : 0,
                      background: "var(--color-series-1)",
                      animationDelay: `${i * 35}ms`,
                    }}
                  />
                  {isActive && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute z-10 mb-2 w-max max-w-56 -translate-y-full animate-fade-in rounded-lg bg-ink px-3 py-2 text-left shadow-raised"
                      style={{ bottom: `${heightPct}%` }}
                    >
                      <p className="tabular text-sm font-semibold text-white">
                        {formatCount(c.value)} {unit}
                      </p>
                      <p className="text-xs text-white/70">{c.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis */}
      <div className="ml-10 mt-2" aria-hidden="true">
        {isHistogram && edges && edges.length === columns.length + 1 ? (
          <div className="relative h-4">
            {edges.map((edge, i) => (
              <span
                key={i}
                className={[
                  "tabular absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-3",
                  // On narrow screens show every other edge so labels don't collide.
                  i % 2 === 1 && i !== edges.length - 1 ? "hidden sm:inline" : "",
                ].join(" ")}
                style={{ left: `${(i / columns.length) * 100}%` }}
              >
                {compactNumber(edge)}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex justify-around gap-2">
            {columns.map((c, i) => (
              <span key={i} className="flex-1 max-w-24 truncate text-center text-[11px] text-ink-3">
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
