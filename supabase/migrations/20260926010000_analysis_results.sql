-- Persisted analysis results: one current row per project.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Requires 20260926000000_user_scoped_rls.sql. Safe to re-run.
--
-- `result` holds aggregates only (counts, statistics, chart data, insight
-- text). Raw rows and full open-text responses are never stored; the app
-- strips per-word vocabularies and caps category lists before saving.

begin;

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Defense in depth alongside the app's 512 KB limit.
  constraint analysis_results_result_size check (pg_column_size(result) <= 1048576)
);

alter table public.analysis_results enable row level security;

drop policy if exists "Owners can read their analysis results" on public.analysis_results;
drop policy if exists "Owners can add analysis results" on public.analysis_results;
drop policy if exists "Owners can update their analysis results" on public.analysis_results;
drop policy if exists "Owners can delete their analysis results" on public.analysis_results;

create policy "Owners can read their analysis results"
  on public.analysis_results for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

create policy "Owners can add analysis results"
  on public.analysis_results for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

create policy "Owners can update their analysis results"
  on public.analysis_results for update to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

create policy "Owners can delete their analysis results"
  on public.analysis_results for delete to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

commit;
