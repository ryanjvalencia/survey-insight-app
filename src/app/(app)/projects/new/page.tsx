import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { createProject } from "@/lib/db/projects";

async function create(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return;
  const project = await createProject(name);
  redirect(`/projects/${project.id}/upload`);
}

export default function NewProjectPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <PageHeader
        title="New project"
        description="Give your project a name, then upload your CSV file."
        backHref="/dashboard"
        backLabel="Back to projects"
      />

      <form action={create} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Project name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Q2 Customer Survey"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
        >
          Create project →
        </button>
      </form>
    </div>
  );
}
