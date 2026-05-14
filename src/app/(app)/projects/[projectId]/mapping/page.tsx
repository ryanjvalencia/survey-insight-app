import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default async function MappingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PageHeader
        title="Map columns"
        description="Review the inferred column types and correct any that are wrong before analysis."
      />

      {/* Placeholder mapping table — column inference implemented in a later issue */}
      <div className="rounded-lg border border-zinc-100 overflow-hidden">
        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100">
          <p className="text-xs text-zinc-500">
            Column inference runs after a file has been parsed.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              {["Column", "Sample values", "Inferred type", "Your choice"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-xs font-medium text-zinc-500"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {["—", "—", "—"].map((_, i) => (
              <tr key={i} className="border-b border-zinc-50">
                <td className="px-4 py-2 text-zinc-300 text-xs">Column {i + 1}</td>
                <td className="px-4 py-2 text-zinc-300 text-xs">—</td>
                <td className="px-4 py-2 text-zinc-300 text-xs">unknown</td>
                <td className="px-4 py-2">
                  <select
                    disabled
                    className="rounded border border-zinc-100 text-xs px-2 py-1 text-zinc-300 bg-zinc-50 cursor-not-allowed"
                  >
                    <option>unknown</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between">
        <Link
          href={`/projects/${projectId}/preview`}
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          ← Back to preview
        </Link>
        <Link
          href={`/projects/${projectId}/analysis`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Next: Analyze →
        </Link>
      </div>
    </div>
  );
}
