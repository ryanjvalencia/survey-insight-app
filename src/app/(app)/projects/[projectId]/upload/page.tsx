import PageHeader from "@/components/layout/PageHeader";
import UploadSection from "./UploadSection";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <PageHeader
        title="Upload data"
        description="Upload a CSV file containing your survey or customer feedback responses."
      />
      <UploadSection projectId={projectId} />
    </div>
  );
}
