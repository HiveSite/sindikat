-- Final backend pieces required by the Next.js imaposla.me app.
-- Run this as a new Supabase SQL query after the base schema.

create or replace function public.safe_user_role(value text)
returns public.user_role
language sql
immutable
as $$
  select case
    when value in ('candidate', 'company', 'admin') then value::public.user_role
    else 'candidate'::public.user_role
  end
$$;

alter table public.profiles
  add column if not exists cv_data jsonb not null default '{}'::jsonb,
  add column if not exists cv_updated_at timestamptz;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    public.safe_user_role(new.raw_user_meta_data->>'role')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Role can be changed only by admin.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create table if not exists public.payment_proofs (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  company_id bigint not null references public.companies(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  amount_eur numeric(10,2),
  file_path text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

alter table public.payment_proofs enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "public approved companies" on public.companies;
create policy "public approved companies" on public.companies
for select using (approved = true or owner_id = auth.uid() or public.is_admin());

drop policy if exists "company writes own company" on public.companies;
create policy "company writes own company" on public.companies
for all
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "public categories read" on public.categories;
create policy "public categories read" on public.categories
for select using (true);

drop policy if exists "public cities read" on public.cities;
create policy "public cities read" on public.cities
for select using (true);

drop policy if exists "public plans read" on public.plans;
create policy "public plans read" on public.plans
for select using (true);

drop policy if exists "admin manages jobs" on public.jobs;
create policy "admin manages jobs" on public.jobs
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "company owns orders" on public.orders;
create policy "company owns orders" on public.orders
for all
using (
  public.is_admin()
  or exists (
    select 1 from public.companies c
    where c.id = orders.company_id and c.owner_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.companies c
    where c.id = orders.company_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "company reads own subscriptions" on public.subscriptions;
create policy "company reads own subscriptions" on public.subscriptions
for select
using (
  public.is_admin()
  or exists (
    select 1 from public.companies c
    where c.id = subscriptions.company_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "admin inserts subscriptions" on public.subscriptions;
create policy "admin inserts subscriptions" on public.subscriptions
for insert
with check (public.is_admin());

drop policy if exists "company reads own payment proofs" on public.payment_proofs;
create policy "company reads own payment proofs" on public.payment_proofs
for select
using (
  public.is_admin()
  or exists (
    select 1 from public.companies c
    where c.id = payment_proofs.company_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "company inserts own payment proofs" on public.payment_proofs;
create policy "company inserts own payment proofs" on public.payment_proofs
for insert
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.companies c
    join public.orders o on o.company_id = c.id
    where c.id = payment_proofs.company_id
      and o.id = payment_proofs.order_id
      and c.owner_id = auth.uid()
  )
);

drop policy if exists "admin updates payment proofs" on public.payment_proofs;
create policy "admin updates payment proofs" on public.payment_proofs
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payment proof owner uploads" on storage.objects;
create policy "payment proof owner uploads" on storage.objects
for insert
with check (
  bucket_id = 'payment-proofs'
  and exists (
    select 1 from public.companies c
    where c.owner_id = auth.uid()
      and c.id::text = split_part(name, '/', 1)
  )
);

drop policy if exists "payment proof owner reads" on storage.objects;
create policy "payment proof owner reads" on storage.objects
for select
using (
  bucket_id = 'payment-proofs'
  and (
    public.is_admin()
    or exists (
      select 1 from public.companies c
      where c.owner_id = auth.uid()
        and c.id::text = split_part(name, '/', 1)
    )
  )
);
