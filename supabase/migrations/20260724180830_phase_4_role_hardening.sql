create or replace function app_private.create_quotation_revision(
  target_quotation_id uuid,
  expected_lock_version integer
)
returns public.quotations
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  current_quotation public.quotations;
  root_id uuid;
  root_number text;
  next_revision integer;
  revised_quotation public.quotations;
begin
  perform app_private.require_active_role(
    array['administrator']::public.app_role[]
  );

  select *
  into current_quotation
  from public.quotations
  where id = target_quotation_id
  for update;

  if not found then
    raise exception 'Quotation not found'
      using errcode = 'P0002';
  end if;

  if current_quotation.lock_version <> expected_lock_version then
    raise exception 'This quotation changed after you opened it. Refresh and try again.'
      using errcode = '40001';
  end if;

  if current_quotation.status <> 'sent' then
    raise exception 'Only sent quotations may be revised'
      using errcode = '55000';
  end if;

  root_id := coalesce(current_quotation.root_quotation_id, current_quotation.id);

  perform 1
  from public.quotations q
  where coalesce(q.root_quotation_id, q.id) = root_id
  for update;

  select q.quote_number
  into root_number
  from public.quotations q
  where q.id = root_id;

  select coalesce(max(q.revision_number), 0) + 1
  into next_revision
  from public.quotations q
  where coalesce(q.root_quotation_id, q.id) = root_id;

  insert into public.quotations (
    quote_number,
    root_quotation_id,
    supersedes_quotation_id,
    revision_number,
    client_id,
    client_snapshot,
    company_snapshot,
    snapshot_version,
    currency,
    issue_date,
    expiry_date,
    status,
    subject,
    introduction,
    notes,
    terms_conditions,
    subtotal,
    discount_type,
    discount_value,
    discount_total,
    taxable_subtotal,
    tax_mode,
    tax_rate,
    tax_label,
    tax_total,
    grand_total,
    assigned_to,
    created_by,
    updated_by
  )
  values (
    root_number || '-R' || lpad(next_revision::text, 2, '0'),
    root_id,
    current_quotation.id,
    next_revision,
    current_quotation.client_id,
    current_quotation.client_snapshot,
    current_quotation.company_snapshot,
    current_quotation.snapshot_version,
    current_quotation.currency,
    current_date,
    greatest(
      current_date,
      current_date
        + (current_quotation.expiry_date - current_quotation.issue_date)
    ),
    'draft',
    current_quotation.subject,
    current_quotation.introduction,
    current_quotation.notes,
    current_quotation.terms_conditions,
    current_quotation.subtotal,
    current_quotation.discount_type,
    current_quotation.discount_value,
    current_quotation.discount_total,
    current_quotation.taxable_subtotal,
    current_quotation.tax_mode,
    current_quotation.tax_rate,
    current_quotation.tax_label,
    current_quotation.tax_total,
    current_quotation.grand_total,
    current_quotation.assigned_to,
    actor_id,
    actor_id
  )
  returning * into revised_quotation;

  insert into public.quotation_items (
    quotation_id,
    position,
    item_type,
    description,
    quantity,
    unit,
    unit_price,
    discount_type,
    discount_value,
    discount_total,
    tax_applicable,
    line_subtotal,
    line_total
  )
  select
    revised_quotation.id,
    qi.position,
    qi.item_type,
    qi.description,
    qi.quantity,
    qi.unit,
    qi.unit_price,
    qi.discount_type,
    qi.discount_value,
    qi.discount_total,
    qi.tax_applicable,
    qi.line_subtotal,
    qi.line_total
  from public.quotation_items qi
  where qi.quotation_id = current_quotation.id
  order by qi.position;

  update public.quotations
  set status = 'superseded',
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = current_quotation.id;

  perform app_private.write_activity(
    'quotation_superseded',
    'quotation',
    current_quotation.id,
    'Quotation ' || current_quotation.quote_number
      || ' superseded by ' || revised_quotation.quote_number,
    jsonb_build_object(
      'quote_number', current_quotation.quote_number,
      'revision_id', revised_quotation.id
    )
  );

  perform app_private.write_activity(
    'quotation_revision_created',
    'quotation',
    revised_quotation.id,
    'Revision ' || revised_quotation.quote_number || ' created',
    jsonb_build_object(
      'quote_number', revised_quotation.quote_number,
      'supersedes_id', current_quotation.id
    )
  );

  return revised_quotation;
end;
$$;

revoke all on function app_private.create_quotation_revision(uuid, integer)
  from public, anon, authenticated;
grant execute on function app_private.create_quotation_revision(uuid, integer)
  to authenticated;
