import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import PreviewTable from "./PreviewTable";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <PageHeader
        title="Preview data"
        description="Review the first 25 rows to confirm the file parsed correctly."
      />

      <PreviewTable projectId={projectId} />

      <div className="mt-6 flex justify-between">
        <Link
          href={`/projects/${projectId}/upload`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Re-upload
        </Link>
        <Link
          href={`/projects/${projectId}/mapping`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Next: Map columns →
        </Link>
      </div>
    </div>
  );
}
