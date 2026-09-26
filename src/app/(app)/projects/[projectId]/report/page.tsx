import PageHeader from "@/components/layout/PageHeader";
import PageTransition from "@/components/ui/PageTransition";
import { getAnalysisResult } from "@/lib/db/analysis";
import { getProject } from "@/lib/db/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ReportSection from "./ReportSection";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  // The project layout has already confirmed the caller owns this project.
  const db = await createSupabaseServerClient();
  const [analysis, project] = await Promise.all([
    getAnalysisResult(db, projectId),
    getProject(db, projectId),
  ]);

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="Step 5 of 5"
          title="Report"
          description="Download your cleaned data and print a summary report."
        />
        <ReportSection
            projectId={projectId}
            projectName={project?.name ?? "Survey report"}
            analysis={analysis}
          />
      </div>
    </PageTransition>
  );
}
