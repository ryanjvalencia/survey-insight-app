"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { label: "Upload", segment: "upload" },
  { label: "Preview", segment: "preview" },
  { label: "Mapping", segment: "mapping" },
  { label: "Analysis", segment: "analysis" },
  { label: "Report", segment: "report" },
];

interface StepNavProps {
  projectId: string;
}

export default function StepNav({ projectId }: StepNavProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-zinc-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-2">
        <ol className="flex items-center gap-0.5 text-xs">
          {STEPS.map((step, index) => {
            const href = `/projects/${projectId}/${step.segment}`;
            const isActive = pathname === href;
            return (
              <li key={step.segment} className="flex items-center gap-0.5">
                {index > 0 && (
                  <span className="text-zinc-200 select-none px-1">›</span>
                )}
                <Link
                  href={href}
                  className={[
                    "px-2.5 py-1 rounded text-xs transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white font-medium"
                      : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50",
                  ].join(" ")}
                >
                  {step.label}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
