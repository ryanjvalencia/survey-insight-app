import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Upload",
    body: "Drop a CSV file. We validate the format, encoding, and structure before touching anything.",
  },
  {
    n: "02",
    title: "Preview & map",
    body: "See the first 25 rows. Confirm column roles — ratings, NPS, open text, categories, dates.",
  },
  {
    n: "03",
    title: "Clean",
    body: "Nulls filled, whitespace trimmed, dates normalised, out-of-range values flagged — with a full summary.",
  },
  {
    n: "04",
    title: "Analyze",
    body: "Mean, median, NPS score, category frequencies, word counts, proxy sentiment. All computed locally.",
  },
  {
    n: "05",
    title: "Export",
    body: "Download a cleaned CSV and a PDF report with charts and plain-English insights.",
  },
];

const FOR_WHOM = [
  {
    role: "Consultants",
    pain: "Stop spending hours cleaning client survey exports before you can even start the analysis.",
  },
  {
    role: "UX researchers",
    pain: "Turn 500 open-text responses into themes and sentiment in minutes, not days.",
  },
  {
    role: "Marketing agencies",
    pain: "Generate NPS and CSAT summaries your clients can read — without a data team.",
  },
  {
    role: "Startup founders",
    pain: "Understand churn survey results without hiring an analyst or learning SQL.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <span className="font-semibold text-zinc-900 tracking-tight">
          Survey Insight
        </span>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Go to app
        </Link>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-5 leading-tight">
            Turn messy survey CSVs
            <br />
            into clean insights
          </h1>
          <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload a CSV, confirm your columns, and get charts, NPS scores,
            text themes, and a PDF report — all in your browser, no account
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-7 py-3 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Analyze a CSV →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-7 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              View my projects
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            CSV up to 10 MB · 50,000 rows · no sign-up needed
          </p>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="border-t border-zinc-100 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-10 text-center">
              How it works
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-5 gap-6">
              {STEPS.map(({ n, title, body }) => (
                <li key={n} className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-zinc-300">{n}</span>
                  <p className="font-semibold text-zinc-900">{title}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Who it's for ─────────────────────────────────────────────── */}
        <section className="border-t border-zinc-100 py-16 bg-zinc-50">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-10 text-center">
              Built for
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FOR_WHOM.map(({ role, pain }) => (
                <li
                  key={role}
                  className="rounded-xl border border-zinc-200 bg-white p-6"
                >
                  <p className="font-semibold text-zinc-900 mb-1">{role}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{pain}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────────── */}
        <section className="border-t border-zinc-100 py-20 text-center">
          <div className="max-w-xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Ready to dig in?
            </h2>
            <p className="text-zinc-500 mb-8 text-sm">
              Drop your CSV and have a report in under five minutes.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-7 py-3 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Analyze a CSV →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-6 px-6 text-center">
        <p className="text-xs text-zinc-400">
          Survey Insight · CSV up to 10 MB · All processing happens in your
          browser
        </p>
      </footer>
    </div>
  );
}
