begin;

create temporary table phase4_test_users(
  label text primary key,
  id uuid not null
) on commit drop;
grant all on phase4_test_users to authenticated;

insert into phase4_test_users(label, id)
values
  ('administrator', gen_random_uuid()),
  ('staff', gen_random_uuid()),
  ('other_staff', gen_random_uuid()),
  ('accountant', gen_random_uuid()),
  ('viewer', gen_random_uuid()),
  ('inactive', gen_random_uuid());

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  test.id,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'phase4-' || test.label || '-' || test.id || '@example.invalid',
  '',
  now(),
  '{}'::jsonb,
  jsonb_build_object('full_name', 'Phase 4 ' || initcap(test.label)),
  now(),
  now()
from phase4_test_users test;

update public.profiles p
set role = case test.label
      when 'administrator' then 'administrator'::public.app_role
      when 'staff' then 'staff'::public.app_role
      when 'other_staff' then 'staff'::public.app_role
      when 'accountant' then 'accountant'::public.app_role
      else 'viewer'::public.app_role
    end,
    status = case
      when test.label = 'inactive' then 'inactive'::public.profile_status
      else 'active'::public.profile_status
    end
from phase4_test_users test
where p.id = test.id;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase4_test_users where label = 'administrator'),
    'role',
    'authenticated'
  )::text,
  true
);

create temporary table phase4_test_clients(
  label text primary key,
  id uuid not null
) on commit drop;
grant all on phase4_test_clients to authenticated;

insert into public.clients (
  client_reference,
  client_type,
  display_name,
  email,
  phone,
  assigned_to,
  created_by,
  updated_by
)
values
  (
    'PHASE4-ASSIGNED',
    'individual',
    'Phase 4 Assigned Client',
    'phase4-assigned@example.invalid',
    '+263 700 004 001',
    (select id from phase4_test_users where label = 'staff'),
    (select id from phase4_test_users where label = 'administrator'),
    (select id from phase4_test_users where label = 'administrator')
  ),
  (
    'PHASE4-CREATED',
    'individual',
    'Phase 4 Created Client',
    'phase4-created@example.invalid',
    '+263 700 004 002',
    (select id from phase4_test_users where label = 'other_staff'),
    (select id from phase4_test_users where label = 'staff'),
    (select id from phase4_test_users where label = 'staff')
  ),
  (
    'PHASE4-UNRELATED',
    'individual',
    'Phase 4 Unrelated Client',
    'phase4-unrelated@example.invalid',
    '+263 700 004 003',
    (select id from phase4_test_users where label = 'other_staff'),
    (select id from phase4_test_users where label = 'administrator'),
    (select id from phase4_test_users where label = 'administrator')
  );

insert into phase4_test_clients(label, id)
select
  case display_name
    when 'Phase 4 Assigned Client' then 'assigned'
    when 'Phase 4 Created Client' then 'created'
    else 'unrelated'
  end,
  id
from public.clients
where display_name like 'Phase 4 % Client';

create temporary table phase4_test_documents(
  label text primary key,
  id uuid not null,
  lock_version integer not null
) on commit drop;
grant all on phase4_test_documents to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase4_test_users where label = 'staff'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  created_quote public.quotations;
  updated_quote public.quotations;
  transitioned_quote public.quotations;
