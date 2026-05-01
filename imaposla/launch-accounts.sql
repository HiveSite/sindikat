-- Run after creating these three users in Supabase Authentication:
-- admin@imaposla.me / Imaposla-Admin-2026!
-- firma@imaposla.me / Imaposla-Firma-2026!
-- kandidat@imaposla.me / Imaposla-Kandidat-2026!

update public.profiles
set role = 'admin', full_name = coalesce(nullif(full_name, ''), 'Imaposla Admin'), updated_at = now()
where email = 'admin@imaposla.me';

update public.profiles
set role = 'company', full_name = coalesce(nullif(full_name, ''), 'Imaposla Firma'), updated_at = now()
where email = 'firma@imaposla.me';

update public.profiles
set role = 'candidate', full_name = coalesce(nullif(full_name, ''), 'Imaposla Kandidat'), updated_at = now()
where email = 'kandidat@imaposla.me';

insert into public.candidate_profiles (user_id)
select id from public.profiles
where email = 'kandidat@imaposla.me'
on conflict (user_id) do nothing;

insert into public.companies (owner_id, name, slug, city, industry, description, approved)
select id, 'Imaposla Test Firma', 'imaposla-test-firma', 'Podgorica', 'Poslodavac', 'Pocetni firma nalog za launch provjeru.', true
from public.profiles
where email = 'firma@imaposla.me'
on conflict (slug) do update set
  owner_id = excluded.owner_id,
  approved = true,
  description = excluded.description;

-- Optional sanity check
select email, role, full_name from public.profiles
where email in ('admin@imaposla.me', 'firma@imaposla.me', 'kandidat@imaposla.me')
order by role;
