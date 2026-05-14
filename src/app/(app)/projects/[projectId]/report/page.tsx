import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <PageHeader
        title="Report"
        description="Download your cleaned data and a summary report."
      />

      <div className="space-y-3">
        {/* Placeholder export buttons — wired up in the export issues */}
        <div className="rounded-lg border border-zinc-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">Cleaned CSV</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Your dataset with nulls, duplicates, and formatting fixed
            </p>
          </div>
          <button
            disabled
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-400 cursor-not-allowed"
          >
            Download
          </button>
        </div>

        <div className="rounded-lg border border-zinc-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900">PDF report</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Charts, insights, and a summary of your analysis
            </p>
          </div>
          <button
            disabled
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-400 cursor-not-allowed"
          >
            Download
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          href={`/projects/${projectId}/analysis`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Back to analysis
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Back to projects
        </Link>
      </div>
    </div>
  );
}