begin
  created_quote := public.create_quotation(
    (select id from phase4_test_clients where label = 'assigned'),
    'Phase 4 Quotation',
    'Scope introduction',
    'Internal notes',
    'Standard terms',
    'USD',
    current_date,
    current_date + 30,
    'fixed',
    15.0000,
    'exclusive',
    15.0000,
    'VAT',
    (select id from phase4_test_users where label = 'other_staff'),
    '[
      {
        "item_type": "service",
        "description": "Taxable service",
        "quantity": "2.0000",
        "unit": "item",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": true
      },
      {
        "item_type": "fee",
        "description": "Non-taxable fee",
        "quantity": "1.0000",
        "unit": "fee",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": false
      }
    ]'::jsonb
  );

  if created_quote.quote_number is null
    or created_quote.quote_number !~ '-[0-9]{6}$'
    or created_quote.assigned_to <> (
      select id from phase4_test_users where label = 'staff'
    ) then
    raise exception 'Quotation first-save numbering or staff ownership failed';
  end if;

  updated_quote := public.update_quotation(
    created_quote.id,
    created_quote.lock_version,
    created_quote.client_id,
    'Phase 4 Quotation Updated',
    created_quote.introduction,
    created_quote.notes,
    created_quote.terms_conditions,
    created_quote.currency,
    created_quote.issue_date,
    created_quote.expiry_date,
    created_quote.discount_type,
    created_quote.discount_value,
    created_quote.tax_mode,
    created_quote.tax_rate,
    created_quote.tax_label,
    created_quote.assigned_to,
    '[
      {
        "item_type": "service",
        "description": "Taxable service",
        "quantity": "2.0000",
        "unit": "item",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": true
      },
      {
        "item_type": "fee",
        "description": "Non-taxable fee",
        "quantity": "1.0000",
        "unit": "fee",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": false
      }
    ]'::jsonb
  );

  if updated_quote.lock_version <> created_quote.lock_version + 1 then
    raise exception 'Quotation lock version was not incremented';
  end if;

  begin
    perform public.update_quotation(
      created_quote.id,
      created_quote.lock_version,
      created_quote.client_id,
      'Stale update',
      null,
      null,
      '',
      'USD',
      current_date,
      current_date + 30,
      'none',
      0,
      'exclusive',
      0,
      'Tax',
      created_quote.assigned_to,
      '[{
        "description": "Stale",
        "quantity": "1",
        "unit_price": "1"
      }]'::jsonb
    );
    raise exception 'Stale quotation update unexpectedly succeeded';
  exception
    when serialization_failure then null;
  end;

  transitioned_quote := public.transition_quotation(
    updated_quote.id,
    updated_quote.lock_version,
    'sent'
  );
  transitioned_quote := public.transition_quotation(
    transitioned_quote.id,
    transitioned_quote.lock_version,
    'accepted'
  );

  insert into phase4_test_documents(label, id, lock_version)
  values (
    'accepted_quote',
    transitioned_quote.id,
    transitioned_quote.lock_version
  );
end;
$$;

reset role;

do $$
begin
  begin
    update public.quotations
    set subject = 'Forbidden snapshot change'
    where id = (
      select id
      from phase4_test_documents
      where label = 'accepted_quote'
    );
    raise exception 'Sent quotation snapshot unexpectedly changed';
  exception
    when object_not_in_prerequisite_state then null;
  end;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase4_test_users where label = 'accountant'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
declare
  source_quote record;
  converted_invoice public.invoices;
  issued_invoice public.invoices;
  assigned_invoice public.invoices;
  created_invoice public.invoices;
  unrelated_invoice public.invoices;
  item_payload jsonb := '[{
    "item_type": "service",
    "description": "Direct invoice service",
    "quantity": "1.0000",
    "unit": "service",
    "unit_price": "100.0000",
    "discount_type": "none",
    "discount_value": "0.0000",
    "tax_applicable": true
  }]'::jsonb;
