begin;

do $$
declare
  line_result record;
  exclusive_result record;
  inclusive_result record;
  quotation_before bigint;
  quotation_first bigint;
  quotation_second bigint;
begin
  if not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'quotations'
      and rowsecurity
  ) or not exists (
    select 1
    from pg_tables
    where schemaname = 'public'
      and tablename = 'invoices'
      and rowsecurity
  ) then
    raise exception 'Phase 4 document RLS is not enabled';
  end if;

  if (
    select array_agg(counter_key order by counter_key)
    from app_private.document_counters
  ) <> array['invoice', 'payment', 'quotation', 'receipt']::text[] then
    raise exception 'Document counters must use permanent internal keys';
  end if;

  select *
  into line_result
  from app_private.calculate_document_line(
    2.5000,
    10.0000,
    'percentage',
    10.0000
  );

  if line_result.calculated_line_subtotal <> 25.00
    or line_result.calculated_discount_total <> 2.50
    or line_result.calculated_line_total <> 22.50 then
    raise exception 'Line calculation order or rounding is incorrect';
  end if;

  select *
  into exclusive_result
  from app_private.calculate_document_totals(
    '[
      {
        "description": "Taxable service",
        "quantity": "2.0000",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": true
      },
      {
        "description": "Non-taxable service",
        "quantity": "1.0000",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": false
      }
    ]'::jsonb,
    'fixed',
    15.0000,
    'exclusive',
    15.0000
  );

  if exclusive_result.calculated_subtotal <> 150.00
    or exclusive_result.calculated_discount_total <> 15.00
    or exclusive_result.calculated_taxable_subtotal <> 90.00
    or exclusive_result.calculated_tax_total <> 13.50
    or exclusive_result.calculated_grand_total <> 148.50 then
    raise exception 'Exclusive tax allocation or rounding is incorrect';
  end if;

  select *
  into inclusive_result
  from app_private.calculate_document_totals(
    '[
      {
        "description": "Taxable service",
        "quantity": "2.0000",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": true
      },
      {
        "description": "Non-taxable service",
        "quantity": "1.0000",
        "unit_price": "50.0000",
        "discount_type": "none",
        "discount_value": "0.0000",
        "tax_applicable": false
      }
    ]'::jsonb,
    'fixed',
    15.0000,
    'inclusive',
    15.0000
  );

  if inclusive_result.calculated_subtotal <> 150.00
    or inclusive_result.calculated_discount_total <> 15.00
    or inclusive_result.calculated_taxable_subtotal <> 90.00
    or inclusive_result.calculated_tax_total <> 11.74
    or inclusive_result.calculated_grand_total <> 135.00 then
    raise exception 'Inclusive tax extraction or rounding is incorrect';
  end if;

  select last_value
  into quotation_before
  from app_private.document_counters
  where counter_key = 'quotation';

  quotation_first := app_private.next_document_counter('quotation');
  quotation_second := app_private.next_document_counter('quotation');

  if quotation_first <> quotation_before + 1
    or quotation_second <> quotation_before + 2 then
    raise exception 'Quotation counter is not monotonic';
  end if;

  if app_private.format_document_number(
    'CHANGED-Q',
    quotation_second
  ) <> 'CHANGED-Q-' || lpad(quotation_second::text, 6, '0') then
    raise exception 'Prefix formatting changed the internal counter';
  end if;
end;
$$;

do $$
declare
  update_definition text;
  transition_definition text;
  conversion_definition text;
begin
  select pg_get_functiondef(
    'app_private.update_quotation(
      uuid, integer, uuid, text, text, text, text, text,
      date, date, public.discount_type, numeric,
      public.document_tax_mode, numeric, text, uuid, jsonb
    )'::regprocedure
  )
  into update_definition;

  select pg_get_functiondef(
    'app_private.transition_quotation(
      uuid, integer, public.quotation_status, text
    )'::regprocedure
  )
  into transition_definition;

  select pg_get_functiondef(
    'app_private.convert_quotation_to_invoice(
      uuid, integer
    )'::regprocedure
  )
  into conversion_definition;

  if update_definition not ilike '%for update%'
    or update_definition not ilike '%lock_version <> expected_lock_version%'
    or transition_definition not ilike '%for update%'
    or transition_definition not ilike '%lock_version <> expected_lock_version%'
    or conversion_definition not ilike '%for update%'
    or conversion_definition not ilike '%lock_version <> expected_lock_version%' then
    raise exception 'Phase 4 optimistic locking definition is incomplete';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.quotations'::regclass
      and tgname = 'quotations_enforce_immutability'
      and not tgisinternal
  ) or not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.invoices'::regclass
      and tgname = 'invoices_enforce_immutability'
      and not tgisinternal
  ) then
    raise exception 'Document immutability triggers are missing';
  end if;
end;
$$;

rollback;

select 'Phase 4 financial calculation tests passed' as result;
