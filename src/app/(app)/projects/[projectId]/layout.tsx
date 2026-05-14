import StepNav from "@/components/layout/StepNav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col flex-1">
      <StepNav projectId={projectId} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
