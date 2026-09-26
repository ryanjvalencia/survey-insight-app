"use client";

import { useRef, useState } from "react";
import type { Insight, InsightSeverity } from "@/lib/insights";
import Icon, { type IconName } from "@/components/ui/Icon";
import { card, eyebrow } from "@/components/ui/styles";

interface InsightSpotlightProps {
  insights: Insight[];
  summary: string;
  /** Shows the sentiment footnote when any insight is about written answers. */
  hasTextInsights: boolean;
}

const TONE: Record<
  InsightSeverity,
  { label: string; icon: IconName; pill: string; panel: string; glow: string; bar: string }
> = {
  positive: {
    label: "Strength",
    icon: "trendUp",
    pill: "bg-good-bg text-good-text ring-good/20",
    panel: "from-good-bg via-surface to-surface",
    glow: "bg-good/15",
    bar: "bg-good",
  },
  negative: {
    label: "Needs attention",
    icon: "trendDown",
    pill: "bg-critical-bg text-critical-text ring-critical/20",
    panel: "from-critical-bg via-surface to-surface",
    glow: "bg-critical/15",
    bar: "bg-critical",
  },
  neutral: {
    label: "Observation",
    icon: "info",
    pill: "bg-brand-50 text-brand-800 ring-brand-200",
    panel: "from-brand-50 via-surface to-surface",
    glow: "bg-brand-300/25",
    bar: "bg-brand-500",
  },
};

const SWIPE_THRESHOLD = 50;

export default function InsightSpotlight({ insights, summary, hasTextInsights }: InsightSpotlightProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [view, setView] = useState<"spotlight" | "all">("spotlight");
  const pointerStart = useRef<number | null>(null);

  if (insights.length === 0) return null;

  const count = insights.length;
  const current = insights[Math.min(index, count - 1)];
  const tone = TONE[current.severity];

  /** Moves to `to`, wrapping at either end; `to` may be -1 or `count`. */
  function go(to: number) {
    setDirection(to > index ? "next" : "prev");
    setIndex((to + count) % count);
  }

  return (
    <section aria-labelledby="key-insights-heading" className="animate-fade-up">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrow}>Key insights</p>
          <h2 id="key-insights-heading" className="mt-1 text-xl font-semibold tracking-tight text-ink">
            What matters most
          </h2>
          <p className="mt-1 text-sm text-ink-2">{summary}</p>
        </div>
        {count > 1 && (
          <div role="group" aria-label="Insight view" className="flex rounded-lg bg-surface-sunken p-1 text-sm">
            {(["spotlight", "all"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={[
                  "rounded-md px-3 py-1.5 font-medium transition-all",
                  view === v ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
                ].join(" ")}
              >
                {v === "spotlight" ? "Spotlight" : `All ${count}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "spotlight" ? (
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Key insights, one at a time. Use the left and right arrow keys to move between them."
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              go(index + 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(index - 1);
            }
          }}
          onPointerDown={(e) => {
            pointerStart.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (pointerStart.current === null) return;
            const dx = e.clientX - pointerStart.current;
            pointerStart.current = null;
            if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? index + 1 : index - 1);
          }}
          className={`relative touch-pan-y overflow-hidden rounded-3xl bg-gradient-to-br ${tone.panel} shadow-raised ring-1 ring-line-soft transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
        >
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl transition-colors duration-500 ${tone.glow}`}
          />

          <div
            key={current.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            aria-live="polite"
            className={`relative grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center ${
              direction === "next" ? "animate-slide-next" : "animate-slide-prev"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ${tone.pill}`}>
                  <Icon name={tone.icon} className="h-3.5 w-3.5" />
                  {tone.label}
                </span>
                {current.topic && (
                  <span className="rounded-full bg-surface/70 px-2.5 py-1 font-medium text-ink-2 ring-1 ring-line-soft">
                    {current.topic}
                  </span>
                )}
              </div>
              <h3 className="mt-5 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-[2.1rem]">
                {current.title}
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">{current.body}</p>
            </div>

            {current.metric && (
              <div className="rounded-2xl bg-surface/80 px-6 py-5 text-center shadow-card ring-1 ring-line-soft backdrop-blur md:min-w-52">
                <p className="animate-pop text-4xl font-semibold tracking-tight text-ink sm:text-5xl [animation-delay:120ms]">
                  {current.metric.value}
                </p>
                <p className="mt-2 text-sm font-medium text-ink-2">{current.metric.label}</p>
              </div>
            )}
          </div>

          {count > 1 && (
            <div className="relative flex items-center gap-4 border-t border-line-soft/80 bg-surface/50 px-6 py-4 backdrop-blur sm:px-10">
              <ol className="flex flex-1 gap-1.5" aria-label="Choose an insight">
                {insights.map((ins, i) => (
                  <li key={ins.id} className="flex-1">
                    <button
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Insight ${i + 1}: ${ins.title}`}
                      aria-current={i === index ? "true" : undefined}
                      className="group block w-full py-2"
                    >
                      <span
                        className={[
                          "block h-1.5 rounded-full transition-all duration-300",
                          i === index ? tone.bar : "bg-line group-hover:bg-line-strong",
                        ].join(" ")}
                      />
                    </button>
                  </li>
                ))}
              </ol>
              <span className="tabular shrink-0 text-sm font-medium text-ink-2">
                {index + 1} / {count}
              </span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Previous insight"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-card ring-1 ring-line-soft transition-all hover:bg-surface-muted active:scale-95"
                >
                  <Icon name="arrowLeft" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Next insight"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-all hover:bg-brand-700 active:scale-95"
                >
                  <Icon name="arrowRight" className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {insights.map((ins, i) => {
            const t = TONE[ins.severity];
            return (
              <li
                key={ins.id}
                className={`${card} animate-fade-up flex flex-col p-5`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${t.pill}`}>
                    <Icon name={t.icon} className="h-3 w-3" />
                    {t.label}
                  </span>
                  {ins.metric && (
                    <span className="text-right">
                      <span className="block text-xl font-semibold tracking-tight text-ink">{ins.metric.value}</span>
                      <span className="block text-[11px] text-ink-3">{ins.metric.label}</span>
                    </span>
                  )}
                </div>
                <p className="mt-3 text-base font-semibold leading-snug text-ink">{ins.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{ins.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {hasTextInsights && (
        <p className="mt-3 text-xs text-ink-3">
          Comment sentiment is estimated from word choice, so treat it as a guide rather than an exact measure.
        </p>
      )}
    </section>
  );
}
