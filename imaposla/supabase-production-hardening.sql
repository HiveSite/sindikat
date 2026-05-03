-- Production hardening for imaposla.me
-- Run after the base schema and admin hardening script.

-- 1) Prevent duplicate applications for the same candidate and job.
create unique index if not exists job_applications_one_per_candidate_job
on public.job_applications (job_id, candidate_id);

-- 2) Keep a simple audit trail for application stage changes.
create table if not exists public.application_stage_events (
  id bigserial primary key,
  application_id bigint not null references public.job_applications(id) on delete cascade,
  old_stage public.application_stage,
  new_stage public.application_stage not null,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.application_stage_events enable row level security;

drop policy if exists "candidate reads own stage events" on public.application_stage_events;
create policy "candidate reads own stage events"
on public.application_stage_events
for select
using (
  exists (
    select 1
    from public.job_applications a
    where a.id = application_id
      and a.candidate_id = auth.uid()
  )
);

drop policy if exists "company reads own stage events" on public.application_stage_events;
create policy "company reads own stage events"
on public.application_stage_events
for select
using (
  exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.id = application_id
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "admin reads stage events" on public.application_stage_events;
create policy "admin reads stage events"
on public.application_stage_events
for select
using (private.is_admin());

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
  end if;
  return new;
end;
$$;

drop trigger if exists log_application_stage_change on public.job_applications;
create trigger log_application_stage_change
after update of stage on public.job_applications
for each row
execute function public.log_application_stage_change();

-- 3) Public visibility should be enforced in the database, not only in JavaScript.
drop policy if exists "public reads active jobs" on public.jobs;
create policy "public reads active jobs"
on public.jobs
for select
using (status = 'active');

drop policy if exists "public reads approved companies" on public.companies;
create policy "public reads approved companies"
on public.companies
for select
using (approved = true);

-- 4) Company can read only applications for its own jobs.
drop policy if exists "company reads own applications" on public.job_applications;
create policy "company reads own applications"
on public.job_applications
for select
using (
  exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_id
      and c.owner_id = auth.uid()
  )
);

-- 5) Candidate can create and read only own applications.
drop policy if exists "candidate creates own applications" on public.job_applications;
create policy "candidate creates own applications"
on public.job_applications
for insert
with check (candidate_id = auth.uid());

drop policy if exists "candidate reads own applications" on public.job_applications;
create policy "candidate reads own applications"
on public.job_applications
for select
using (candidate_id = auth.uid());

-- 6) Company can update only stage for applications on its own jobs.
drop policy if exists "company updates own application stages" on public.job_applications;
create policy "company updates own application stages"
on public.job_applications
for update
using (
  exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_id
      and c.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = job_id
      and c.owner_id = auth.uid()
  )
);

-- 7) Candidate biographies are stored as text/json profile data, not uploaded files.
alter table public.profiles
  add column if not exists cv_data jsonb not null default '{}'::jsonb,
  add column if not exists cv_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_cv_data_is_object'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_cv_data_is_object
      check (jsonb_typeof(cv_data) = 'object');
  end if;
end $$;

create or replace function public.touch_profile_cv_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.cv_data is distinct from old.cv_data then
    new.cv_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists touch_profile_cv_updated_at on public.profiles;
create trigger touch_profile_cv_updated_at
before update of cv_data on public.profiles
for each row
execute function public.touch_profile_cv_updated_at();

-- The profile owner can keep their own biography updated.
drop policy if exists "profile owner updates own cv" on public.profiles;
create policy "profile owner updates own cv"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- A company can read applicant profile contact/CV data only for applications on its own jobs.
drop policy if exists "company reads applicant profiles" on public.profiles;
create policy "company reads applicant profiles"
on public.profiles
for select
using (
  id = auth.uid()
  or private.is_admin()
  or exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = profiles.id
      and c.owner_id = auth.uid()
  )
);

-- CV files are intentionally not stored anymore.
-- The site now uses a built-in CV builder, profile json data and PDF export to avoid storage growth.
