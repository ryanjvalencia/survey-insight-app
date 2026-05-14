import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <PageHeader
        title="Analysis"
        description="Charts and insights generated from your cleaned dataset."
      />

      {/* Placeholder chart grid — populated by the analysis dashboard issue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {["Ratings distribution", "NPS score", "Category breakdown", "Response themes"].map(
          (label) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-100 p-6 min-h-40 flex flex-col justify-between"
            >
              <p className="text-xs font-medium text-zinc-500 mb-4">{label}</p>
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-300">
                  Chart renders after data is analyzed
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-8 flex justify-between">
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
