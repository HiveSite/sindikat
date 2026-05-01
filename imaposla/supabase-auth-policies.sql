-- Run this after supabase-schema.sql.
-- It adds profile creation on signup, basic RLS policies, and storage buckets.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'candidate'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    updated_at = now();

  insert into public.candidate_profiles (user_id)
  select new.id
  where coalesce(new.raw_user_meta_data ->> 'role', 'candidate') = 'candidate'
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "candidate profile own all" on public.candidate_profiles;
create policy "candidate profile own all" on public.candidate_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "public approved companies" on public.companies;
create policy "public approved companies" on public.companies
  for select using (approved = true or owner_id = auth.uid());

drop policy if exists "company owner insert" on public.companies;
create policy "company owner insert" on public.companies
  for insert with check (owner_id = auth.uid());

drop policy if exists "company owner update" on public.companies;
create policy "company owner update" on public.companies
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "company reads own orders" on public.orders;
create policy "company reads own orders" on public.orders
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = orders.company_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "company reads own subscriptions" on public.subscriptions;
create policy "company reads own subscriptions" on public.subscriptions
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = subscriptions.company_id and c.owner_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('banners', 'banners', true),
  ('candidate-cv', 'candidate-cv', false)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
create policy "public read avatars" on storage.objects
  for select using (bucket_id in ('avatars', 'company-logos', 'banners'));

drop policy if exists "authenticated upload public assets" on storage.objects;
create policy "authenticated upload public assets" on storage.objects
  for insert to authenticated with check (bucket_id in ('avatars', 'company-logos', 'banners'));

drop policy if exists "candidate cv owner read" on storage.objects;
create policy "candidate cv owner read" on storage.objects
  for select to authenticated using (
    bucket_id = 'candidate-cv' and owner = auth.uid()
  );

drop policy if exists "candidate cv owner upload" on storage.objects;
create policy "candidate cv owner upload" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'candidate-cv' and owner = auth.uid()
  );
