import PageHeader from "@/components/layout/PageHeader";
import AnalysisDashboard from "./AnalysisDashboard";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <PageHeader
        title="Analysis"
        description="Cleaning summary, insights, and charts from your dataset."
      />
      <AnalysisDashboard projectId={projectId} />
    </div>
  );
}
