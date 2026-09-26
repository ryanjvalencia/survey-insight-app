export const dynamic = "force-dynamic";

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Icon from "@/components/ui/Icon";
import PageTransition, { NAV_FORWARD } from "@/components/ui/PageTransition";
import { btnPrimary, card } from "@/components/ui/styles";
import { listProjects } from "@/lib/db/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  created: "Created",
  uploaded: "Uploaded",
  previewed: "Previewed",
  mapped: "Mapped",
  analyzed: "Analyzed",
  completed: "Completed",
};

const STATUS_STYLE: Record<string, { pill: string; progress: number }> = {
  created: { pill: "bg-surface-sunken text-ink-2", progress: 10 },
  uploaded: { pill: "bg-brand-50 text-brand-800", progress: 35 },
  previewed: { pill: "bg-brand-50 text-brand-800", progress: 45 },
  mapped: { pill: "bg-brand-50 text-brand-800", progress: 65 },
  analyzed: { pill: "bg-good-bg text-good-text", progress: 90 },
  completed: { pill: "bg-good-bg text-good-text", progress: 100 },
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
  let loadFailed = false;
  try {
    projects = await listProjects(await createSupabaseServerClient());
  } catch {
    loadFailed = true;
  }

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="Workspace"
          title="Projects"
          description="Each project is one survey or feedback dataset. Pick up where you left off, or start a new analysis."
          actions={
            projects.length > 0 ? (
              <Link href="/projects/new" transitionTypes={NAV_FORWARD} className={btnPrimary}>
                <Icon name="plus" className="h-4 w-4" />
                New project
              </Link>
            ) : undefined
          }
        />

        {loadFailed ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl bg-critical-bg px-4 py-3 text-sm text-critical-text ring-1 ring-critical/20"
          >
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            Couldn&apos;t load your projects. Refresh the page to try again.
          </div>
        ) : projects.length === 0 ? (
          <div className={`${card} animate-fade-up px-6 py-16 text-center`}>
            <div className="mx-auto mb-5 flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
              <Icon name="chart" className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-ink">Start your first analysis</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
              Upload a survey export and get cleaned data, charts, NPS, and a client-ready report in a few minutes.
            </p>
            <Link href="/projects/new" transitionTypes={NAV_FORWARD} className={`${btnPrimary} mt-6`}>
              <Icon name="plus" className="h-4 w-4" />
              Create a project
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => {
              const status = STATUS_STYLE[project.status] ?? STATUS_STYLE.created;
              return (
                <li key={project.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <Link
                    href={resumeHref(project)}
                    transitionTypes={NAV_FORWARD}
                    className={`${card} group flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
                        <Icon name="folder" className="h-5 w-5" />
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.pill}`}>
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-base font-semibold text-ink">{project.name}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">
                        Open
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageTransition>
  );
}
