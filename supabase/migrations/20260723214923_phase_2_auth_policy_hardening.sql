create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

drop policy if exists "profiles_select_own_profile" on public.profiles;
drop policy if exists "profiles_select_administrator" on public.profiles;

create policy "profiles_select_self_or_administrator"
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or app_private.current_user_role() = 'administrator'
  );
