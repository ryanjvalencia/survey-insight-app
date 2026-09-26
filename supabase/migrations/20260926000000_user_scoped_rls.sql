-- Per-user data ownership for projects and datasets.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: every step is idempotent.
--
-- WARNING: step 1 permanently deletes every project (and its datasets) that
-- has no owner. Before auth existed, all projects were ownerless.

begin;

-- 1. Remove pre-auth test data that no user can own.
delete from public.datasets
where project_id in (select id from public.projects where user_id is null);

delete from public.projects where user_id is null;

-- 2. Every project belongs to the user who created it. The default means the
--    app never sends user_id — the database takes it from the session.
alter table public.projects alter column user_id set default auth.uid();
alter table public.projects alter column user_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.conrelid = 'public.projects'::regclass
      and c.contype = 'f'
      and a.attname = 'user_id'
  ) then
    alter table public.projects
      add constraint projects_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists datasets_project_id_idx on public.datasets (project_id);

-- 3. Replace the permissive pre-auth policies.
alter table public.projects enable row level security;
alter table public.datasets enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public' and tablename in ('projects', 'datasets')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- projects: owners only. Signed-out (anon) requests match no policy.
create policy "Owners can read their projects"
  on public.projects for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own projects"
  on public.projects for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Owners can update their projects"
  on public.projects for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Owners can delete their projects"
  on public.projects for delete to authenticated
  using (user_id = (select auth.uid()));

-- datasets: allowed when the parent project belongs to the caller.
create policy "Owners can read their datasets"
  on public.datasets for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

create policy "Owners can add datasets to their projects"
  on public.datasets for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

create policy "Owners can update their datasets"
  on public.datasets for update to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

create policy "Owners can delete their datasets"
  on public.datasets for delete to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

commit;
