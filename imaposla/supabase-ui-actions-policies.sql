-- Extra policies for front-end actions used by the polished imaposla.me UI.
-- Run after supabase-auth-policies.sql. Safe to rerun.

alter table public.orders enable row level security;
alter table public.banners enable row level security;

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

-- Optional sanity check: should return the active policies for these two tables.
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public' and tablename in ('orders', 'banners')
order by tablename, policyname;
