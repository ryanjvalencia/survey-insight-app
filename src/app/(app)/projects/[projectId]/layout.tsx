import { notFound } from "next/navigation";
import StepNav from "@/components/layout/StepNav";
import { getProject } from "@/lib/db/projects";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // RLS only returns projects owned by the signed-in user, so another
  // user's project id (or a malformed one) renders a 404.
  if (!isUuid(projectId)) notFound();
  const project = await getProject(await createSupabaseServerClient(), projectId);
  if (!project) notFound();

  return (
    <div className="flex flex-col flex-1">
      <StepNav projectId={projectId} projectName={project.name} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
