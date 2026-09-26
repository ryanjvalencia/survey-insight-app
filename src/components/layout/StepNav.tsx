"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { NAV_BACK, NAV_FORWARD } from "@/components/ui/PageTransition";

const STEPS = [
  { label: "Upload", segment: "upload" },
  { label: "Preview", segment: "preview" },
  { label: "Columns", segment: "mapping" },
  { label: "Analysis", segment: "analysis" },
  { label: "Report", segment: "report" },
];

interface StepNavProps {
  projectId: string;
  projectName: string;
}

export default function StepNav({ projectId, projectName }: StepNavProps) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => pathname === `/projects/${projectId}/${s.segment}`),
  );
  const progress = (activeIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="border-b border-line-soft bg-surface/60 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-5">
        <p className="mb-4 truncate text-sm font-medium text-ink-2">
          <Link
            href="/dashboard"
            transitionTypes={NAV_BACK}
            className="text-ink-3 hover:text-brand-700 transition-colors"
          >
            Projects
          </Link>
          <span aria-hidden="true" className="mx-2 text-line-strong">/</span>
          <span className="text-ink">{projectName}</span>
        </p>

        <nav aria-label="Workflow steps" className="relative">
          {/* Track + animated progress fill behind the step circles */}
          <div aria-hidden="true" className="absolute left-4 right-4 top-4 h-0.5 rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <ol className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const href = `/projects/${projectId}/${step.segment}`;
              const state =
                index < activeIndex ? "done" : index === activeIndex ? "active" : "todo";
              return (
                <li key={step.segment} className="flex flex-col items-center">
                  <Link
                    href={href}
                    aria-current={state === "active" ? "step" : undefined}
                    transitionTypes={index > activeIndex ? NAV_FORWARD : NAV_BACK}
                    className="group flex flex-col items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4 focus-visible:ring-offset-page"
                  >
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-page transition-all duration-300",
                        state === "active"
                          ? "bg-brand-600 text-white shadow-md scale-110"
                          : state === "done"
                            ? "bg-brand-100 text-brand-800 group-hover:bg-brand-200"
                            : "bg-surface text-ink-3 ring-offset-0 border border-line group-hover:border-brand-300 group-hover:text-brand-700",
                      ].join(" ")}
                    >
                      {state === "done" ? <Icon name="check" className="h-4 w-4" /> : index + 1}
                    </span>
                    <span
                      className={[
                        "text-xs transition-colors",
                        state === "active"
                          ? "font-semibold text-ink"
                          : "text-ink-3 group-hover:text-brand-700",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
