do $$
begin
  create type public.quotation_status as enum (
    'draft',
    'sent',
    'accepted',
    'rejected',
    'expired',
    'cancelled',
    'converted',
    'superseded'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.invoice_status as enum (
    'draft',
    'issued',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.document_item_type as enum (
    'service',
    'product',
    'fee',
    'other'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.discount_type as enum (
    'none',
    'percentage',
    'fixed'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.document_tax_mode as enum (
    'exclusive',
    'inclusive'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.company_settings
  add column if not exists default_quote_validity_days integer not null default 30,
  add column if not exists default_invoice_due_days integer not null default 14,
  add column if not exists default_tax_label text not null default 'Tax',
  add column if not exists default_tax_mode public.document_tax_mode
    not null default 'exclusive';

do $$
begin
  alter table public.company_settings
    add constraint company_settings_quote_validity_days_valid
    check (default_quote_validity_days between 1 and 3650);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.company_settings
    add constraint company_settings_invoice_due_days_valid
    check (default_invoice_due_days between 0 and 3650);
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.company_settings
    add constraint company_settings_tax_label_valid
    check (char_length(trim(default_tax_label)) between 1 and 40);
exception
  when duplicate_object then null;
end
$$;

create table if not exists app_private.document_counters (
  counter_key text primary key,
  last_value bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint document_counters_key_valid
    check (counter_key in ('quotation', 'invoice')),
  constraint document_counters_value_non_negative
    check (last_value >= 0)
);

insert into app_private.document_counters (counter_key, last_value)
values ('quotation', 0), ('invoice', 0)
on conflict (counter_key) do nothing;

revoke all on app_private.document_counters
  from public, anon, authenticated;

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null,
  root_quotation_id uuid references public.quotations(id) on delete restrict,
  supersedes_quotation_id uuid references public.quotations(id) on delete restrict,
  revision_number integer not null default 1,
  client_id uuid not null references public.clients(id) on delete restrict,
  client_snapshot jsonb not null,
  company_snapshot jsonb not null,
  snapshot_version integer not null default 1,
  snapshot_frozen_at timestamptz,
  currency text not null,
  issue_date date not null,
  expiry_date date not null,
  status public.quotation_status not null default 'draft',
  subject text not null,
  introduction text,
  notes text,
  terms_conditions text not null default '',
  subtotal numeric(20,2) not null default 0,
  discount_type public.discount_type not null default 'none',
  discount_value numeric(20,4) not null default 0,
  discount_total numeric(20,2) not null default 0,
  taxable_subtotal numeric(20,2) not null default 0,
  tax_mode public.document_tax_mode not null default 'exclusive',
  tax_rate numeric(9,4) not null default 0,
  tax_label text not null default 'Tax',
  tax_total numeric(20,2) not null default 0,
  grand_total numeric(20,2) not null default 0,
  lock_version integer not null default 1,
  assigned_to uuid references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expired_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_quote_number_not_blank
    check (char_length(trim(quote_number)) between 1 and 80),
  constraint quotations_revision_positive
    check (revision_number >= 1),
  constraint quotations_snapshot_version_positive
    check (snapshot_version >= 1),
  constraint quotations_client_snapshot_object
    check (jsonb_typeof(client_snapshot) = 'object'),
  constraint quotations_company_snapshot_object
    check (jsonb_typeof(company_snapshot) = 'object'),
  constraint quotations_currency_valid
    check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  constraint quotations_dates_valid
    check (expiry_date >= issue_date),
  constraint quotations_subject_valid
    check (char_length(trim(subject)) between 1 and 200),
  constraint quotations_tax_label_valid
    check (char_length(trim(tax_label)) between 1 and 40),
  constraint quotations_totals_non_negative
    check (
      subtotal >= 0
      and discount_value >= 0
      and discount_total >= 0
      and taxable_subtotal >= 0
      and tax_rate >= 0
      and tax_total >= 0
      and grand_total >= 0
    ),
  constraint quotations_discount_not_over_subtotal
    check (discount_total <= subtotal),
  constraint quotations_percentage_discount_valid
    check (
      discount_type <> 'percentage'
      or discount_value between 0 and 100
    ),
  constraint quotations_lock_version_positive
    check (lock_version >= 1),
  constraint quotations_cancellation_reason_required
    check (
      status <> 'cancelled'
      or char_length(trim(coalesce(cancellation_reason, ''))) >= 3
    ),
  constraint quotations_revision_shape_valid
    check (
      (revision_number = 1 and root_quotation_id is null
        and supersedes_quotation_id is null)
      or
      (revision_number > 1 and root_quotation_id is not null
        and supersedes_quotation_id is not null)
    )
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete restrict,
  position integer not null,
  item_type public.document_item_type not null default 'service',
  description text not null,
  quantity numeric(20,4) not null,
  unit text not null default 'unit',
  unit_price numeric(20,4) not null,
  discount_type public.discount_type not null default 'none',
  discount_value numeric(20,4) not null default 0,
  discount_total numeric(20,2) not null default 0,
  tax_applicable boolean not null default true,
  line_subtotal numeric(20,2) not null,
  line_total numeric(20,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotation_items_position_positive check (position >= 1),
  constraint quotation_items_description_valid
    check (char_length(trim(description)) between 1 and 2000),
  constraint quotation_items_quantity_positive check (quantity > 0),
  constraint quotation_items_unit_valid
    check (char_length(trim(unit)) between 1 and 40),
  constraint quotation_items_values_non_negative
    check (
      unit_price >= 0
      and discount_value >= 0
      and discount_total >= 0
      and line_subtotal >= 0
      and line_total >= 0
    ),
  constraint quotation_items_discount_not_over_line
    check (discount_total <= line_subtotal),
  constraint quotation_items_percentage_discount_valid
    check (
      discount_type <> 'percentage'
      or discount_value between 0 and 100
    )
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text,
  client_id uuid not null references public.clients(id) on delete restrict,
  source_quotation_id uuid references public.quotations(id) on delete restrict,
  client_snapshot jsonb not null,
  company_snapshot jsonb not null,
  snapshot_version integer not null default 1,
  snapshot_frozen_at timestamptz,
  currency text not null,
  issue_date date not null,
  due_date date not null,
  status public.invoice_status not null default 'draft',
  subject text not null,
  notes text,
  terms_conditions text not null default '',
  subtotal numeric(20,2) not null default 0,
  discount_type public.discount_type not null default 'none',
  discount_value numeric(20,4) not null default 0,
  discount_total numeric(20,2) not null default 0,
  taxable_subtotal numeric(20,2) not null default 0,
  tax_mode public.document_tax_mode not null default 'exclusive',
  tax_rate numeric(9,4) not null default 0,
  tax_label text not null default 'Tax',
  tax_total numeric(20,2) not null default 0,
  grand_total numeric(20,2) not null default 0,
  amount_paid numeric(20,2) not null default 0,
  balance_due numeric(20,2) not null default 0,
  lock_version integer not null default 1,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  issued_by uuid references public.profiles(id) on delete restrict,
  issued_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_invoice_number_valid
    check (
      invoice_number is null
      or char_length(trim(invoice_number)) between 1 and 80
    ),
  constraint invoices_snapshot_version_positive
    check (snapshot_version >= 1),
  constraint invoices_client_snapshot_object
    check (jsonb_typeof(client_snapshot) = 'object'),
  constraint invoices_company_snapshot_object
    check (jsonb_typeof(company_snapshot) = 'object'),
  constraint invoices_currency_valid
    check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  constraint invoices_dates_valid
    check (due_date >= issue_date),
  constraint invoices_subject_valid
    check (char_length(trim(subject)) between 1 and 200),
  constraint invoices_tax_label_valid
    check (char_length(trim(tax_label)) between 1 and 40),
  constraint invoices_totals_non_negative
    check (
      subtotal >= 0
      and discount_value >= 0
      and discount_total >= 0
      and taxable_subtotal >= 0
      and tax_rate >= 0
      and tax_total >= 0
      and grand_total >= 0
      and amount_paid >= 0
      and balance_due >= 0
    ),
  constraint invoices_discount_not_over_subtotal
    check (discount_total <= subtotal),
  constraint invoices_percentage_discount_valid
    check (
      discount_type <> 'percentage'
      or discount_value between 0 and 100
    ),
  constraint invoices_phase_4_amount_paid_zero
    check (amount_paid = 0),
  constraint invoices_balance_matches_phase_4_total
    check (balance_due = grand_total),
  constraint invoices_lock_version_positive
    check (lock_version >= 1),
  constraint invoices_number_required_when_official
    check (
      (status = 'draft' and invoice_number is null and issued_at is null)
      or
      (status = 'issued' and invoice_number is not null
        and issued_at is not null)
      or status = 'cancelled'
    ),
  constraint invoices_cancellation_reason_required
    check (
      status <> 'cancelled'
      or char_length(trim(coalesce(cancellation_reason, ''))) >= 3
    )
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  position integer not null,
  item_type public.document_item_type not null default 'service',
  description text not null,
  quantity numeric(20,4) not null,
  unit text not null default 'unit',
  unit_price numeric(20,4) not null,
  discount_type public.discount_type not null default 'none',
  discount_value numeric(20,4) not null default 0,
  discount_total numeric(20,2) not null default 0,
  tax_applicable boolean not null default true,
  line_subtotal numeric(20,2) not null,
  line_total numeric(20,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_items_position_positive check (position >= 1),
  constraint invoice_items_description_valid
    check (char_length(trim(description)) between 1 and 2000),
  constraint invoice_items_quantity_positive check (quantity > 0),
  constraint invoice_items_unit_valid
    check (char_length(trim(unit)) between 1 and 40),
  constraint invoice_items_values_non_negative
    check (
      unit_price >= 0
      and discount_value >= 0
      and discount_total >= 0
      and line_subtotal >= 0
      and line_total >= 0
    ),
  constraint invoice_items_discount_not_over_line
    check (discount_total <= line_subtotal),
  constraint invoice_items_percentage_discount_valid
    check (
      discount_type <> 'percentage'
      or discount_value between 0 and 100
    )
);

create unique index if not exists quotations_quote_number_unique_idx
  on public.quotations(quote_number);
create unique index if not exists quotations_revision_unique_idx
  on public.quotations(
    coalesce(root_quotation_id, id),
    revision_number
  );
create unique index if not exists quotations_supersedes_unique_idx
  on public.quotations(supersedes_quotation_id)
  where supersedes_quotation_id is not null;
create index if not exists quotations_client_id_idx
  on public.quotations(client_id);
create index if not exists quotations_status_idx
  on public.quotations(status);
create index if not exists quotations_assigned_to_idx
  on public.quotations(assigned_to);
create index if not exists quotations_created_by_idx
  on public.quotations(created_by);
create index if not exists quotations_updated_by_idx
  on public.quotations(updated_by);
create index if not exists quotations_issue_date_idx
  on public.quotations(issue_date desc);
create index if not exists quotations_expiry_date_idx
  on public.quotations(expiry_date);
create index if not exists quotations_created_at_idx
  on public.quotations(created_at desc);
create unique index if not exists quotation_items_position_unique_idx
  on public.quotation_items(quotation_id, position);
create index if not exists quotation_items_quotation_id_idx
  on public.quotation_items(quotation_id);

create unique index if not exists invoices_invoice_number_unique_idx
  on public.invoices(invoice_number)
  where invoice_number is not null;
create unique index if not exists invoices_source_quotation_unique_idx
  on public.invoices(source_quotation_id)
  where source_quotation_id is not null;
create index if not exists invoices_client_id_idx
  on public.invoices(client_id);
create index if not exists invoices_status_idx
  on public.invoices(status);
create index if not exists invoices_created_by_idx
  on public.invoices(created_by);
create index if not exists invoices_updated_by_idx
  on public.invoices(updated_by);
create index if not exists invoices_issued_by_idx
  on public.invoices(issued_by);
create index if not exists invoices_issue_date_idx
  on public.invoices(issue_date desc);
create index if not exists invoices_due_date_idx
  on public.invoices(due_date);
create index if not exists invoices_created_at_idx
  on public.invoices(created_at desc);
create unique index if not exists invoice_items_position_unique_idx
  on public.invoice_items(invoice_id, position);
create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items(invoice_id);

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

drop trigger if exists quotation_items_set_updated_at
  on public.quotation_items;
create trigger quotation_items_set_updated_at
  before update on public.quotation_items
  for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists invoice_items_set_updated_at on public.invoice_items;
create trigger invoice_items_set_updated_at
  before update on public.invoice_items
  for each row execute function public.set_updated_at();

create or replace function app_private.next_document_counter(
  requested_counter_key text
)
returns bigint
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  next_value bigint;
begin
  if requested_counter_key not in ('quotation', 'invoice') then
    raise exception 'Unsupported document counter'
      using errcode = '22023';
  end if;

  update app_private.document_counters
  set last_value = last_value + 1,
      updated_at = now()
  where counter_key = requested_counter_key
  returning last_value into next_value;

  if next_value is null then
    raise exception 'Document counter is not configured'
      using errcode = 'P0002';
  end if;

  return next_value;
end;
$$;

revoke all on function app_private.next_document_counter(text)
  from public, anon, authenticated;

create or replace function app_private.format_document_number(
  document_prefix text,
  counter_value bigint
)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select upper(trim(document_prefix))
    || '-'
    || lpad(counter_value::text, 6, '0')
$$;

revoke all on function app_private.format_document_number(text, bigint)
  from public, anon, authenticated;

create or replace function app_private.calculate_document_line(
  line_quantity numeric,
  line_unit_price numeric,
  line_discount_type public.discount_type,
  line_discount_value numeric
)
returns table (
  calculated_line_subtotal numeric(20,2),
  calculated_discount_total numeric(20,2),
  calculated_line_total numeric(20,2)
)
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  raw_subtotal numeric;
  raw_discount numeric;
  rounded_line_total numeric(20,2);
begin
  if line_quantity <= 0 then
    raise exception 'Line quantity must be greater than zero'
      using errcode = '22023';
  end if;

  if line_unit_price < 0 or line_discount_value < 0 then
    raise exception 'Line financial values cannot be negative'
      using errcode = '22023';
  end if;

  if line_discount_type = 'percentage' and line_discount_value > 100 then
    raise exception 'Line percentage discount cannot exceed 100'
      using errcode = '22023';
  end if;

  raw_subtotal := line_quantity * line_unit_price;
  raw_discount := case line_discount_type
    when 'none' then 0
    when 'percentage' then raw_subtotal * line_discount_value / 100
    when 'fixed' then line_discount_value
  end;

  if raw_discount > raw_subtotal then
    raise exception 'Line discount cannot exceed the line subtotal'
      using errcode = '22023';
  end if;

  rounded_line_total := round(raw_subtotal - raw_discount, 2);

  calculated_line_subtotal := round(raw_subtotal, 2);
  calculated_discount_total :=
    round(calculated_line_subtotal - rounded_line_total, 2);
  calculated_line_total := rounded_line_total;
  return next;
end;
$$;

revoke all on function app_private.calculate_document_line(
  numeric, numeric, public.discount_type, numeric
) from public, anon, authenticated;

create or replace function app_private.calculate_document_totals(
  document_items jsonb,
  document_discount_type public.discount_type,
  document_discount_value numeric,
  document_tax_mode public.document_tax_mode,
  document_tax_rate numeric
)
returns table (
  calculated_subtotal numeric(20,2),
  calculated_discount_total numeric(20,2),
  calculated_taxable_subtotal numeric(20,2),
  calculated_tax_total numeric(20,2),
  calculated_grand_total numeric(20,2)
)
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  line_values record;
  taxable_before_discount numeric(20,2) := 0;
  non_taxable_before_discount numeric(20,2) := 0;
  taxable_discount_share numeric(20,2) := 0;
  minimum_taxable_share numeric(20,2) := 0;
  net_after_document_discount numeric(20,2);
begin
  if jsonb_typeof(document_items) <> 'array'
    or jsonb_array_length(document_items) = 0 then
    raise exception 'At least one line item is required'
      using errcode = '22023';
  end if;

  if document_discount_value < 0 or document_tax_rate < 0 then
    raise exception 'Document financial values cannot be negative'
      using errcode = '22023';
  end if;

  if document_discount_type = 'percentage'
    and document_discount_value > 100 then
    raise exception 'Document percentage discount cannot exceed 100'
      using errcode = '22023';
  end if;

  calculated_subtotal := 0;

  for item in
    select value from jsonb_array_elements(document_items)
  loop
    select *
    into line_values
    from app_private.calculate_document_line(
      (item->>'quantity')::numeric,
      (item->>'unit_price')::numeric,
      coalesce(
        nullif(item->>'discount_type', ''),
        'none'
      )::public.discount_type,
      coalesce(nullif(item->>'discount_value', ''), '0')::numeric
    );

    calculated_subtotal :=
      calculated_subtotal + line_values.calculated_line_total;

    if coalesce((item->>'tax_applicable')::boolean, true) then
      taxable_before_discount :=
        taxable_before_discount + line_values.calculated_line_total;
    else
      non_taxable_before_discount :=
        non_taxable_before_discount + line_values.calculated_line_total;
    end if;
  end loop;

  calculated_discount_total := case document_discount_type
    when 'none' then 0
    when 'percentage' then
      round(calculated_subtotal * document_discount_value / 100, 2)
    when 'fixed' then round(document_discount_value, 2)
  end;

  if calculated_discount_total > calculated_subtotal then
    raise exception 'Document discount cannot exceed the subtotal'
      using errcode = '22023';
  end if;

  if calculated_subtotal > 0 then
    taxable_discount_share := round(
      calculated_discount_total
        * taxable_before_discount
        / calculated_subtotal,
      2
    );
    minimum_taxable_share := greatest(
      0,
      calculated_discount_total - non_taxable_before_discount
    );
    taxable_discount_share := greatest(
      minimum_taxable_share,
      least(taxable_before_discount, taxable_discount_share)
    );
  end if;

  calculated_taxable_subtotal :=
    round(taxable_before_discount - taxable_discount_share, 2);

  calculated_tax_total := case
    when document_tax_rate = 0 then 0
    when document_tax_mode = 'exclusive' then
      round(calculated_taxable_subtotal * document_tax_rate / 100, 2)
    else
      round(
        calculated_taxable_subtotal
          * document_tax_rate
          / (100 + document_tax_rate),
        2
      )
  end;

  net_after_document_discount :=
    round(calculated_subtotal - calculated_discount_total, 2);

  calculated_grand_total := case
    when document_tax_mode = 'exclusive' then
      round(net_after_document_discount + calculated_tax_total, 2)
    else net_after_document_discount
  end;

  return next;
end;
$$;

revoke all on function app_private.calculate_document_totals(
  jsonb,
  public.discount_type,
  numeric,
  public.document_tax_mode,
  numeric
) from public, anon, authenticated;

create or replace function app_private.enforce_quotation_immutability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Quotations cannot be deleted'
      using errcode = '42501';
  end if;

  if old.status <> 'draft' and row(
    old.quote_number,
    old.root_quotation_id,
    old.supersedes_quotation_id,
    old.revision_number,
    old.client_id,
    old.client_snapshot,
    old.company_snapshot,
    old.snapshot_version,
    old.snapshot_frozen_at,
    old.currency,
    old.issue_date,
    old.expiry_date,
    old.subject,
    old.introduction,
    old.notes,
    old.terms_conditions,
    old.subtotal,
    old.discount_type,
    old.discount_value,
    old.discount_total,
    old.taxable_subtotal,
    old.tax_mode,
    old.tax_rate,
    old.tax_label,
    old.tax_total,
    old.grand_total,
    old.assigned_to,
    old.created_by
  ) is distinct from row(
    new.quote_number,
    new.root_quotation_id,
    new.supersedes_quotation_id,
    new.revision_number,
    new.client_id,
    new.client_snapshot,
    new.company_snapshot,
    new.snapshot_version,
    new.snapshot_frozen_at,
    new.currency,
    new.issue_date,
    new.expiry_date,
    new.subject,
    new.introduction,
    new.notes,
    new.terms_conditions,
    new.subtotal,
    new.discount_type,
    new.discount_value,
    new.discount_total,
    new.taxable_subtotal,
    new.tax_mode,
    new.tax_rate,
    new.tax_label,
    new.tax_total,
    new.grand_total,
    new.assigned_to,
    new.created_by
  ) then
    raise exception 'Sent quotation content is immutable; create a revision'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_quotation_immutability()
  from public, anon, authenticated;

drop trigger if exists quotations_enforce_immutability
  on public.quotations;
create trigger quotations_enforce_immutability
  before update or delete on public.quotations
  for each row execute function app_private.enforce_quotation_immutability();

create or replace function app_private.enforce_quotation_item_mutability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent_id uuid;
  parent_status public.quotation_status;
begin
  parent_id := case
    when tg_op = 'DELETE' then old.quotation_id
    else new.quotation_id
  end;

  select q.status
  into parent_status
  from public.quotations q
  where q.id = parent_id;

  if parent_status is null then
    raise exception 'Quotation not found'
      using errcode = 'P0002';
  end if;

  if parent_status <> 'draft' then
    raise exception 'Sent quotation line items are immutable'
      using errcode = '55000';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function app_private.enforce_quotation_item_mutability()
  from public, anon, authenticated;

drop trigger if exists quotation_items_enforce_mutability
  on public.quotation_items;
create trigger quotation_items_enforce_mutability
  before insert or update or delete on public.quotation_items
  for each row
  execute function app_private.enforce_quotation_item_mutability();

create or replace function app_private.enforce_invoice_immutability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Invoices cannot be deleted'
      using errcode = '42501';
  end if;

  if old.status <> 'draft' and row(
    old.invoice_number,
    old.client_id,
    old.source_quotation_id,
    old.client_snapshot,
    old.company_snapshot,
    old.snapshot_version,
    old.snapshot_frozen_at,
    old.currency,
    old.issue_date,
    old.due_date,
    old.subject,
    old.notes,
    old.terms_conditions,
    old.subtotal,
    old.discount_type,
    old.discount_value,
    old.discount_total,
    old.taxable_subtotal,
    old.tax_mode,
    old.tax_rate,
    old.tax_label,
    old.tax_total,
    old.grand_total,
    old.amount_paid,
    old.balance_due,
    old.created_by,
    old.issued_by,
    old.issued_at
  ) is distinct from row(
    new.invoice_number,
    new.client_id,
    new.source_quotation_id,
    new.client_snapshot,
    new.company_snapshot,
    new.snapshot_version,
    new.snapshot_frozen_at,
    new.currency,
    new.issue_date,
    new.due_date,
    new.subject,
    new.notes,
    new.terms_conditions,
    new.subtotal,
    new.discount_type,
    new.discount_value,
    new.discount_total,
    new.taxable_subtotal,
    new.tax_mode,
    new.tax_rate,
    new.tax_label,
    new.tax_total,
    new.grand_total,
    new.amount_paid,
    new.balance_due,
    new.created_by,
    new.issued_by,
    new.issued_at
  ) then
    raise exception 'Issued invoice content is immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_invoice_immutability()
  from public, anon, authenticated;

drop trigger if exists invoices_enforce_immutability
  on public.invoices;
create trigger invoices_enforce_immutability
  before update or delete on public.invoices
  for each row execute function app_private.enforce_invoice_immutability();

create or replace function app_private.enforce_invoice_item_mutability()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent_id uuid;
  parent_status public.invoice_status;
begin
  parent_id := case
    when tg_op = 'DELETE' then old.invoice_id
    else new.invoice_id
  end;

  select i.status
  into parent_status
  from public.invoices i
  where i.id = parent_id;

  if parent_status is null then
    raise exception 'Invoice not found'
      using errcode = 'P0002';
  end if;

  if parent_status <> 'draft' then
    raise exception 'Issued invoice line items are immutable'
      using errcode = '55000';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function app_private.enforce_invoice_item_mutability()
  from public, anon, authenticated;

drop trigger if exists invoice_items_enforce_mutability
  on public.invoice_items;
create trigger invoice_items_enforce_mutability
  before insert or update or delete on public.invoice_items
  for each row execute function app_private.enforce_invoice_item_mutability();

alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

revoke all on public.quotations from public, anon, authenticated;
revoke all on public.quotation_items from public, anon, authenticated;
revoke all on public.invoices from public, anon, authenticated;
revoke all on public.invoice_items from public, anon, authenticated;
