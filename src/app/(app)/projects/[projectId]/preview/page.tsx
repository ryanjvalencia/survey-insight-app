import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <PageHeader
        title="Preview data"
        description="Review the first 25 rows to confirm the file parsed correctly."
      />

      {/* Placeholder table — populated by the CSV parsing issue */}
      <div className="rounded-lg border border-zinc-100 overflow-hidden">
        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100">
          <p className="text-xs text-zinc-500">
            No data loaded yet — upload a file first.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {["Column A", "Column B", "Column C"].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-2 text-xs font-medium text-zinc-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-50">
                {["—", "—", "—"].map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-zinc-300 text-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
