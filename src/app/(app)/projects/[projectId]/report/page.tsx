import PageHeader from "@/components/layout/PageHeader";
import { getAnalysisResult } from "@/lib/db/analysis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ReportSection from "./ReportSection";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  // The project layout has already confirmed the caller owns this project.
  const analysis = await getAnalysisResult(await createSupabaseServerClient(), projectId);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PageHeader
        title="Report"
        description="Download your cleaned data and print a summary report."
      />
      <ReportSection projectId={projectId} analysis={analysis} />
    </div>
  );
}
