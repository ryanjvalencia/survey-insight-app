import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Icon, { type IconName } from "@/components/ui/Icon";
import { btnGhost, btnPrimary, btnSecondary, card, eyebrow } from "@/components/ui/styles";

const STEPS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "upload",
    title: "Upload the export",
    body: "Drop in the CSV from SurveyMonkey, Typeform, Google Forms, or your client's CRM.",
  },
  {
    icon: "table",
    title: "Confirm the columns",
    body: "We detect NPS, ratings, categories, dates, and open text. Fix anything with one click.",
  },
  {
    icon: "sparkle",
    title: "Get cleaned, analysed data",
    body: "Whitespace, currency formats, and out-of-range answers are fixed, and every fix is listed.",
  },
  {
    icon: "printer",
    title: "Hand over the report",
    body: "Charts, NPS benchmarks, and plain-English insights, ready to print or save as PDF.",
  },
];

const FOR_WHOM = [
  {
    role: "Consultants",
    pain: "Stop losing billable hours cleaning client survey exports before the real analysis starts.",
    primary: true,
  },
  {
    role: "Agencies",
    pain: "Turn NPS and CSAT exports into summaries clients can actually read.",
  },
  {
    role: "Researchers",
    pain: "See themes and sentiment across hundreds of open-text answers in minutes.",
  },
];

const PREVIEW_BARS = [28, 44, 61, 83, 70, 52, 36];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className={btnGhost}>
            Sign in
          </Link>
          <Link href="/signup" className={btnPrimary}>
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-100 via-brand-50 to-transparent blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div className="animate-fade-up">
              <p className={eyebrow}>Survey analysis for consultants</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                Messy survey exports in.
                <br />
                <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                  Client-ready insights out.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
                Upload a CSV, confirm the columns, and get cleaned data, NPS benchmarks, charts,
                and a report you can hand straight to your client.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={`${btnPrimary} px-6 py-3 text-[15px]`}>
                  Analyze a survey
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                <Link href="/login" className={`${btnSecondary} px-6 py-3 text-[15px]`}>
                  I have an account
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-ink-3">
                <Icon name="shield" className="h-4 w-4 text-good" />
                Raw responses never leave your browser · CSV up to 10 MB
              </p>
            </div>

            {/* Illustrative product preview (example data) */}
            <div className="relative animate-fade-up [animation-delay:150ms]" aria-hidden="true">
              <div className={`${card} rotate-1 p-6 shadow-raised`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Q2 customer survey</p>
                  <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-ink-2">
                    Example
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Responses", "2,418"],
                    ["NPS", "+42"],
                    ["Avg rating", "4.3"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-surface-muted p-3 ring-1 ring-line-soft">
                      <p className="text-[11px] text-ink-3">{label}</p>
                      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <div className="relative flex h-2.5 gap-[2px] overflow-hidden rounded-full">
                    <div className="w-1/2 bg-[#f3d3d3]" />
                    <div className="w-[15%] bg-[#e4e3de]" />
                    <div className="w-[20%] bg-brand-200" />
                    <div className="w-[15%] bg-brand-300" />
                  </div>
                  <div
                    className="animate-marker-in relative -mt-[15px] h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-surface bg-ink shadow-md"
                    style={{ left: "71%" }}
                  />
                </div>
                <div className="mt-6 flex h-28 items-end gap-[2px] border-b border-line-strong">
                  {PREVIEW_BARS.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 animate-grow-y origin-bottom rounded-t-[4px] bg-series-1"
                      style={{ height: `${h}%`, animationDelay: `${300 + i * 60}ms` }}
                    />
                  ))}
                </div>
              </div>
              <div
                className={`${card} absolute -bottom-6 -left-4 flex max-w-xs animate-fade-up items-start gap-3 p-4 shadow-raised [animation-delay:700ms] sm:-left-8`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-good-bg text-good-text">
                  <Icon name="trendUp" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-ink">Strong promoter base</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-2">
                    61% of respondents scored 9–10.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="border-t border-line-soft bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className={`${eyebrow} text-center`}>How it works</p>
            <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight text-ink">
              Four steps from export to report
            </h2>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: `var(--color-series-${[1, 3, 7, 2][i]})` }}
                    >
                      <Icon name={step.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-ink-3">Step {i + 1}</span>
                  </div>
                  <p className="mt-4 text-base font-semibold text-ink">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Who it's for ─────────────────────────────────────────────── */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className={`${eyebrow} text-center`}>Built for</p>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {FOR_WHOM.map(({ role, pain, primary }) => (
                <li
                  key={role}
                  className={`${card} p-6 ${primary ? "ring-2 ring-brand-200" : ""}`}
                >
                  <p className="text-base font-semibold text-ink">{role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{pain}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-good-bg p-6 ring-1 ring-good/15 sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-good-text shadow-sm">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">Your client&apos;s data stays with you</p>
                <p className="mt-1 text-sm text-ink-2">
                  Files are processed in your browser. We only store summary numbers — never
                  individual responses, names, or free-text answers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────────── */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-16 text-center text-white">
            <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
            <h2 className="relative text-3xl font-semibold tracking-tight">Ready for your next client survey?</h2>
            <p className="relative mx-auto mt-3 max-w-md text-white/80">
              Create a free account and have your first report in a few minutes.
            </p>
            <Link
              href="/signup"
              className="relative mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-medium text-brand-800 shadow-md transition-all hover:bg-brand-50 active:scale-[0.98]"
            >
              Get started
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-soft px-4 py-6 text-center text-xs text-ink-3">
        Survey Insight · Processing happens in your browser · CSV up to 10 MB
      </footer>
    </div>
  );
}
