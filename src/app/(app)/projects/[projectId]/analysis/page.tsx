import PageHeader from "@/components/layout/PageHeader";
import PageTransition from "@/components/ui/PageTransition";
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
    <PageTransition>
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="Step 4 of 5"
          title="Analysis"
          description="Cleaning summary, insights, and charts from your dataset."
        />
        <AnalysisDashboard projectId={projectId} analysis={analysis} />
      </div>
    </PageTransition>
  );
}
