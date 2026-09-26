-- Baseline schema: the original projects and datasets tables.
--
-- These tables were first created by hand in the Supabase dashboard, so no
-- migration created them. Fresh databases (Supabase preview branches, local
-- `supabase start`) need them before the later migrations can run.
--
-- Safe on the existing production database: every statement is
-- `if not exists`, so it is a no-op where the tables already exist.
-- Later migrations tighten these tables (user_id NOT NULL + default, RLS).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  original_filename text,
  row_count integer,
  column_count integer,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.datasets enable row level security;
