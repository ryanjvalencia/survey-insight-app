export const dynamic = "force-dynamic";

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { listProjects } from "@/lib/db/projects";
import type { Project } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  uploaded: "Uploaded",
  previewed: "Previewed",
  mapped: "Mapped",
  analyzed: "Analyzed",
  completed: "Completed",
};

function resumeHref(project: Project): string {
  switch (project.status) {
    case "uploaded":
    case "previewed":
      return `/projects/${project.id}/preview`;
    case "mapped":
    case "analyzed":
    case "completed":
      return `/projects/${project.id}/analysis`;
    default:
      return `/projects/${project.id}/upload`;
  }
}

export default async function DashboardPage() {
  let projects: Project[] = [];
  try {
    projects = await listProjects();
  } catch {
    // Supabase unavailable — show empty state
  }

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

      {projects.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 py-20 text-center">
          <p className="text-sm text-zinc-500 mb-4">No projects yet.</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={resumeHref(project)}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {project.name}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
