import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Projects"
          description="Each project is one survey or feedback dataset."
        />
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors shrink-0"
        >
          New project
        </Link>
      </div>

      {/* Empty state — replaced by a real list once persistence is added */}
      <div className="mt-4 rounded-lg border border-dashed border-zinc-200 py-20 text-center">
        <p className="text-sm text-zinc-500 mb-4">No projects yet.</p>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Create your first project
        </Link>
      </div>
    </div>
  );
}