begin
  select *
  into source_quote
  from phase4_test_documents
  where label = 'accepted_quote';

  converted_invoice := public.convert_quotation_to_invoice(
    source_quote.id,
    source_quote.lock_version
  );

  if converted_invoice.invoice_number is not null
    or converted_invoice.status <> 'draft'
    or converted_invoice.source_quotation_id <> source_quote.id then
    raise exception 'Quotation conversion did not create a linked draft';
  end if;

  issued_invoice := public.issue_invoice(
    converted_invoice.id,
    converted_invoice.lock_version
  );

  if issued_invoice.invoice_number is null
    or issued_invoice.invoice_number !~ '-[0-9]{6}$'
    or issued_invoice.status <> 'issued' then
    raise exception 'Invoice issue numbering failed';
  end if;

  assigned_invoice := public.create_invoice(
    (select id from phase4_test_clients where label = 'assigned'),
    'Assigned client invoice',
    null,
    'Standard terms',
    'USD',
    current_date,
    current_date + 14,
    'none',
    0,
    'exclusive',
    0,
    'Tax',
    item_payload
  );
  created_invoice := public.create_invoice(
    (select id from phase4_test_clients where label = 'created'),
    'Created client invoice',
    null,
    'Standard terms',
    'USD',
    current_date,
    current_date + 14,
    'none',
    0,
    'exclusive',
    0,
    'Tax',
    item_payload
  );
  unrelated_invoice := public.create_invoice(
    (select id from phase4_test_clients where label = 'unrelated'),
    'Unrelated client invoice',
    null,
    'Standard terms',
    'USD',
    current_date,
    current_date + 14,
    'none',
    0,
    'exclusive',
    0,
    'Tax',
    item_payload
  );

  insert into phase4_test_documents(label, id, lock_version)
  values
    ('source_invoice', issued_invoice.id, issued_invoice.lock_version),
    ('assigned_invoice', assigned_invoice.id, assigned_invoice.lock_version),
    ('created_invoice', created_invoice.id, created_invoice.lock_version),
    ('unrelated_invoice', unrelated_invoice.id, unrelated_invoice.lock_version);
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase4_test_users where label = 'staff'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if (
    select count(*)
    from public.invoices i
    where i.id in (
      select d.id
      from phase4_test_documents d
      where d.label in (
        'source_invoice',
        'assigned_invoice',
        'created_invoice'
      )
    )
  ) <> 3 then
    raise exception 'Staff invoice visibility paths are incomplete';
  end if;

  if exists (
    select 1
    from public.invoices i
    where i.id = (
      select id
      from phase4_test_documents
      where label = 'unrelated_invoice'
    )
  ) then
    raise exception 'Staff can read an unrelated invoice';
  end if;

  perform public.record_document_print(
    'invoice',
    (
      select id
      from phase4_test_documents
      where label = 'source_invoice'
    )
  );

  begin
    perform public.create_invoice(
      (select id from phase4_test_clients where label = 'assigned'),
      'Forbidden staff invoice',
      null,
      '',
      'USD',
      current_date,
      current_date + 14,
      'none',
      0,
      'exclusive',
      0,
      'Tax',
      '[{
        "description": "Forbidden",
        "quantity": "1",
        "unit_price": "1"
      }]'::jsonb
    );
    raise exception 'Staff direct invoice creation unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.update_invoice(
      (
        select id
        from phase4_test_documents
        where label = 'assigned_invoice'
      ),
      (
        select lock_version
        from phase4_test_documents
        where label = 'assigned_invoice'
      ),
      (select id from phase4_test_clients where label = 'assigned'),
      'Forbidden staff edit',
      null,
      '',
      'USD',
      current_date,
      current_date + 14,
      'none',
      0,
      'exclusive',
      0,
      'Tax',
      '[{
        "description": "Forbidden",
        "quantity": "1",
        "unit_price": "1"
      }]'::jsonb
    );
    raise exception 'Staff invoice update unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase4_test_users where label = 'viewer'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if (
    select count(*)
    from public.invoices i
    where i.id in (
      select id
      from phase4_test_documents
      where label like '%invoice'
    )
  ) < 4 then
    raise exception 'Viewer invoice read access failed';
  end if;
end;
$$;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub',
    (select id from phase4_test_users where label = 'inactive'),
    'role',
    'authenticated'
  )::text,
  true
);

do $$
begin
  if exists (select 1 from public.quotations)
    or exists (select 1 from public.invoices) then
    raise exception 'Inactive profile document blocking failed';
  end if;

  begin
    perform public.search_quotations();
    raise exception 'Inactive profile search unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

rollback;

select 'Phase 4 document workflow tests passed' as result;
