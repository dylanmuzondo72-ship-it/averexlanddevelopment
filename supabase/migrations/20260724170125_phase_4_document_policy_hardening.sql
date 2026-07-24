revoke all on public.quotations from public, anon, authenticated;
revoke all on public.quotation_items from public, anon, authenticated;
revoke all on public.invoices from public, anon, authenticated;
revoke all on public.invoice_items from public, anon, authenticated;

grant select on public.quotations to authenticated;
grant select on public.quotation_items to authenticated;
grant select on public.invoices to authenticated;
grant select on public.invoice_items to authenticated;

drop policy if exists "quotations_select_permitted_profiles"
  on public.quotations;
create policy "quotations_select_permitted_profiles"
  on public.quotations
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) is not null
    and app_private.can_read_quotation(id)
  );

drop policy if exists "quotation_items_select_permitted_profiles"
  on public.quotation_items;
create policy "quotation_items_select_permitted_profiles"
  on public.quotation_items
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) is not null
    and app_private.can_read_quotation(quotation_id)
  );

drop policy if exists "invoices_select_permitted_profiles"
  on public.invoices;
create policy "invoices_select_permitted_profiles"
  on public.invoices
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) is not null
    and app_private.can_read_invoice(id)
  );

drop policy if exists "invoice_items_select_permitted_profiles"
  on public.invoice_items;
create policy "invoice_items_select_permitted_profiles"
  on public.invoice_items
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) is not null
    and app_private.can_read_invoice(invoice_id)
  );

drop policy if exists "activity_logs_select_administrator_accountant"
  on public.activity_logs;
create policy "activity_logs_select_administrator_accountant"
  on public.activity_logs
  for select
  to authenticated
  using (
    (select app_private.current_user_role()) = 'administrator'
    or (
      (select app_private.current_user_role()) = 'accountant'
      and resource_type in (
        'client',
        'company_settings',
        'quotation',
        'invoice'
      )
    )
  );

do $$
declare
  function_signature regprocedure;
begin
  for function_signature in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app_private'
      and p.proname in (
        'capture_client_snapshot',
        'capture_company_snapshot',
        'staff_can_use_client',
        'can_read_quotation',
        'can_write_quotation',
        'can_read_invoice',
        'assert_active_assignee',
        'replace_quotation_items',
        'replace_invoice_items',
        'create_quotation',
        'update_quotation',
        'refresh_quotation_snapshots',
        'transition_quotation',
        'create_quotation_revision',
        'create_invoice',
        'update_invoice',
        'refresh_invoice_snapshots',
        'issue_invoice',
        'cancel_invoice',
        'convert_quotation_to_invoice',
        'update_document_defaults',
        'search_quotations',
        'search_invoices',
        'list_document_clients',
        'list_document_assignees',
        'get_document_activity',
        'record_document_print',
        'next_document_counter',
        'format_document_number',
        'calculate_document_line',
        'calculate_document_totals',
        'enforce_quotation_immutability',
        'enforce_quotation_item_mutability',
        'enforce_invoice_immutability',
        'enforce_invoice_item_mutability'
      )
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      function_signature
    );
  end loop;
end
$$;

do $$
declare
  function_signature regprocedure;
begin
  for function_signature in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app_private'
      and p.proname in (
        'can_read_quotation',
        'can_read_invoice',
        'create_quotation',
        'update_quotation',
        'refresh_quotation_snapshots',
        'transition_quotation',
        'create_quotation_revision',
        'create_invoice',
        'update_invoice',
        'refresh_invoice_snapshots',
        'issue_invoice',
        'cancel_invoice',
        'convert_quotation_to_invoice',
        'update_document_defaults',
        'search_quotations',
        'search_invoices',
        'list_document_clients',
        'list_document_assignees',
        'get_document_activity',
        'record_document_print'
      )
  loop
    execute format(
      'grant execute on function %s to authenticated',
      function_signature
    );
  end loop;
end
$$;

do $$
declare
  function_signature regprocedure;
begin
  for function_signature in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_quotation',
        'update_quotation',
        'refresh_quotation_snapshots',
        'transition_quotation',
        'create_quotation_revision',
        'create_invoice',
        'update_invoice',
        'refresh_invoice_snapshots',
        'issue_invoice',
        'cancel_invoice',
        'convert_quotation_to_invoice',
        'update_document_defaults',
        'search_quotations',
        'search_invoices',
        'list_document_clients',
        'list_document_assignees',
        'get_document_activity',
        'record_document_print'
      )
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      function_signature
    );
    execute format(
      'grant execute on function %s to authenticated',
      function_signature
    );
  end loop;
end
$$;
