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

-- CV files are intentionally not stored anymore.
-- The site now uses a built-in CV builder and PDF export to avoid storage growth.
-- In the next Supabase step, add text/json CV profile fields instead of a document bucket.
