-- Mini-Sajt Factory core schema. Apply only after choosing the target Supabase project.
-- Every public table has RLS enabled. No public policies are added by default.
create extension if not exists pgcrypto;

create table if not exists public.factory_projects (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  name text not null,
  slug text unique not null,
  city text,
  type text,
  stage text not null default 'DISCOVERY',
  operating_status text not null default 'NEPOZNATO',
  has_own_site boolean,
  registry_status text not null default 'DISCOVERED',
  grade text,
  source_data jsonb not null default '{}'::jsonb,
  research_data jsonb not null default '{}'::jsonb,
  design_dna jsonb not null default '{}'::jsonb,
  qa jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  booking_opportunity text not null default 'NOT_NEEDED',
  booking_approval boolean not null default false,
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.factory_projects enable row level security;

create table if not exists public.factory_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.factory_projects(id) on delete cascade,
  storage_path text not null,
  role text,
  source text,
  source_url text,
  width integer,
  height integer,
  alt text,
  focal_x numeric,
  focal_y numeric,
  approved boolean not null default true,
  duplicate_of uuid references public.factory_media(id),
  created_at timestamptz not null default now()
);
alter table public.factory_media enable row level security;

create table if not exists public.factory_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.factory_projects(id) on delete cascade,
  version_no integer not null,
  reason text not null,
  design_dna jsonb not null default '{}'::jsonb,
  build_html text,
  screenshot_manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(project_id,version_no)
);
alter table public.factory_versions enable row level security;

create table if not exists public.factory_daily_batches (
  id uuid primary key default gen_random_uuid(),
  batch_date date not null unique,
  target integer not null default 5,
  discovered_count integer not null default 0,
  qualified_count integer not null default 0,
  completed_count integer not null default 0,
  status text not null default 'DISCOVERING',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.factory_daily_batches enable row level security;

create table if not exists public.factory_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.factory_projects(id) on delete cascade,
  approval_type text not null,
  status text not null default 'PENDING',
  approved_by uuid,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.factory_approvals enable row level security;

create table if not exists public.factory_sales_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.factory_projects(id) on delete cascade,
  event_type text not null,
  channel text,
  provider_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.factory_sales_events enable row level security;

-- Explicit Data API grants are intentionally omitted until the deployment auth model is chosen.
