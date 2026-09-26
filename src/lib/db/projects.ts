import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectStatus } from "@/types";

// Every function takes the caller's Supabase client so queries run as the
// signed-in user. RLS scopes all rows to auth.uid(); user_id is filled in by
// the column default, never by client input.

type Row = {
  id: string;
  name: string;
  status: string;
  created_at: string;
};

function toProject(row: Row): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ProjectStatus,
    createdAt: row.created_at,
  };
}

export async function createProject(
  db: SupabaseClient,
  name: string,
): Promise<Project> {
  const { data, error } = await db
    .from("projects")
    .insert({ name, status: "created" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProject(data as Row);
}

export async function getProject(
  db: SupabaseClient,
  id: string,
): Promise<Project | null> {
  const { data, error } = await db
    .from("projects")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProject(data as Row) : null;
}

export async function listProjects(db: SupabaseClient): Promise<Project[]> {
  const { data, error } = await db
    .from("projects")
    .select()
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as Row[]) ?? []).map(toProject);
}

export async function updateProjectStatus(
  db: SupabaseClient,
  id: string,
  status: ProjectStatus,
): Promise<void> {
  const { error } = await db.from("projects").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
