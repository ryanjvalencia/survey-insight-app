import PageHeader from "@/components/layout/PageHeader";
import { getAnalysisResult } from "@/lib/db/analysis";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AnalysisDashboard from "./AnalysisDashboard";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  // The project layout has already confirmed the caller owns this project.
  const analysis = await getAnalysisResult(await createSupabaseServerClient(), projectId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <PageHeader
        title="Analysis"
        description="Cleaning summary, insights, and charts from your dataset."
      />
      <AnalysisDashboard projectId={projectId} analysis={analysis} />
    </div>
  );
}
