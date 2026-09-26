import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import PageTransition, { NAV_BACK, NAV_FORWARD } from "@/components/ui/PageTransition";
import Icon from "@/components/ui/Icon";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import PreviewTable from "./PreviewTable";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="Step 2 of 5"
          title="Preview data"
          description="Review the first 25 rows to confirm the file parsed correctly."
        />

        <PreviewTable projectId={projectId} />

        <div className="mt-8 flex justify-between">
          <Link
            href={`/projects/${projectId}/upload`}
            transitionTypes={NAV_BACK}
            className={btnSecondary}
          >
            <Icon name="arrowLeft" className="h-4 w-4" />
            Re-upload
          </Link>
          <Link
            href={`/projects/${projectId}/mapping`}
            transitionTypes={NAV_FORWARD}
            className={btnPrimary}
          >
            Next: Check columns
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
