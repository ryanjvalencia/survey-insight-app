import PageHeader from "@/components/layout/PageHeader";
import ReportSection from "./ReportSection";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <PageHeader
        title="Report"
        description="Download your cleaned data and print a summary report."
      />
      <ReportSection projectId={projectId} />
    </div>
  );
}
