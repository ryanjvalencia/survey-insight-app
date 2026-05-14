import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-white">
      <div className="max-w-xl w-full text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
          Survey Insight
        </h1>
        <p className="text-lg text-zinc-500 mb-8">
          Upload your survey or customer feedback CSV, clean it, and get charts,
          themes, and a downloadable report — in minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            View projects
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            {
              title: "Upload & validate",
              body: "Drop in a CSV. We check it, parse it, and preview the first 25 rows.",
            },
            {
              title: "Map & clean",
              body: "Confirm column types — ratings, NPS, text, categories — and let us tidy the data.",
            },
            {
              title: "Analyze & export",
              body: "Get charts, insights, and a one-click PDF report with cleaned CSV download.",
            },
          ].map(({ title, body }) => (
            <li key={title} className="rounded-lg border border-zinc-100 p-4">
              <p className="font-medium text-zinc-900 mb-1">{title}</p>
              <p className="text-sm text-zinc-500">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
