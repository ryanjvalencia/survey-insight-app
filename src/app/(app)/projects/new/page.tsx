import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default function NewProjectPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <PageHeader
        title="New project"
        description="Give your project a name, then upload your CSV file."
        backHref="/dashboard"
        backLabel="Back to projects"
      />

      {/*
        Placeholder form — project creation with persistence will be
        implemented in the Supabase issue. For now, navigate directly
        to the upload step with a demo project ID.
      */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Project name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Q2 Customer Survey"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <p className="text-xs text-zinc-400">
          Project saving requires a database — coming in a later step. Use the
          button below to explore the upload workflow with a demo project.
        </p>

        <Link
          href="/projects/demo/upload"
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Continue to upload →
        </Link>
      </div>
    </div>
  );
}
