create or replace function app_private.capture_client_snapshot(
  target_client_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  snapshot jsonb;
begin
  select jsonb_build_object(
    'version', 1,
    'client_reference', c.client_reference,
    'client_type', c.client_type,
    'display_name', c.display_name,
    'company_name', c.company_name,
    'contact_person', c.contact_person,
    'physical_address', c.physical_address,
    'billing_address', c.billing_address,
    'phone', c.phone,
    'alternative_phone', c.alternative_phone,
    'email', c.email,
    'tax_number', c.tax_number
  )
  into snapshot
  from public.clients c
  where c.id = target_client_id
    and c.status = 'active';

  if snapshot is null then
    raise exception 'Active client not found'
      using errcode = 'P0002';
  end if;

  return snapshot;
end;
$$;

create or replace function app_private.capture_company_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  snapshot jsonb;
begin
  select jsonb_build_object(
    'version', 1,
    'company_name', s.company_name,
    'slogan', s.slogan,
    'ceo_name', s.ceo_name,
    'address', s.address,
    'primary_phone', s.primary_phone,
    'alternative_phone', s.alternative_phone,
    'primary_email', s.primary_email,
    'alternative_email', s.alternative_email,
    'logo_path', s.logo_path,
    'tax_details', s.tax_details,
    'banking_details', s.banking_details,
    'ecocash_details', s.ecocash_details,
    'default_invoice_due_days', s.default_invoice_due_days
  )
  into snapshot
  from public.company_settings s
  order by s.created_at
  limit 1;

  if snapshot is null then
    raise exception 'Company settings are not configured'
      using errcode = 'P0002';
  end if;

  return snapshot;
end;
$$;

create or replace function app_private.staff_can_use_client(
  target_client_id uuid,
  staff_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and c.status = 'active'
      and (
        c.assigned_to = staff_profile_id
        or c.created_by = staff_profile_id
      )
  )
$$;

create or replace function app_private.can_read_quotation(
  target_quotation_id uuid,
  requesting_profile_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case app_private.current_user_role()
    when 'administrator' then true
    when 'accountant' then true
    when 'viewer' then true
    when 'staff' then exists (
      select 1
      from public.quotations q
      where q.id = target_quotation_id
        and (
          q.created_by = requesting_profile_id
          or q.assigned_to = requesting_profile_id
        )
    )
    else false
  end
$$;

create or replace function app_private.can_write_quotation(
  target_quotation_id uuid,
  requesting_profile_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case app_private.current_user_role()
    when 'administrator' then true
    when 'staff' then exists (
      select 1
      from public.quotations q
      where q.id = target_quotation_id
        and (
          q.created_by = requesting_profile_id
          or q.assigned_to = requesting_profile_id
        )
    )
    else false
  end
$$;

create or replace function app_private.can_read_invoice(
  target_invoice_id uuid,
  requesting_profile_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case app_private.current_user_role()
    when 'administrator' then true
    when 'accountant' then true
    when 'viewer' then true
    when 'staff' then exists (
      select 1
      from public.invoices i
      join public.clients c on c.id = i.client_id
      left join public.quotations q on q.id = i.source_quotation_id
      where i.id = target_invoice_id
        and (
          c.assigned_to = requesting_profile_id
          or c.created_by = requesting_profile_id
          or q.created_by = requesting_profile_id
          or q.assigned_to = requesting_profile_id
        )
    )
    else false
  end
$$;

create or replace function app_private.assert_active_assignee(
  target_profile_id uuid
)
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if target_profile_id is not null and not exists (
    select 1
    from public.profiles p
    where p.id = target_profile_id
      and p.status = 'active'
      and p.role in ('administrator', 'staff')
  ) then
    raise exception 'Assigned staff profile is not active'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function app_private.replace_quotation_items(
  target_quotation_id uuid,
  document_items jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(document_items) <> 'array'
    or jsonb_array_length(document_items) = 0 then
    raise exception 'At least one line item is required'
      using errcode = '22023';
  end if;

  delete from public.quotation_items
  where quotation_id = target_quotation_id;

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
    target_quotation_id,
    entry.position::integer,
    coalesce(
      nullif(entry.item->>'item_type', ''),
      'service'
    )::public.document_item_type,
    trim(entry.item->>'description'),
    (entry.item->>'quantity')::numeric(20,4),
    trim(coalesce(nullif(entry.item->>'unit', ''), 'unit')),
    (entry.item->>'unit_price')::numeric(20,4),
    coalesce(
      nullif(entry.item->>'discount_type', ''),
      'none'
    )::public.discount_type,
    coalesce(
      nullif(entry.item->>'discount_value', ''),
      '0'
    )::numeric(20,4),
    calculated.calculated_discount_total,
    coalesce((entry.item->>'tax_applicable')::boolean, true),
    calculated.calculated_line_subtotal,
    calculated.calculated_line_total
  from jsonb_array_elements(document_items)
    with ordinality as entry(item, position)
  cross join lateral app_private.calculate_document_line(
    (entry.item->>'quantity')::numeric,
    (entry.item->>'unit_price')::numeric,
    coalesce(
      nullif(entry.item->>'discount_type', ''),
      'none'
    )::public.discount_type,
    coalesce(
      nullif(entry.item->>'discount_value', ''),
      '0'
    )::numeric
  ) calculated;
end;
$$;

create or replace function app_private.replace_invoice_items(
  target_invoice_id uuid,
  document_items jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(document_items) <> 'array'
    or jsonb_array_length(document_items) = 0 then
    raise exception 'At least one line item is required'
      using errcode = '22023';
  end if;

  delete from public.invoice_items
  where invoice_id = target_invoice_id;

  insert into public.invoice_items (
    invoice_id,
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
    target_invoice_id,
    entry.position::integer,
    coalesce(
      nullif(entry.item->>'item_type', ''),
      'service'
    )::public.document_item_type,
    trim(entry.item->>'description'),
    (entry.item->>'quantity')::numeric(20,4),
    trim(coalesce(nullif(entry.item->>'unit', ''), 'unit')),
    (entry.item->>'unit_price')::numeric(20,4),
    coalesce(
      nullif(entry.item->>'discount_type', ''),
      'none'
    )::public.discount_type,
    coalesce(
      nullif(entry.item->>'discount_value', ''),
      '0'
    )::numeric(20,4),
    calculated.calculated_discount_total,
    coalesce((entry.item->>'tax_applicable')::boolean, true),
    calculated.calculated_line_subtotal,
    calculated.calculated_line_total
  from jsonb_array_elements(document_items)
    with ordinality as entry(item, position)
  cross join lateral app_private.calculate_document_line(
    (entry.item->>'quantity')::numeric,
    (entry.item->>'unit_price')::numeric,
    coalesce(
      nullif(entry.item->>'discount_type', ''),
      'none'
    )::public.discount_type,
    coalesce(
      nullif(entry.item->>'discount_value', ''),
      '0'
    )::numeric
  ) calculated;
end;
$$;

create or replace function app_private.create_quotation(
  new_client_id uuid,
  new_subject text,
  new_introduction text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_expiry_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_assigned_to uuid,
  new_items jsonb
)
returns public.quotations
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  actor_id uuid := (select auth.uid());
  settings public.company_settings;
  totals record;
  assigned_profile_id uuid;
  next_number bigint;
  created_quotation public.quotations;
begin
  actor_role := app_private.require_active_role(
    array['administrator', 'staff']::public.app_role[]
  );

  if actor_role = 'staff' and not app_private.staff_can_use_client(
    new_client_id,
    actor_id
  ) then
    raise exception 'You do not have permission to quote this client'
      using errcode = '42501';
  end if;

  assigned_profile_id := case
    when actor_role = 'staff' then actor_id
    else new_assigned_to
  end;
  perform app_private.assert_active_assignee(assigned_profile_id);

  select *
  into settings
  from public.company_settings
  order by created_at
  limit 1;

  if settings.id is null then
    raise exception 'Company settings are not configured'
      using errcode = 'P0002';
  end if;

  select *
  into totals
  from app_private.calculate_document_totals(
    new_items,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate
  );

  next_number := app_private.next_document_counter('quotation');

  insert into public.quotations (
    quote_number,
    client_id,
    client_snapshot,
    company_snapshot,
    currency,
    issue_date,
    expiry_date,
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
    app_private.format_document_number(
      settings.quote_prefix,
      next_number
    ),
    new_client_id,
    app_private.capture_client_snapshot(new_client_id),
    app_private.capture_company_snapshot(),
    upper(trim(new_currency)),
    new_issue_date,
    new_expiry_date,
    trim(new_subject),
    nullif(trim(new_introduction), ''),
    nullif(trim(new_notes), ''),
    coalesce(new_terms_conditions, ''),
    totals.calculated_subtotal,
    new_discount_type,
    new_discount_value,
    totals.calculated_discount_total,
    totals.calculated_taxable_subtotal,
    new_tax_mode,
    new_tax_rate,
    trim(new_tax_label),
    totals.calculated_tax_total,
    totals.calculated_grand_total,
    assigned_profile_id,
    actor_id,
    actor_id
  )
  returning * into created_quotation;

  perform app_private.replace_quotation_items(
    created_quotation.id,
    new_items
  );

  perform app_private.write_activity(
    'quotation_created',
    'quotation',
    created_quotation.id,
    'Quotation ' || created_quotation.quote_number || ' created',
    jsonb_build_object(
      'quote_number', created_quotation.quote_number,
      'client_id', created_quotation.client_id
    )
  );

  return created_quotation;
end;
$$;

create or replace function app_private.update_quotation(
  target_quotation_id uuid,
  expected_lock_version integer,
  new_client_id uuid,
  new_subject text,
  new_introduction text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_expiry_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_assigned_to uuid,
  new_items jsonb
)
returns public.quotations
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  actor_id uuid := (select auth.uid());
  current_quotation public.quotations;
  updated_quotation public.quotations;
  totals record;
  assigned_profile_id uuid;
  client_snapshot_value jsonb;
begin
  actor_role := app_private.require_active_role(
    array['administrator', 'staff']::public.app_role[]
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

  if current_quotation.status <> 'draft' then
    raise exception 'Only draft quotations may be edited'
      using errcode = '55000';
  end if;

  if not app_private.can_write_quotation(
    target_quotation_id,
    actor_id
  ) then
    raise exception 'You do not have permission to edit this quotation'
      using errcode = '42501';
  end if;

  if actor_role = 'staff' and not app_private.staff_can_use_client(
    new_client_id,
    actor_id
  ) then
    raise exception 'You do not have permission to quote this client'
      using errcode = '42501';
  end if;

  assigned_profile_id := case
    when actor_role = 'staff' then current_quotation.assigned_to
    else new_assigned_to
  end;
  perform app_private.assert_active_assignee(assigned_profile_id);

  client_snapshot_value := case
    when current_quotation.client_id = new_client_id then
      current_quotation.client_snapshot
    else app_private.capture_client_snapshot(new_client_id)
  end;

  select *
  into totals
  from app_private.calculate_document_totals(
    new_items,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate
  );

  update public.quotations
  set client_id = new_client_id,
      client_snapshot = client_snapshot_value,
      currency = upper(trim(new_currency)),
      issue_date = new_issue_date,
      expiry_date = new_expiry_date,
      subject = trim(new_subject),
      introduction = nullif(trim(new_introduction), ''),
      notes = nullif(trim(new_notes), ''),
      terms_conditions = coalesce(new_terms_conditions, ''),
      subtotal = totals.calculated_subtotal,
      discount_type = new_discount_type,
      discount_value = new_discount_value,
      discount_total = totals.calculated_discount_total,
      taxable_subtotal = totals.calculated_taxable_subtotal,
      tax_mode = new_tax_mode,
      tax_rate = new_tax_rate,
      tax_label = trim(new_tax_label),
      tax_total = totals.calculated_tax_total,
      grand_total = totals.calculated_grand_total,
      assigned_to = assigned_profile_id,
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_quotation_id
  returning * into updated_quotation;

  perform app_private.replace_quotation_items(
    target_quotation_id,
    new_items
  );

  perform app_private.write_activity(
    'quotation_updated',
    'quotation',
    target_quotation_id,
    'Quotation ' || updated_quotation.quote_number || ' updated',
    jsonb_build_object(
      'quote_number', updated_quotation.quote_number,
      'lock_version', updated_quotation.lock_version
    )
  );

  return updated_quotation;
end;
$$;

create or replace function app_private.refresh_quotation_snapshots(
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
  refreshed_quotation public.quotations;
begin
  perform app_private.require_active_role(
    array['administrator', 'staff']::public.app_role[]
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

  if current_quotation.status <> 'draft' then
    raise exception 'Only draft quotation snapshots may be refreshed'
      using errcode = '55000';
  end if;

  if not app_private.can_write_quotation(
    target_quotation_id,
    actor_id
  ) then
    raise exception 'You do not have permission to edit this quotation'
      using errcode = '42501';
  end if;

  update public.quotations
  set client_snapshot =
        app_private.capture_client_snapshot(current_quotation.client_id),
      company_snapshot = app_private.capture_company_snapshot(),
      snapshot_version = snapshot_version + 1,
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_quotation_id
  returning * into refreshed_quotation;

  perform app_private.write_activity(
    'quotation_snapshots_refreshed',
    'quotation',
    target_quotation_id,
    'Quotation ' || refreshed_quotation.quote_number
      || ' details refreshed',
    jsonb_build_object(
      'quote_number', refreshed_quotation.quote_number,
      'snapshot_version', refreshed_quotation.snapshot_version
    )
  );

  return refreshed_quotation;
end;
$$;

create or replace function app_private.transition_quotation(
  target_quotation_id uuid,
  expected_lock_version integer,
  requested_status public.quotation_status,
  requested_cancellation_reason text default null
)
returns public.quotations
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  actor_id uuid := (select auth.uid());
  current_quotation public.quotations;
  transitioned_quotation public.quotations;
  activity_action text;
begin
  actor_role := app_private.require_active_role(
    array['administrator', 'staff']::public.app_role[]
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

  if not app_private.can_write_quotation(
    target_quotation_id,
    actor_id
  ) then
    raise exception 'You do not have permission to update this quotation'
      using errcode = '42501';
  end if;

  if actor_role = 'staff' and not (
    (current_quotation.status = 'draft' and requested_status = 'sent')
    or
    (
      current_quotation.status = 'sent'
      and requested_status in ('accepted', 'rejected')
    )
  ) then
    raise exception 'Staff cannot perform this quotation transition'
      using errcode = '42501';
  end if;

  if actor_role = 'administrator' and not (
    (current_quotation.status = 'draft'
      and requested_status in ('sent', 'cancelled'))
    or
    (current_quotation.status = 'sent'
      and requested_status in (
        'accepted',
        'rejected',
        'expired',
        'cancelled'
      ))
    or
    (current_quotation.status = 'accepted'
      and requested_status = 'cancelled')
  ) then
    raise exception 'Invalid quotation status transition'
      using errcode = '22023';
  end if;

  if requested_status = 'sent'
    and current_quotation.expiry_date < current_date then
    raise exception 'An expired quotation cannot be sent'
      using errcode = '22023';
  end if;

  if requested_status = 'cancelled'
    and char_length(trim(coalesce(
      requested_cancellation_reason,
      ''
    ))) < 3 then
    raise exception 'A cancellation reason is required'
      using errcode = '22023';
  end if;

  update public.quotations
  set status = requested_status,
      snapshot_frozen_at = case
        when requested_status = 'sent' then now()
        else snapshot_frozen_at
      end,
      sent_at = case
        when requested_status = 'sent' then now()
        else sent_at
      end,
      accepted_at = case
        when requested_status = 'accepted' then now()
        else accepted_at
      end,
      rejected_at = case
        when requested_status = 'rejected' then now()
        else rejected_at
      end,
      expired_at = case
        when requested_status = 'expired' then now()
        else expired_at
      end,
      cancelled_at = case
        when requested_status = 'cancelled' then now()
        else cancelled_at
      end,
      cancellation_reason = case
        when requested_status = 'cancelled' then
          trim(requested_cancellation_reason)
        else cancellation_reason
      end,
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_quotation_id
  returning * into transitioned_quotation;

  activity_action := 'quotation_' || requested_status::text;

  perform app_private.write_activity(
    activity_action,
    'quotation',
    target_quotation_id,
    'Quotation ' || transitioned_quotation.quote_number
      || ' marked ' || requested_status::text,
    jsonb_build_object(
      'quote_number', transitioned_quotation.quote_number,
      'from_status', current_quotation.status,
      'to_status', requested_status
    )
  );

  return transitioned_quotation;
end;
$$;

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
    array['administrator', 'staff']::public.app_role[]
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

  if not app_private.can_write_quotation(
    target_quotation_id,
    actor_id
  ) then
    raise exception 'You do not have permission to revise this quotation'
      using errcode = '42501';
  end if;

  root_id := coalesce(
    current_quotation.root_quotation_id,
    current_quotation.id
  );

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
        + (current_quotation.expiry_date
          - current_quotation.issue_date)
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

create or replace function app_private.create_invoice(
  new_client_id uuid,
  new_subject text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_due_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_items jsonb
)
returns public.invoices
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  totals record;
  created_invoice public.invoices;
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  perform app_private.capture_client_snapshot(new_client_id);

  select *
  into totals
  from app_private.calculate_document_totals(
    new_items,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate
  );

  insert into public.invoices (
    client_id,
    client_snapshot,
    company_snapshot,
    currency,
    issue_date,
    due_date,
    subject,
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
    amount_paid,
    balance_due,
    created_by,
    updated_by
  )
  values (
    new_client_id,
    app_private.capture_client_snapshot(new_client_id),
    app_private.capture_company_snapshot(),
    upper(trim(new_currency)),
    new_issue_date,
    new_due_date,
    trim(new_subject),
    nullif(trim(new_notes), ''),
    coalesce(new_terms_conditions, ''),
    totals.calculated_subtotal,
    new_discount_type,
    new_discount_value,
    totals.calculated_discount_total,
    totals.calculated_taxable_subtotal,
    new_tax_mode,
    new_tax_rate,
    trim(new_tax_label),
    totals.calculated_tax_total,
    totals.calculated_grand_total,
    0,
    totals.calculated_grand_total,
    actor_id,
    actor_id
  )
  returning * into created_invoice;

  perform app_private.replace_invoice_items(
    created_invoice.id,
    new_items
  );

  perform app_private.write_activity(
    'invoice_created',
    'invoice',
    created_invoice.id,
    'Draft invoice created',
    jsonb_build_object(
      'invoice_id', created_invoice.id,
      'client_id', created_invoice.client_id
    )
  );

  return created_invoice;
end;
$$;

create or replace function app_private.update_invoice(
  target_invoice_id uuid,
  expected_lock_version integer,
  new_client_id uuid,
  new_subject text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_due_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_items jsonb
)
returns public.invoices
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  current_invoice public.invoices;
  updated_invoice public.invoices;
  totals record;
  client_snapshot_value jsonb;
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  select *
  into current_invoice
  from public.invoices
  where id = target_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found'
      using errcode = 'P0002';
  end if;

  if current_invoice.lock_version <> expected_lock_version then
    raise exception 'This invoice changed after you opened it. Refresh and try again.'
      using errcode = '40001';
  end if;

  if current_invoice.status <> 'draft' then
    raise exception 'Only draft invoices may be edited'
      using errcode = '55000';
  end if;

  client_snapshot_value := case
    when current_invoice.client_id = new_client_id then
      current_invoice.client_snapshot
    else app_private.capture_client_snapshot(new_client_id)
  end;

  select *
  into totals
  from app_private.calculate_document_totals(
    new_items,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate
  );

  update public.invoices
  set client_id = new_client_id,
      client_snapshot = client_snapshot_value,
      currency = upper(trim(new_currency)),
      issue_date = new_issue_date,
      due_date = new_due_date,
      subject = trim(new_subject),
      notes = nullif(trim(new_notes), ''),
      terms_conditions = coalesce(new_terms_conditions, ''),
      subtotal = totals.calculated_subtotal,
      discount_type = new_discount_type,
      discount_value = new_discount_value,
      discount_total = totals.calculated_discount_total,
      taxable_subtotal = totals.calculated_taxable_subtotal,
      tax_mode = new_tax_mode,
      tax_rate = new_tax_rate,
      tax_label = trim(new_tax_label),
      tax_total = totals.calculated_tax_total,
      grand_total = totals.calculated_grand_total,
      balance_due = totals.calculated_grand_total,
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_invoice_id
  returning * into updated_invoice;

  perform app_private.replace_invoice_items(
    target_invoice_id,
    new_items
  );

  perform app_private.write_activity(
    'invoice_updated',
    'invoice',
    target_invoice_id,
    'Draft invoice updated',
    jsonb_build_object(
      'invoice_id', target_invoice_id,
      'lock_version', updated_invoice.lock_version
    )
  );

  return updated_invoice;
end;
$$;

create or replace function app_private.refresh_invoice_snapshots(
  target_invoice_id uuid,
  expected_lock_version integer
)
returns public.invoices
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  current_invoice public.invoices;
  refreshed_invoice public.invoices;
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  select *
  into current_invoice
  from public.invoices
  where id = target_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found'
      using errcode = 'P0002';
  end if;

  if current_invoice.lock_version <> expected_lock_version then
    raise exception 'This invoice changed after you opened it. Refresh and try again.'
      using errcode = '40001';
  end if;

  if current_invoice.status <> 'draft' then
    raise exception 'Only draft invoice snapshots may be refreshed'
      using errcode = '55000';
  end if;

  update public.invoices
  set client_snapshot =
        app_private.capture_client_snapshot(current_invoice.client_id),
      company_snapshot = app_private.capture_company_snapshot(),
      snapshot_version = snapshot_version + 1,
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_invoice_id
  returning * into refreshed_invoice;

  perform app_private.write_activity(
    'invoice_snapshots_refreshed',
    'invoice',
    target_invoice_id,
    'Draft invoice details refreshed',
    jsonb_build_object(
      'invoice_id', target_invoice_id,
      'snapshot_version', refreshed_invoice.snapshot_version
    )
  );

  return refreshed_invoice;
end;
$$;

create or replace function app_private.issue_invoice(
  target_invoice_id uuid,
  expected_lock_version integer
)
returns public.invoices
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  current_invoice public.invoices;
  settings public.company_settings;
  next_number bigint;
  issued_invoice public.invoices;
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  select *
  into current_invoice
  from public.invoices
  where id = target_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found'
      using errcode = 'P0002';
  end if;

  if current_invoice.lock_version <> expected_lock_version then
    raise exception 'This invoice changed after you opened it. Refresh and try again.'
      using errcode = '40001';
  end if;

  if current_invoice.status <> 'draft' then
    raise exception 'Only a draft invoice may be issued'
      using errcode = '55000';
  end if;

  if current_invoice.due_date < current_invoice.issue_date then
    raise exception 'Invoice due date cannot precede the issue date'
      using errcode = '22023';
  end if;

  select *
  into settings
  from public.company_settings
  order by created_at
  limit 1;

  next_number := app_private.next_document_counter('invoice');

  update public.invoices
  set invoice_number = app_private.format_document_number(
        settings.invoice_prefix,
        next_number
      ),
      status = 'issued',
      snapshot_frozen_at = now(),
      issued_by = actor_id,
      issued_at = now(),
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_invoice_id
  returning * into issued_invoice;

  perform app_private.write_activity(
    'invoice_issued',
    'invoice',
    target_invoice_id,
    'Invoice ' || issued_invoice.invoice_number || ' issued',
    jsonb_build_object(
      'invoice_number', issued_invoice.invoice_number,
      'client_id', issued_invoice.client_id
    )
  );

  return issued_invoice;
end;
$$;

create or replace function app_private.cancel_invoice(
  target_invoice_id uuid,
  expected_lock_version integer,
  requested_cancellation_reason text
)
returns public.invoices
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  current_invoice public.invoices;
  cancelled_invoice public.invoices;
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  select *
  into current_invoice
  from public.invoices
  where id = target_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found'
      using errcode = 'P0002';
  end if;

  if current_invoice.lock_version <> expected_lock_version then
    raise exception 'This invoice changed after you opened it. Refresh and try again.'
      using errcode = '40001';
  end if;

  if current_invoice.status = 'cancelled' then
    raise exception 'Invoice is already cancelled'
      using errcode = '55000';
  end if;

  if char_length(trim(coalesce(
    requested_cancellation_reason,
    ''
  ))) < 3 then
    raise exception 'A cancellation reason is required'
      using errcode = '22023';
  end if;

  update public.invoices
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = trim(requested_cancellation_reason),
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_invoice_id
  returning * into cancelled_invoice;

  perform app_private.write_activity(
    'invoice_cancelled',
    'invoice',
    target_invoice_id,
    'Invoice '
      || coalesce(cancelled_invoice.invoice_number, 'draft')
      || ' cancelled',
    jsonb_build_object(
      'invoice_number', cancelled_invoice.invoice_number,
      'previous_status', current_invoice.status
    )
  );

  return cancelled_invoice;
end;
$$;

create or replace function app_private.convert_quotation_to_invoice(
  target_quotation_id uuid,
  expected_lock_version integer
)
returns public.invoices
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := (select auth.uid());
  current_quotation public.quotations;
  existing_invoice public.invoices;
  created_invoice public.invoices;
  source_items jsonb;
  totals record;
  due_days integer;
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
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

  select *
  into existing_invoice
  from public.invoices
  where source_quotation_id = target_quotation_id;

  if existing_invoice.id is not null then
    return existing_invoice;
  end if;

  if current_quotation.lock_version <> expected_lock_version then
    raise exception 'This quotation changed after you opened it. Refresh and try again.'
      using errcode = '40001';
  end if;

  if current_quotation.status <> 'accepted' then
    raise exception 'Only an accepted quotation may be converted'
      using errcode = '55000';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'item_type', qi.item_type,
      'description', qi.description,
      'quantity', qi.quantity,
      'unit', qi.unit,
      'unit_price', qi.unit_price,
      'discount_type', qi.discount_type,
      'discount_value', qi.discount_value,
      'tax_applicable', qi.tax_applicable
    )
    order by qi.position
  )
  into source_items
  from public.quotation_items qi
  where qi.quotation_id = target_quotation_id;

  select *
  into totals
  from app_private.calculate_document_totals(
    source_items,
    current_quotation.discount_type,
    current_quotation.discount_value,
    current_quotation.tax_mode,
    current_quotation.tax_rate
  );

  due_days := coalesce(
    (
      current_quotation.company_snapshot
        ->>'default_invoice_due_days'
    )::integer,
    14
  );

  insert into public.invoices (
    client_id,
    source_quotation_id,
    client_snapshot,
    company_snapshot,
    snapshot_version,
    currency,
    issue_date,
    due_date,
    subject,
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
    amount_paid,
    balance_due,
    created_by,
    updated_by
  )
  values (
    current_quotation.client_id,
    current_quotation.id,
    current_quotation.client_snapshot,
    current_quotation.company_snapshot,
    current_quotation.snapshot_version,
    current_quotation.currency,
    current_date,
    current_date + due_days,
    current_quotation.subject,
    current_quotation.notes,
    current_quotation.terms_conditions,
    totals.calculated_subtotal,
    current_quotation.discount_type,
    current_quotation.discount_value,
    totals.calculated_discount_total,
    totals.calculated_taxable_subtotal,
    current_quotation.tax_mode,
    current_quotation.tax_rate,
    current_quotation.tax_label,
    totals.calculated_tax_total,
    totals.calculated_grand_total,
    0,
    totals.calculated_grand_total,
    actor_id,
    actor_id
  )
  returning * into created_invoice;

  perform app_private.replace_invoice_items(
    created_invoice.id,
    source_items
  );

  update public.quotations
  set status = 'converted',
      converted_at = now(),
      updated_by = actor_id,
      lock_version = lock_version + 1
  where id = target_quotation_id;

  perform app_private.write_activity(
    'quotation_converted',
    'quotation',
    target_quotation_id,
    'Quotation ' || current_quotation.quote_number
      || ' converted to a draft invoice',
    jsonb_build_object(
      'quote_number', current_quotation.quote_number,
      'invoice_id', created_invoice.id
    )
  );

  perform app_private.write_activity(
    'invoice_created_from_quotation',
    'invoice',
    created_invoice.id,
    'Draft invoice created from '
      || current_quotation.quote_number,
    jsonb_build_object(
      'source_quotation_id', target_quotation_id,
      'quote_number', current_quotation.quote_number
    )
  );

  return created_invoice;
end;
$$;

create or replace function app_private.update_document_defaults(
  target_settings_id uuid,
  new_quote_validity_days integer,
  new_invoice_due_days integer,
  new_tax_label text,
  new_tax_mode public.document_tax_mode
)
returns public.company_settings
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  updated_settings public.company_settings;
begin
  perform app_private.require_active_role(
    array['administrator']::public.app_role[]
  );

  update public.company_settings
  set default_quote_validity_days = new_quote_validity_days,
      default_invoice_due_days = new_invoice_due_days,
      default_tax_label = trim(new_tax_label),
      default_tax_mode = new_tax_mode,
      updated_by = (select auth.uid())
  where id = target_settings_id
  returning * into updated_settings;

  if updated_settings.id is null then
    raise exception 'Company settings not found'
      using errcode = 'P0002';
  end if;

  perform app_private.write_activity(
    'document_defaults_updated',
    'company_settings',
    target_settings_id,
    'Quotation and invoice defaults updated',
    jsonb_build_object(
      'default_quote_validity_days',
        updated_settings.default_quote_validity_days,
      'default_invoice_due_days',
        updated_settings.default_invoice_due_days,
      'default_tax_label', updated_settings.default_tax_label,
      'default_tax_mode', updated_settings.default_tax_mode
    )
  );

  return updated_settings;
end;
$$;

create or replace function app_private.search_quotations(
  search_term text default null,
  status_filter text default null,
  date_from date default null,
  date_to date default null,
  assigned_filter uuid default null,
  sort_order text default 'newest',
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  quote_number text,
  revision_number integer,
  client_id uuid,
  client_name text,
  subject text,
  currency text,
  issue_date date,
  expiry_date date,
  effective_status text,
  stored_status public.quotation_status,
  grand_total numeric,
  assigned_to uuid,
  assigned_name text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  lock_version integer,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  if page_size < 1 or page_size > 100 or page_offset < 0 then
    raise exception 'Invalid quotation pagination'
      using errcode = '22023';
  end if;

  return query
  with accessible as (
    select
      q.*,
      q.client_snapshot->>'display_name' as snapshot_client_name,
      p.full_name as snapshot_assigned_name,
      case
        when q.status = 'sent' and q.expiry_date < current_date
          then 'expired'
        else q.status::text
      end as calculated_status
    from public.quotations q
    left join public.profiles p on p.id = q.assigned_to
    where app_private.can_read_quotation(q.id)
  )
  select
    a.id,
    a.quote_number,
    a.revision_number,
    a.client_id,
    a.snapshot_client_name,
    a.subject,
    a.currency,
    a.issue_date,
    a.expiry_date,
    a.calculated_status,
    a.status,
    a.grand_total,
    a.assigned_to,
    a.snapshot_assigned_name,
    a.created_by,
    a.created_at,
    a.updated_at,
    a.lock_version,
    count(*) over()
  from accessible a
  where (
      nullif(trim(search_term), '') is null
      or a.quote_number ilike '%' || trim(search_term) || '%'
      or a.subject ilike '%' || trim(search_term) || '%'
      or a.snapshot_client_name ilike '%' || trim(search_term) || '%'
    )
    and (
      nullif(trim(status_filter), '') is null
      or a.calculated_status = trim(status_filter)
    )
    and (date_from is null or a.issue_date >= date_from)
    and (date_to is null or a.issue_date <= date_to)
    and (assigned_filter is null or a.assigned_to = assigned_filter)
  order by
    case when sort_order = 'oldest' then a.created_at end asc,
    case when sort_order = 'expiry' then a.expiry_date end asc,
    case when sort_order = 'total_asc' then a.grand_total end asc,
    case when sort_order = 'total_desc' then a.grand_total end desc,
    case when sort_order = 'client' then lower(a.snapshot_client_name) end asc,
    case when sort_order = 'newest' then a.created_at end desc,
    a.created_at desc
  limit page_size
  offset page_offset;
end;
$$;

create or replace function app_private.search_invoices(
  search_term text default null,
  status_filter text default null,
  date_from date default null,
  date_to date default null,
  sort_order text default 'newest',
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  invoice_number text,
  client_id uuid,
  client_name text,
  subject text,
  currency text,
  issue_date date,
  due_date date,
  effective_status text,
  stored_status public.invoice_status,
  grand_total numeric,
  amount_paid numeric,
  balance_due numeric,
  source_quotation_id uuid,
  source_quote_number text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  lock_version integer,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  if page_size < 1 or page_size > 100 or page_offset < 0 then
    raise exception 'Invalid invoice pagination'
      using errcode = '22023';
  end if;

  return query
  with accessible as (
    select
      i.*,
      i.client_snapshot->>'display_name' as snapshot_client_name,
      q.quote_number as snapshot_quote_number,
      case
        when i.status = 'issued' and i.due_date < current_date
          then 'overdue'
        else i.status::text
      end as calculated_status
    from public.invoices i
    left join public.quotations q on q.id = i.source_quotation_id
    where app_private.can_read_invoice(i.id)
  )
  select
    a.id,
    a.invoice_number,
    a.client_id,
    a.snapshot_client_name,
    a.subject,
    a.currency,
    a.issue_date,
    a.due_date,
    a.calculated_status,
    a.status,
    a.grand_total,
    a.amount_paid,
    a.balance_due,
    a.source_quotation_id,
    a.snapshot_quote_number,
    a.created_by,
    a.created_at,
    a.updated_at,
    a.lock_version,
    count(*) over()
  from accessible a
  where (
      nullif(trim(search_term), '') is null
      or coalesce(a.invoice_number, 'Draft') ilike
        '%' || trim(search_term) || '%'
      or a.subject ilike '%' || trim(search_term) || '%'
      or a.snapshot_client_name ilike '%' || trim(search_term) || '%'
    )
    and (
      nullif(trim(status_filter), '') is null
      or a.calculated_status = trim(status_filter)
    )
    and (date_from is null or a.issue_date >= date_from)
    and (date_to is null or a.issue_date <= date_to)
  order by
    case when sort_order = 'oldest' then a.created_at end asc,
    case when sort_order = 'due_date' then a.due_date end asc,
    case when sort_order = 'total_asc' then a.grand_total end asc,
    case when sort_order = 'total_desc' then a.grand_total end desc,
    case when sort_order = 'client' then lower(a.snapshot_client_name) end asc,
    case when sort_order = 'newest' then a.created_at end desc,
    a.created_at desc
  limit page_size
  offset page_offset;
end;
$$;

create or replace function app_private.list_document_clients(
  document_kind text,
  search_term text default null,
  result_limit integer default 100
)
returns table (
  id uuid,
  client_reference text,
  display_name text,
  company_name text,
  phone text,
  email text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
  actor_id uuid := (select auth.uid());
begin
  actor_role := app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant'
    ]::public.app_role[]
  );

  if document_kind not in ('quotation', 'invoice') then
    raise exception 'Unsupported document kind'
      using errcode = '22023';
  end if;

  if document_kind = 'quotation'
    and actor_role not in ('administrator', 'staff') then
    raise exception 'You cannot create quotations'
      using errcode = '42501';
  end if;

  if document_kind = 'invoice'
    and actor_role not in ('administrator', 'accountant') then
    raise exception 'You cannot create invoices'
      using errcode = '42501';
  end if;

  if result_limit < 1 or result_limit > 200 then
    raise exception 'Invalid client result limit'
      using errcode = '22023';
  end if;

  return query
  select
    c.id,
    c.client_reference,
    c.display_name,
    c.company_name,
    c.phone,
    c.email
  from public.clients c
  where c.status = 'active'
    and (
      actor_role <> 'staff'
      or app_private.staff_can_use_client(c.id, actor_id)
    )
    and (
      nullif(trim(search_term), '') is null
      or c.client_reference ilike '%' || trim(search_term) || '%'
      or c.display_name ilike '%' || trim(search_term) || '%'
      or c.phone ilike '%' || trim(search_term) || '%'
      or c.email ilike '%' || trim(search_term) || '%'
    )
  order by lower(c.display_name), c.client_reference
  limit result_limit;
end;
$$;

create or replace function app_private.list_document_assignees()
returns table (
  id uuid,
  display_name text,
  role public.app_role
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.require_active_role(
    array['administrator', 'accountant']::public.app_role[]
  );

  return query
  select
    p.id,
    coalesce(nullif(p.full_name, ''), p.email),
    p.role
  from public.profiles p
  where p.status = 'active'
    and p.role in ('administrator', 'staff')
  order by lower(coalesce(nullif(p.full_name, ''), p.email));
end;
$$;

create or replace function app_private.get_document_activity(
  document_kind text,
  target_document_id uuid,
  result_limit integer default 50
)
returns table (
  id uuid,
  action text,
  actor_name text,
  summary text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role public.app_role;
begin
  actor_role := app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  if result_limit < 1 or result_limit > 100 then
    raise exception 'Invalid activity result limit'
      using errcode = '22023';
  end if;

  if document_kind = 'quotation' then
    if actor_role = 'viewer'
      or not app_private.can_read_quotation(target_document_id) then
      raise exception 'You cannot view this quotation activity'
        using errcode = '42501';
    end if;
  elsif document_kind = 'invoice' then
    if actor_role not in ('administrator', 'accountant')
      or not app_private.can_read_invoice(target_document_id) then
      raise exception 'You cannot view this invoice activity'
        using errcode = '42501';
    end if;
  else
    raise exception 'Unsupported document kind'
      using errcode = '22023';
  end if;

  return query
  select
    a.id,
    a.action,
    coalesce(nullif(p.full_name, ''), p.email, 'System'),
    a.summary,
    a.created_at
  from public.activity_logs a
  left join public.profiles p on p.id = a.actor_id
  where a.resource_type = document_kind
    and a.resource_id = target_document_id
  order by a.created_at desc
  limit result_limit;
end;
$$;

create or replace function app_private.record_document_print(
  document_kind text,
  target_document_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform app_private.require_active_role(
    array[
      'administrator',
      'staff',
      'accountant',
      'viewer'
    ]::public.app_role[]
  );

  if document_kind = 'quotation'
    and not app_private.can_read_quotation(target_document_id) then
    raise exception 'You cannot print this quotation'
      using errcode = '42501';
  end if;

  if document_kind = 'invoice'
    and not app_private.can_read_invoice(target_document_id) then
    raise exception 'You cannot print this invoice'
      using errcode = '42501';
  end if;

  if document_kind not in ('quotation', 'invoice') then
    raise exception 'Unsupported document kind'
      using errcode = '22023';
  end if;

  perform app_private.write_activity(
    document_kind || '_print_prepared',
    document_kind,
    target_document_id,
    initcap(document_kind) || ' prepared for print or PDF saving',
    '{}'::jsonb
  );
end;
$$;

create or replace function public.create_quotation(
  new_client_id uuid,
  new_subject text,
  new_introduction text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_expiry_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_assigned_to uuid,
  new_items jsonb
)
returns public.quotations
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.create_quotation(
    new_client_id,
    new_subject,
    new_introduction,
    new_notes,
    new_terms_conditions,
    new_currency,
    new_issue_date,
    new_expiry_date,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate,
    new_tax_label,
    new_assigned_to,
    new_items
  )
$$;

create or replace function public.update_quotation(
  target_quotation_id uuid,
  expected_lock_version integer,
  new_client_id uuid,
  new_subject text,
  new_introduction text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_expiry_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_assigned_to uuid,
  new_items jsonb
)
returns public.quotations
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.update_quotation(
    target_quotation_id,
    expected_lock_version,
    new_client_id,
    new_subject,
    new_introduction,
    new_notes,
    new_terms_conditions,
    new_currency,
    new_issue_date,
    new_expiry_date,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate,
    new_tax_label,
    new_assigned_to,
    new_items
  )
$$;

create or replace function public.refresh_quotation_snapshots(
  target_quotation_id uuid,
  expected_lock_version integer
)
returns public.quotations
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.refresh_quotation_snapshots(
    target_quotation_id,
    expected_lock_version
  )
$$;

create or replace function public.transition_quotation(
  target_quotation_id uuid,
  expected_lock_version integer,
  requested_status public.quotation_status,
  requested_cancellation_reason text default null
)
returns public.quotations
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.transition_quotation(
    target_quotation_id,
    expected_lock_version,
    requested_status,
    requested_cancellation_reason
  )
$$;

create or replace function public.create_quotation_revision(
  target_quotation_id uuid,
  expected_lock_version integer
)
returns public.quotations
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.create_quotation_revision(
    target_quotation_id,
    expected_lock_version
  )
$$;

create or replace function public.create_invoice(
  new_client_id uuid,
  new_subject text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_due_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_items jsonb
)
returns public.invoices
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.create_invoice(
    new_client_id,
    new_subject,
    new_notes,
    new_terms_conditions,
    new_currency,
    new_issue_date,
    new_due_date,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate,
    new_tax_label,
    new_items
  )
$$;

create or replace function public.update_invoice(
  target_invoice_id uuid,
  expected_lock_version integer,
  new_client_id uuid,
  new_subject text,
  new_notes text,
  new_terms_conditions text,
  new_currency text,
  new_issue_date date,
  new_due_date date,
  new_discount_type public.discount_type,
  new_discount_value numeric,
  new_tax_mode public.document_tax_mode,
  new_tax_rate numeric,
  new_tax_label text,
  new_items jsonb
)
returns public.invoices
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.update_invoice(
    target_invoice_id,
    expected_lock_version,
    new_client_id,
    new_subject,
    new_notes,
    new_terms_conditions,
    new_currency,
    new_issue_date,
    new_due_date,
    new_discount_type,
    new_discount_value,
    new_tax_mode,
    new_tax_rate,
    new_tax_label,
    new_items
  )
$$;

create or replace function public.refresh_invoice_snapshots(
  target_invoice_id uuid,
  expected_lock_version integer
)
returns public.invoices
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.refresh_invoice_snapshots(
    target_invoice_id,
    expected_lock_version
  )
$$;

create or replace function public.issue_invoice(
  target_invoice_id uuid,
  expected_lock_version integer
)
returns public.invoices
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.issue_invoice(
    target_invoice_id,
    expected_lock_version
  )
$$;

create or replace function public.cancel_invoice(
  target_invoice_id uuid,
  expected_lock_version integer,
  requested_cancellation_reason text
)
returns public.invoices
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.cancel_invoice(
    target_invoice_id,
    expected_lock_version,
    requested_cancellation_reason
  )
$$;

create or replace function public.convert_quotation_to_invoice(
  target_quotation_id uuid,
  expected_lock_version integer
)
returns public.invoices
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.convert_quotation_to_invoice(
    target_quotation_id,
    expected_lock_version
  )
$$;

create or replace function public.update_document_defaults(
  target_settings_id uuid,
  new_quote_validity_days integer,
  new_invoice_due_days integer,
  new_tax_label text,
  new_tax_mode public.document_tax_mode
)
returns public.company_settings
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.update_document_defaults(
    target_settings_id,
    new_quote_validity_days,
    new_invoice_due_days,
    new_tax_label,
    new_tax_mode
  )
$$;

create or replace function public.search_quotations(
  search_term text default null,
  status_filter text default null,
  date_from date default null,
  date_to date default null,
  assigned_filter uuid default null,
  sort_order text default 'newest',
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  quote_number text,
  revision_number integer,
  client_id uuid,
  client_name text,
  subject text,
  currency text,
  issue_date date,
  expiry_date date,
  effective_status text,
  stored_status public.quotation_status,
  grand_total numeric,
  assigned_to uuid,
  assigned_name text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  lock_version integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select * from app_private.search_quotations(
    search_term,
    status_filter,
    date_from,
    date_to,
    assigned_filter,
    sort_order,
    page_size,
    page_offset
  )
$$;

create or replace function public.search_invoices(
  search_term text default null,
  status_filter text default null,
  date_from date default null,
  date_to date default null,
  sort_order text default 'newest',
  page_size integer default 20,
  page_offset integer default 0
)
returns table (
  id uuid,
  invoice_number text,
  client_id uuid,
  client_name text,
  subject text,
  currency text,
  issue_date date,
  due_date date,
  effective_status text,
  stored_status public.invoice_status,
  grand_total numeric,
  amount_paid numeric,
  balance_due numeric,
  source_quotation_id uuid,
  source_quote_number text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  lock_version integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select * from app_private.search_invoices(
    search_term,
    status_filter,
    date_from,
    date_to,
    sort_order,
    page_size,
    page_offset
  )
$$;

create or replace function public.list_document_clients(
  document_kind text,
  search_term text default null,
  result_limit integer default 100
)
returns table (
  id uuid,
  client_reference text,
  display_name text,
  company_name text,
  phone text,
  email text
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select * from app_private.list_document_clients(
    document_kind,
    search_term,
    result_limit
  )
$$;

create or replace function public.list_document_assignees()
returns table (
  id uuid,
  display_name text,
  role public.app_role
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select * from app_private.list_document_assignees()
$$;

create or replace function public.get_document_activity(
  document_kind text,
  target_document_id uuid,
  result_limit integer default 50
)
returns table (
  id uuid,
  action text,
  actor_name text,
  summary text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select * from app_private.get_document_activity(
    document_kind,
    target_document_id,
    result_limit
  )
$$;

create or replace function public.record_document_print(
  document_kind text,
  target_document_id uuid
)
returns void
language sql
volatile
security invoker
set search_path = public, pg_temp
as $$
  select app_private.record_document_print(
    document_kind,
    target_document_id
  )
$$;
