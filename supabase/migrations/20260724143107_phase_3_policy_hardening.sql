drop policy if exists "activity_logs_select_administrator"
  on public.activity_logs;
drop policy if exists "activity_logs_select_accountant_operations"
  on public.activity_logs;

create policy "activity_logs_select_administrator_accountant"
  on public.activity_logs
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) = 'administrator'
    or (
      (select app_private.current_user_role()) = 'accountant'
      and resource_type in ('client', 'company_settings')
    )
  );
