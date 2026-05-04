-- Complete Supabase schema for imaposla.me.
-- For a new project, run this once from Supabase SQL Editor.
-- If the project already has the older split scripts, run supabase-production-hardening.sql too or ask Codex for a single migration.

create schema if not exists private;

create type public.user_role as enum ('candidate', 'company', 'admin');
create type public.job_status as enum ('draft', 'pending_review', 'active', 'paused', 'rejected', 'expired');
create type public.application_stage as enum ('applied', 'review', 'interview', 'shortlist', 'offer', 'rejected', 'hired');
create type public.order_status as enum ('pending', 'paid', 'rejected', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'candidate',
  full_name text,
  email text,
  phone text,
  city text,
  avatar_path text,
  cv_data jsonb not null default '{}'::jsonb,
  cv_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_cv_data_is_object check (jsonb_typeof(cv_data) = 'object')
);

create table public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  bio text,
  skills text[] not null default '{}',
  public_profile boolean not null default false,
  contact_visible boolean not null default false
);

create table public.companies (
  id bigserial primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  city text,
  industry text,
  description text,
  logo_path text,
  website text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.categories (
  id bigserial primary key,
  name text not null,
  slug text not null unique
);

create table public.cities (
  id bigserial primary key,
  name text not null,
  slug text not null unique
);

create table public.jobs (
  id bigserial primary key,
  company_id bigint not null references public.companies(id) on delete cascade,
  category_id bigint references public.categories(id),
  city_id bigint references public.cities(id),
  title text not null,
  slug text not null unique,
  description text not null,
  requirements text,
  contract_type text,
  salary_text text,
  deadline date,
  status public.job_status not null default 'pending_review',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.job_applications (
  id bigserial primary key,
  job_id bigint not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  stage public.application_stage not null default 'applied',
  cover_letter text,
  cv_path text,
  reference_code text not null unique,
  created_at timestamptz not null default now(),
  unique(job_id, candidate_id)
);

create table public.ats_comments (
  id bigserial primary key,
  application_id bigint not null references public.job_applications(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.application_events (
  id bigserial primary key,
  application_id bigint not null references public.job_applications(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  from_stage public.application_stage,
  to_stage public.application_stage,
  note text,
  created_at timestamptz not null default now()
);

create table public.application_stage_events (
  id bigserial primary key,
  application_id bigint not null references public.job_applications(id) on delete cascade,
  old_stage public.application_stage,
  new_stage public.application_stage not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.plans (
  id bigserial primary key,
  name text not null unique,
  price_eur numeric(10,2) not null,
  active_jobs integer not null,
  unlock_credits integer not null,
  features text[] not null default '{}'
);

create table public.orders (
  id bigserial primary key,
  company_id bigint not null references public.companies(id) on delete cascade,
  plan_id bigint references public.plans(id),
  status public.order_status not null default 'pending',
  amount_eur numeric(10,2) not null,
  payment_reference text not null unique,
  activation_code text unique,
  confirmed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table public.subscriptions (
  id bigserial primary key,
  company_id bigint not null references public.companies(id) on delete cascade,
  plan_id bigint not null references public.plans(id),
  active_from date not null default current_date,
  active_until date,
  unlock_credits_remaining integer not null default 0
);

create table public.banners (
  id bigserial primary key,
  company_id bigint references public.companies(id) on delete cascade,
  title text not null,
  image_path text,
  target_url text,
  placement text not null default 'home',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payment_proofs (
  id bigserial primary key,
  company_id bigint not null references public.companies(id) on delete cascade,
  order_id bigint not null references public.orders(id) on delete cascade,
  proof_path text not null,
  file_name text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index payment_proofs_company_idx on public.payment_proofs(company_id);
create index payment_proofs_order_idx on public.payment_proofs(order_id);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role public.user_role;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'candidate');
  final_role := case when requested_role = 'company' then 'company'::public.user_role else 'candidate'::public.user_role end;

  insert into public.profiles (id, role, email, full_name)
  values (new.id, final_role, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  insert into public.candidate_profiles (user_id)
  select new.id
  where final_role = 'candidate'
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Ulogu korisnika mijenja samo ovlašćeni nalog.';
  end if;
  new.updated_at := now();
  if new.cv_data is distinct from old.cv_data then
    new.cv_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger prevent_profile_role_self_change
before update on public.profiles
for each row execute function public.prevent_profile_role_self_change();

create or replace function public.prevent_company_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approved := false;
    return new;
  end if;

  if new.approved is distinct from old.approved then
    raise exception 'Odobravanje firme može uraditi samo ovlašćeni nalog.';
  end if;

  return new;
end;
$$;

create trigger prevent_company_self_approval
before insert or update on public.companies
for each row execute function public.prevent_company_self_approval();

create or replace function public.prevent_company_job_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending_review';
    new.featured := false;
    return new;
  end if;

  if new.status is distinct from old.status or new.featured is distinct from old.featured then
    raise exception 'Status i isticanje oglasa mijenja samo ovlašćeni nalog.';
  end if;

  return new;
end;
$$;

create trigger prevent_company_job_moderation
before insert or update on public.jobs
for each row execute function public.prevent_company_job_moderation();

create or replace function public.log_application_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    insert into public.application_stage_events(application_id, old_stage, new_stage, changed_by)
    values (new.id, old.stage, new.stage, auth.uid());

    insert into public.application_events(application_id, actor_id, from_stage, to_stage, note)
    values (new.id, auth.uid(), old.stage, new.stage, 'Promjena faze prijave');
  end if;
  return new;
end;
$$;

create trigger log_application_stage_change
after update of stage on public.job_applications
for each row execute function public.log_application_stage_change();

alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.categories enable row level security;
alter table public.cities enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.ats_comments enable row level security;
alter table public.application_events enable row level security;
alter table public.application_stage_events enable row level security;
alter table public.plans enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.banners enable row level security;
alter table public.payment_proofs enable row level security;

create policy "profiles read access" on public.profiles
for select
using (
  id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = profiles.id and c.owner_id = (select auth.uid())
  )
);

create policy "profiles update access" on public.profiles
for update
using (id = (select auth.uid()) or (select private.is_admin()))
with check (id = (select auth.uid()) or (select private.is_admin()));

create policy "candidate profile access" on public.candidate_profiles
for all
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check (user_id = (select auth.uid()) or (select private.is_admin()));

create policy "public read categories" on public.categories for select using (true);
create policy "public read cities" on public.cities for select using (true);
create policy "public read plans" on public.plans for select using (true);

create policy "companies read access" on public.companies
for select
using (approved = true or owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "companies insert access" on public.companies
for insert
with check (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "companies update access" on public.companies
for update
using (owner_id = (select auth.uid()) or (select private.is_admin()))
with check (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "jobs read access" on public.jobs
for select
using (
  status = 'active'
  or (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = (select auth.uid()))
);

create policy "jobs insert access" on public.jobs
for insert
with check (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = (select auth.uid()))
);

create policy "jobs update access" on public.jobs
for update
using (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = (select auth.uid()))
)
with check (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = (select auth.uid()))
);

create policy "applications read access" on public.job_applications
for select
using (
  candidate_id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_applications.job_id and c.owner_id = (select auth.uid())
  )
);

create policy "applications insert access" on public.job_applications
for insert
with check (candidate_id = (select auth.uid()) or (select private.is_admin()));

create policy "applications update access" on public.job_applications
for update
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_applications.job_id and c.owner_id = (select auth.uid())
  )
)
with check (
  (select private.is_admin())
  or exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_applications.job_id and c.owner_id = (select auth.uid())
  )
);

create policy "comments admin access" on public.ats_comments
for all using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "events read access" on public.application_events
for select
using (
  (select private.is_admin())
  or exists (select 1 from public.job_applications a where a.id = application_id and a.candidate_id = (select auth.uid()))
  or exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.id = application_id and c.owner_id = (select auth.uid())
  )
);

create policy "events admin insert" on public.application_events
for insert with check ((select private.is_admin()) or actor_id = (select auth.uid()));

create policy "stage events read access" on public.application_stage_events
for select
using (
  (select private.is_admin())
  or exists (select 1 from public.job_applications a where a.id = application_id and a.candidate_id = (select auth.uid()))
  or exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.id = application_id and c.owner_id = (select auth.uid())
  )
);

create policy "orders read access" on public.orders
for select
using (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = orders.company_id and c.owner_id = (select auth.uid()))
);

create policy "orders insert access" on public.orders
for insert
with check (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = orders.company_id and c.owner_id = (select auth.uid()))
);

