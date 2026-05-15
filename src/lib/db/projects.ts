import { supabase } from "@/lib/supabase/client";
import type { Project, ProjectStatus } from "@/types";

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

export async function createProject(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, status: "created" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toProject(data as Row);
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProject(data as Row) : null;
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select()
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as Row[]) ?? []).map(toProject);
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
