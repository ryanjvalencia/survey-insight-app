import PageHeader from "@/components/layout/PageHeader";
import MappingSection from "./MappingSection";

export default async function MappingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <PageHeader
        title="Map columns"
        description="Review the inferred column types and correct any that are wrong before analysis."
      />
      <MappingSection projectId={projectId} />
    </div>
  );
}
