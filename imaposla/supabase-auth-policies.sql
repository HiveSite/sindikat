-- Launch policies for imaposla.me. Run after supabase-schema.sql.
-- Safe to rerun.

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
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists "profiles own read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles admin read" on public.profiles for select using (public.is_admin());
create policy "profiles admin update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Candidate profiles
alter table public.candidate_profiles enable row level security;
drop policy if exists "candidate profile own all" on public.candidate_profiles;
drop policy if exists "candidate profile admin all" on public.candidate_profiles;
create policy "candidate profile own all" on public.candidate_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "candidate profile admin all" on public.candidate_profiles for all using (public.is_admin()) with check (public.is_admin());

-- Static lookup tables
alter table public.categories enable row level security;
alter table public.cities enable row level security;
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read cities" on public.cities;
create policy "public read categories" on public.categories for select using (true);
create policy "public read cities" on public.cities for select using (true);

-- Companies
alter table public.companies enable row level security;
drop policy if exists "public approved companies" on public.companies;
drop policy if exists "company owner insert" on public.companies;
drop policy if exists "company owner update" on public.companies;
drop policy if exists "admin all companies" on public.companies;
create policy "public approved companies" on public.companies for select using (approved = true or owner_id = auth.uid() or public.is_admin());
create policy "company owner insert" on public.companies for insert with check (owner_id = auth.uid());
create policy "company owner update" on public.companies for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "admin all companies" on public.companies for all using (public.is_admin()) with check (public.is_admin());

-- Jobs
alter table public.jobs enable row level security;
drop policy if exists "public active jobs" on public.jobs;
drop policy if exists "company owns jobs" on public.jobs;
drop policy if exists "company select own jobs" on public.jobs;
drop policy if exists "company insert own jobs" on public.jobs;
drop policy if exists "company update own jobs" on public.jobs;
drop policy if exists "admin all jobs" on public.jobs;
create policy "public active jobs" on public.jobs for select using (status = 'active' or public.is_admin() or exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_id = auth.uid()));
create policy "company insert own jobs" on public.jobs for insert with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "company update own jobs" on public.jobs for update using (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())) with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy "admin all jobs" on public.jobs for all using (public.is_admin()) with check (public.is_admin());

-- Applications
alter table public.job_applications enable row level security;
drop policy if exists "candidate owns applications" on public.job_applications;
drop policy if exists "candidate inserts own applications" on public.job_applications;
drop policy if exists "company sees applications for own jobs" on public.job_applications;
drop policy if exists "company updates applications for own jobs" on public.job_applications;
drop policy if exists "admin all applications" on public.job_applications;
create policy "candidate owns applications" on public.job_applications for select using (candidate_id = auth.uid());
create policy "candidate inserts own applications" on public.job_applications for insert with check (candidate_id = auth.uid());
create policy "company sees applications for own jobs" on public.job_applications for select using (exists (select 1 from public.jobs j join public.companies c on c.id = j.company_id where j.id = job_applications.job_id and c.owner_id = auth.uid()));
create policy "company updates applications for own jobs" on public.job_applications for update using (exists (select 1 from public.jobs j join public.companies c on c.id = j.company_id where j.id = job_applications.job_id and c.owner_id = auth.uid())) with check (exists (select 1 from public.jobs j join public.companies c on c.id = j.company_id where j.id = job_applications.job_id and c.owner_id = auth.uid()));
create policy "admin all applications" on public.job_applications for all using (public.is_admin()) with check (public.is_admin());

-- Comments and events
alter table public.ats_comments enable row level security;
alter table public.application_events enable row level security;
drop policy if exists "admin all comments" on public.ats_comments;
drop policy if exists "admin all events" on public.application_events;
create policy "admin all comments" on public.ats_comments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all events" on public.application_events for all using (public.is_admin()) with check (public.is_admin());

-- Billing and banners
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.banners enable row level security;
drop policy if exists "company reads own orders" on public.orders;
drop policy if exists "company reads own subscriptions" on public.subscriptions;
drop policy if exists "admin all orders" on public.orders;
drop policy if exists "admin all subscriptions" on public.subscriptions;
drop policy if exists "public approved banners" on public.banners;
drop policy if exists "admin all banners" on public.banners;
create policy "company reads own orders" on public.orders for select using (exists (select 1 from public.companies c where c.id = orders.company_id and c.owner_id = auth.uid()));
create policy "company reads own subscriptions" on public.subscriptions for select using (exists (select 1 from public.companies c where c.id = subscriptions.company_id and c.owner_id = auth.uid()));
create policy "admin all orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all subscriptions" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());
create policy "public approved banners" on public.banners for select using (approved = true or public.is_admin());
create policy "admin all banners" on public.banners for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('banners', 'banners', true),
  ('candidate-cv', 'candidate-cv', false)
on conflict (id) do nothing;

drop policy if exists "public read avatars" on storage.objects;
drop policy if exists "authenticated upload public assets" on storage.objects;
drop policy if exists "candidate cv owner read" on storage.objects;
drop policy if exists "candidate cv owner upload" on storage.objects;
create policy "public read avatars" on storage.objects for select using (bucket_id in ('avatars', 'company-logos', 'banners'));
create policy "authenticated upload public assets" on storage.objects for insert to authenticated with check (bucket_id in ('avatars', 'company-logos', 'banners'));
create policy "candidate cv owner read" on storage.objects for select to authenticated using (bucket_id = 'candidate-cv' and owner = auth.uid());
create policy "candidate cv owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'candidate-cv' and owner = auth.uid());
