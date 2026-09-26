import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Icon from "@/components/ui/Icon";
import PageTransition from "@/components/ui/PageTransition";
import SubmitButton from "@/components/ui/SubmitButton";
import { cardPadded, input } from "@/components/ui/styles";
import { createProject } from "@/lib/db/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_NAME_LENGTH = 120;

async function create(formData: FormData) {
  "use server";
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim().slice(0, MAX_NAME_LENGTH) : "";
  if (!name) return;
  const project = await createProject(await createSupabaseServerClient(), name);
  redirect(`/projects/${project.id}/upload`);
}

export default function NewProjectPage() {
  return (
    <PageTransition>
      <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-10">
        <PageHeader
          eyebrow="New project"
          title="Name your analysis"
          description="Use something your client will recognise — it appears on the report cover."
          backHref="/dashboard"
          backLabel="Back to projects"
        />

        <form action={create} className={`${cardPadded} animate-fade-up space-y-5`}>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              Project name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g. Acme Q2 customer survey"
              className={input}
            />
          </div>

          <SubmitButton pendingLabel="Creating…" className="w-full">
            Create project
            <Icon name="arrowRight" className="h-4 w-4" />
          </SubmitButton>

          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-3">
            <Icon name="shield" className="h-3.5 w-3.5" />
            Survey files stay on your device — only summaries are saved.
          </p>
        </form>
      </div>
    </PageTransition>
  );
}
