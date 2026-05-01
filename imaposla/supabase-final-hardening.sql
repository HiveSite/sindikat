-- Final launch hardening for imaposla.me.
-- Run after supabase-auth-policies.sql and launch-accounts.sql.
-- Safe to rerun.

create or replace function public.prevent_company_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approved := false;
    return new;
  end if;

  if new.approved is distinct from old.approved then
    raise exception 'Only admin can change company approval status';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_company_self_approval_trigger on public.companies;
create trigger prevent_company_self_approval_trigger
before insert or update on public.companies
for each row execute function public.prevent_company_self_approval();

create or replace function public.prevent_company_job_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending_review';
    new.featured := false;
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'Only admin can change job moderation status';
  end if;

  if new.featured is distinct from old.featured then
    raise exception 'Only admin can change featured status';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_company_job_moderation_trigger on public.jobs;
create trigger prevent_company_job_moderation_trigger
before insert or update on public.jobs
for each row execute function public.prevent_company_job_moderation();
