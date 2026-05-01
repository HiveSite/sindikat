-- Extra policies for front-end actions used by the polished imaposla.me UI.
-- Run after supabase-auth-policies.sql. Safe to rerun.

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.banners enable row level security;

drop policy if exists "company reads applicant profiles" on public.profiles;
create policy "company reads applicant profiles" on public.profiles
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.candidate_id = profiles.id and c.owner_id = auth.uid()
  )
);

drop policy if exists "company creates own orders" on public.orders;
create policy "company creates own orders" on public.orders
for insert to authenticated
with check (
  exists (
    select 1 from public.companies c
    where c.id = orders.company_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "company reads own banners" on public.banners;
create policy "company reads own banners" on public.banners
for select to authenticated
using (
  approved = true
  or public.is_admin()
  or exists (
    select 1 from public.companies c
    where c.id = banners.company_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "company creates own banners" on public.banners;
create policy "company creates own banners" on public.banners
for insert to authenticated
with check (
  approved = false
  and exists (
    select 1 from public.companies c
    where c.id = banners.company_id and c.owner_id = auth.uid()
  )
);

-- Optional sanity check: should return active policies for the UI action tables.
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public' and tablename in ('profiles', 'orders', 'banners')
order by tablename, policyname;
