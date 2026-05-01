-- Supabase lint cleanup for imaposla.me.
-- Run this as a NEW query after the existing schema/policy scripts.
-- It consolidates overlapping RLS policies, optimizes auth.uid() calls, and moves SECURITY DEFINER helpers out of the exposed public API schema.
-- Safe to rerun.

create schema if not exists private;

-- Remove policies that reference public.is_admin() before replacing the helper.
alter table public.profiles enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.ats_comments enable row level security;
alter table public.application_events enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.banners enable row level security;

drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
drop policy if exists "company reads applicant profiles" on public.profiles;

drop policy if exists "candidate profile own all" on public.candidate_profiles;
drop policy if exists "candidate profile admin all" on public.candidate_profiles;

drop policy if exists "public approved companies" on public.companies;
drop policy if exists "company owner insert" on public.companies;
drop policy if exists "company owner update" on public.companies;
drop policy if exists "admin all companies" on public.companies;

drop policy if exists "public active jobs" on public.jobs;
drop policy if exists "company owns jobs" on public.jobs;
drop policy if exists "company select own jobs" on public.jobs;
drop policy if exists "company insert own jobs" on public.jobs;
drop policy if exists "company update own jobs" on public.jobs;
drop policy if exists "admin all jobs" on public.jobs;

drop policy if exists "candidate owns applications" on public.job_applications;
drop policy if exists "candidate inserts own applications" on public.job_applications;
drop policy if exists "company sees applications for own jobs" on public.job_applications;
drop policy if exists "company updates applications for own jobs" on public.job_applications;
drop policy if exists "admin all applications" on public.job_applications;

drop policy if exists "admin all comments" on public.ats_comments;
drop policy if exists "admin all events" on public.application_events;

drop policy if exists "company reads own orders" on public.orders;
drop policy if exists "company creates own orders" on public.orders;
drop policy if exists "admin all orders" on public.orders;

drop policy if exists "company reads own subscriptions" on public.subscriptions;
drop policy if exists "admin all subscriptions" on public.subscriptions;
drop policy if exists "subscriptions read access" on public.subscriptions;
drop policy if exists "subscriptions insert admin" on public.subscriptions;
drop policy if exists "subscriptions update admin" on public.subscriptions;
drop policy if exists "subscriptions delete admin" on public.subscriptions;

drop policy if exists "public approved banners" on public.banners;
drop policy if exists "company reads own banners" on public.banners;
drop policy if exists "company creates own banners" on public.banners;
drop policy if exists "admin all banners" on public.banners;

-- Private helpers: not exposed as /rest/v1/rpc/public_function.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

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
  values (
    new.id,
    final_role,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
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

grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- Profiles: one policy per action instead of overlapping own/admin policies.
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

-- Candidate profiles
create policy "candidate profile access" on public.candidate_profiles
for all
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check (user_id = (select auth.uid()) or (select private.is_admin()));

-- Lookup tables stay public read.
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read cities" on public.cities;
create policy "public read categories" on public.categories for select using (true);
create policy "public read cities" on public.cities for select using (true);

-- Companies
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

-- Jobs
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

-- Applications
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

-- ATS comments and events
create policy "comments admin access" on public.ats_comments
for all
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "events admin access" on public.application_events
for all
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Orders and subscriptions
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
for update
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "subscriptions read access" on public.subscriptions
for select
using (
  (select private.is_admin())
  or exists (select 1 from public.companies c where c.id = subscriptions.company_id and c.owner_id = (select auth.uid()))
);

create policy "subscriptions insert admin" on public.subscriptions
for insert
with check ((select private.is_admin()));

create policy "subscriptions update admin" on public.subscriptions
for update
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "subscriptions delete admin" on public.subscriptions
for delete
using ((select private.is_admin()));

-- Banners
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
for update
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Storage policies optimized for auth.uid().
drop policy if exists "public read avatars" on storage.objects;
drop policy if exists "authenticated upload public assets" on storage.objects;
drop policy if exists "candidate cv owner read" on storage.objects;
drop policy if exists "candidate cv owner upload" on storage.objects;

create policy "public read public assets" on storage.objects
for select
using (bucket_id in ('avatars', 'company-logos', 'banners'));

create policy "authenticated upload public assets" on storage.objects
for insert to authenticated
with check (bucket_id in ('avatars', 'company-logos', 'banners'));

create policy "candidate cv owner read" on storage.objects
for select to authenticated
using (bucket_id = 'candidate-cv' and owner = (select auth.uid()));

create policy "candidate cv owner upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'candidate-cv' and owner = (select auth.uid()));

-- Verification helper
select schemaname, tablename, policyname
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
