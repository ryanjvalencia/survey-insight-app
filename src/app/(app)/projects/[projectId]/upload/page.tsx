import PageHeader from "@/components/layout/PageHeader";
import PageTransition from "@/components/ui/PageTransition";
import UploadSection from "./UploadSection";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="Step 1 of 5"
          title="Upload data"
          description="Upload a CSV file containing your survey or customer feedback responses."
        />
        <UploadSection projectId={projectId} />
      </div>
    </PageTransition>
  );
}
