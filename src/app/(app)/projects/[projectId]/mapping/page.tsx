import PageHeader from "@/components/layout/PageHeader";
import PageTransition from "@/components/ui/PageTransition";
import MappingSection from "./MappingSection";

export default async function MappingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="Step 3 of 5"
          title="Check column types"
          description="We detected what each column contains. Correct anything that looks wrong — your choices are saved as you go."
        />
        <MappingSection projectId={projectId} />
      </div>
    </PageTransition>
  );
}