create policy "orders update admin" on public.orders
for update using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "subscriptions read access" on public.subscriptions
for select
using (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = subscriptions.company_id and c.owner_id = (select auth.uid()))
);

create policy "subscriptions admin insert" on public.subscriptions
for insert with check ((select private.is_admin()));
create policy "subscriptions admin update" on public.subscriptions
for update using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "subscriptions admin delete" on public.subscriptions
for delete using ((select private.is_admin()));

create policy "banners read access" on public.banners
for select
using (
  approved = true
  or (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = banners.company_id and c.owner_id = (select auth.uid()))
);

create policy "banners insert access" on public.banners
for insert
with check (
  approved = false
  and exists (select 1 from public.companies c where c.id = banners.company_id and c.owner_id = (select auth.uid()))
);

create policy "banners update admin" on public.banners
for update using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "payment proofs insert access" on public.payment_proofs
for insert
with check (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))
  and exists (select 1 from public.orders o where o.id = order_id and o.company_id = payment_proofs.company_id)
);

create policy "payment proofs read access" on public.payment_proofs
for select
using (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = (select auth.uid()))
);

create policy "payment proofs update admin" on public.payment_proofs
for update using ((select private.is_admin())) with check ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, null, null),
  ('company-logos', 'company-logos', true, null, null),
  ('banners', 'banners', true, null, null),
  ('payment-proofs', 'payment-proofs', false, 6291456, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public read public assets" on storage.objects
for select using (bucket_id in ('avatars', 'company-logos', 'banners'));

create policy "authenticated upload public assets" on storage.objects
for insert to authenticated
with check (bucket_id in ('avatars', 'company-logos', 'banners'));

create policy "company uploads own payment proofs" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "company reads own payment proof files" on storage.objects
for select to authenticated
using (bucket_id = 'payment-proofs' and owner = (select auth.uid()));

create policy "admin reads payment proof files" on storage.objects
for select to authenticated
using (bucket_id = 'payment-proofs' and (select private.is_admin()));

insert into public.categories (name, slug) values
  ('Ugostiteljstvo', 'ugostiteljstvo'),
  ('Turizam', 'turizam'),
  ('Prodaja', 'prodaja'),
  ('Administracija', 'administracija'),
  ('IT i razvoj', 'it-i-razvoj'),
  ('Građevina', 'gradjevina'),
  ('Zdravstvo', 'zdravstvo'),
  ('Obrazovanje', 'obrazovanje')
on conflict do nothing;

insert into public.cities (name, slug) values
  ('Podgorica', 'podgorica'),
  ('Budva', 'budva'),
  ('Kotor', 'kotor'),
  ('Nikšić', 'niksic'),
  ('Bar', 'bar'),
  ('Tivat', 'tivat'),
  ('Herceg Novi', 'herceg-novi'),
  ('Cetinje', 'cetinje'),
  ('Bijelo Polje', 'bijelo-polje'),
  ('Pljevlja', 'pljevlja')
on conflict do nothing;

insert into public.plans (name, price_eur, active_jobs, unlock_credits, features) values
  ('Starter', 25, 3, 10, array['3 aktivna oglasa', '10 kredita', 'Osnovna podrška']),
  ('Growth', 80, 10, 50, array['10 aktivnih oglasa', '50 kredita', 'Selekcija prijava', 'Prioritetna podrška']),
  ('Pro', 200, 999, 200, array['Neograničeni oglasi', '200 kredita', 'Baneri', 'Napredna statistika'])
on conflict do nothing;
