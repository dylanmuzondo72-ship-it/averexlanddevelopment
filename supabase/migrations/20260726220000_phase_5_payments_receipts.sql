do $$ begin
  create type public.payment_state as enum ('unpaid', 'partially_paid', 'paid');
exception when duplicate_object then null; end $$;

alter table public.company_settings
  add column if not exists payment_prefix text not null default 'AVX-PAY';

alter table public.invoices
  drop constraint if exists invoices_phase_4_amount_paid_zero,
  drop constraint if exists invoices_balance_matches_phase_4_total;

alter table public.invoices
  add column if not exists payment_state public.payment_state not null default 'unpaid';

alter table public.invoices
  add constraint invoices_payment_totals_valid check (
    amount_paid >= 0 and balance_due >= 0 and amount_paid <= grand_total
  );

alter table app_private.document_counters
  drop constraint if exists document_counters_key_valid;
alter table app_private.document_counters
  add constraint document_counters_key_valid check (
    counter_key in ('quotation', 'invoice', 'payment', 'receipt')
  );

insert into app_private.document_counters (counter_key, last_value)
values ('payment', 0), ('receipt', 0)
on conflict (counter_key) do nothing;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_reference text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  currency text not null,
  payment_date date not null,
  amount numeric(20,2) not null,
  payment_method text not null check (payment_method in ('cash','bank_transfer','ecocash','card','cheque','other')),
  other_method_description text,
  external_reference text,
  notes text,
  status text not null default 'active' check (status in ('active','reversed')),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  reversed_by uuid references public.profiles(id) on delete restrict,
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (currency = upper(currency) and currency ~ '^[A-Z]{3}$'),
  check (amount > 0),
  check (payment_method <> 'other' or char_length(trim(coalesce(other_method_description,''))) >= 2),
  check (status = 'active' or (reversed_at is not null and char_length(trim(coalesce(reversal_reason,''))) >= 3))
);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  allocated_amount numeric(20,2) not null check (allocated_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  payment_id uuid not null unique references public.payments(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  currency text not null,
  client_snapshot jsonb not null,
  company_snapshot jsonb not null,
  allocation_snapshot jsonb not null,
  payment_amount numeric(20,2) not null,
  payment_method text not null,
  external_reference text,
  payment_date date not null,
  invoice_total numeric(20,2) not null,
  total_paid_after numeric(20,2) not null,
  remaining_balance numeric(20,2) not null,
  status text not null default 'active' check (status in ('active','reversed')),
  issued_by uuid not null references public.profiles(id) on delete restrict,
  issued_at timestamptz not null default now(),
  reversed_at timestamptz,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(client_snapshot) = 'object'),
  check (jsonb_typeof(company_snapshot) = 'object'),
  check (jsonb_typeof(allocation_snapshot) = 'array')
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

create index if not exists payments_client_idx on public.payments(client_id);
create index if not exists payments_date_idx on public.payments(payment_date desc);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payment_allocations_invoice_idx on public.payment_allocations(invoice_id);
create index if not exists receipts_client_idx on public.receipts(client_id);
create index if not exists receipts_date_idx on public.receipts(payment_date desc);
create index if not exists payment_proofs_payment_idx on public.payment_proofs(payment_id);

create or replace function app_private.next_document_counter(requested_counter_key text)
returns bigint language plpgsql volatile security definer set search_path = public, app_private, pg_temp as $$
declare next_value bigint;
begin
  if requested_counter_key not in ('quotation','invoice','payment','receipt') then raise exception 'Unsupported document counter'; end if;
  update app_private.document_counters set last_value = last_value + 1 where counter_key = requested_counter_key returning last_value into next_value;
  if next_value is null then raise exception 'Document counter is not configured'; end if;
  return next_value;
end $$;

create or replace function app_private.refresh_invoice_payment_state(target_invoice_id uuid)
returns public.invoices language plpgsql volatile security definer set search_path = public, app_private, pg_temp as $$
declare inv public.invoices; paid numeric(20,2); state public.payment_state;
begin
  select * into inv from public.invoices where id = target_invoice_id for update;
  if inv.id is null then raise exception 'Invoice not found'; end if;
  select coalesce(sum(pa.allocated_amount),0) into paid
  from public.payment_allocations pa join public.payments p on p.id=pa.payment_id
  where pa.invoice_id=target_invoice_id and p.status='active';
  if paid > inv.grand_total then raise exception 'Active payments exceed invoice total'; end if;
  state := case when paid=0 then 'unpaid' when paid=inv.grand_total then 'paid' else 'partially_paid' end;
  update public.invoices set amount_paid=paid, balance_due=inv.grand_total-paid, payment_state=state, updated_at=now() where id=target_invoice_id returning * into inv;
  return inv;
end $$;

create or replace function public.record_payment(
  target_invoice_id uuid, new_amount numeric, new_payment_date date, new_payment_method text,
  new_currency text, new_other_method_description text default null, new_external_reference text default null,
  new_notes text default null
) returns jsonb language plpgsql volatile security definer set search_path = public, app_private, pg_temp as $$
declare actor_id uuid := auth.uid(); actor_role public.app_role; inv public.invoices; payment_row public.payments; receipt_row public.receipts; paid numeric; next_num bigint; settings public.company_settings; client_snapshot jsonb; company_snapshot jsonb;
begin
  actor_role := app_private.require_active_role(array['administrator','accountant']::public.app_role[]);
  if new_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
  if new_payment_date > current_date then raise exception 'Payment date cannot be in the future'; end if;
  select * into inv from public.invoices where id=target_invoice_id for update;
  if inv.id is null or inv.status not in ('issued') then raise exception 'Only issued invoices may receive payments'; end if;
  if upper(new_currency) <> inv.currency then raise exception 'Payment currency must match invoice currency'; end if;
  select coalesce(sum(pa.allocated_amount),0) into paid from public.payment_allocations pa join public.payments p on p.id=pa.payment_id where pa.invoice_id=inv.id and p.status='active';
  if paid + new_amount > inv.grand_total then raise exception 'Payment exceeds the outstanding balance'; end if;
  select * into settings from public.company_settings order by created_at limit 1;
  client_snapshot := app_private.capture_client_snapshot(inv.client_id); company_snapshot := app_private.capture_company_snapshot();
  next_num := app_private.next_document_counter('payment');
  insert into public.payments(payment_reference,client_id,currency,payment_date,amount,payment_method,other_method_description,external_reference,notes,recorded_by) values (app_private.format_document_number(settings.payment_prefix,next_num),inv.client_id,inv.currency,new_payment_date,new_amount,new_payment_method,new_other_method_description,new_external_reference,new_notes,actor_id) returning * into payment_row;
  insert into public.payment_allocations(payment_id,invoice_id,allocated_amount) values(payment_row.id,inv.id,new_amount);
  select * into inv from app_private.refresh_invoice_payment_state(inv.id);
  next_num := app_private.next_document_counter('receipt');
  insert into public.receipts(receipt_number,payment_id,client_id,currency,client_snapshot,company_snapshot,allocation_snapshot,payment_amount,payment_method,external_reference,payment_date,invoice_total,total_paid_after,remaining_balance,issued_by) values(app_private.format_document_number(settings.receipt_prefix,next_num),payment_row.id,inv.client_id,inv.currency,client_snapshot,company_snapshot,jsonb_build_array(jsonb_build_object('invoice_id',inv.id,'invoice_number',inv.invoice_number,'allocated_amount',new_amount)),new_amount,new_payment_method,new_external_reference,new_payment_date,inv.grand_total,inv.amount_paid,inv.balance_due,actor_id) returning * into receipt_row;
  perform app_private.write_activity('payment_recorded','payment',payment_row.id,'Payment recorded',jsonb_build_object('invoice_id',inv.id,'receipt_id',receipt_row.id,'amount',new_amount));
  perform app_private.write_activity('receipt_issued','receipt',receipt_row.id,'Receipt issued',jsonb_build_object('payment_id',payment_row.id));
  return jsonb_build_object('payment',to_jsonb(payment_row),'receipt',to_jsonb(receipt_row),'invoice',to_jsonb(inv));
end $$;

create or replace function public.reverse_payment(target_payment_id uuid, reason text)
returns jsonb language plpgsql volatile security definer set search_path = public, app_private, pg_temp as $$
declare actor_id uuid := auth.uid(); actor_role public.app_role; p public.payments; a public.payment_allocations; r public.receipts; inv public.invoices;
begin
  actor_role := app_private.require_active_role(array['administrator','accountant']::public.app_role[]);
  if char_length(trim(reason)) < 3 then raise exception 'A reversal reason is required'; end if;
  select * into p from public.payments where id=target_payment_id for update;
  if p.id is null then raise exception 'Payment not found'; end if;
  if p.status <> 'active' then raise exception 'Payment has already been reversed'; end if;
  select * into a from public.payment_allocations where payment_id=p.id for update;
  select * into r from public.receipts where payment_id=p.id for update;
  update public.payments set status='reversed', reversed_by=actor_id, reversed_at=now(), reversal_reason=trim(reason), updated_at=now() where id=p.id returning * into p;
  select * into inv from app_private.refresh_invoice_payment_state(a.invoice_id);
  update public.receipts set status='reversed', reversed_at=now() where id=r.id returning * into r;
  perform app_private.write_activity('payment_reversed','payment',p.id,'Payment reversed',jsonb_build_object('reason',reason,'invoice_id',a.invoice_id));
  return jsonb_build_object('payment',to_jsonb(p),'receipt',to_jsonb(r),'invoice',to_jsonb(inv));
end $$;

create or replace function app_private.prevent_paid_invoice_cancellation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status='cancelled' and exists(select 1 from public.payment_allocations pa join public.payments p on p.id=pa.payment_id where pa.invoice_id=old.id and p.status='active') then raise exception 'Reverse all active payments before cancelling this invoice'; end if;
  return new;
end $$;
drop trigger if exists invoices_prevent_paid_cancellation on public.invoices;
create trigger invoices_prevent_paid_cancellation before update on public.invoices for each row execute function app_private.prevent_paid_invoice_cancellation();

create or replace function app_private.prevent_payment_mutation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$ begin raise exception 'Payments and allocations are immutable; use the reversal workflow'; end $$;
drop trigger if exists payment_allocations_immutable on public.payment_allocations;
create trigger payment_allocations_immutable before update or delete on public.payment_allocations for each row execute function app_private.prevent_payment_mutation();

alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.receipts enable row level security;
alter table public.payment_proofs enable row level security;

create policy payments_select_permitted on public.payments for select to authenticated using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role in ('administrator','accountant'))
  or exists(select 1 from public.clients c join public.payment_allocations pa on pa.payment_id=payments.id join public.invoices i on i.id=pa.invoice_id where c.id=payments.client_id and (c.assigned_to=auth.uid() or c.created_by=auth.uid()))
);
create policy allocations_select_permitted on public.payment_allocations for select to authenticated using (exists(select 1 from public.payments p where p.id=payment_id));
create policy receipts_select_permitted on public.receipts for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role in ('administrator','accountant','viewer')) or exists(select 1 from public.clients c where c.id=client_id and (c.assigned_to=auth.uid() or c.created_by=auth.uid())));
create policy proofs_select_permitted on public.payment_proofs for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.status='active' and p.role in ('administrator','accountant')));
revoke all on public.payments, public.payment_allocations, public.receipts, public.payment_proofs from anon, authenticated;
grant select on public.payments, public.payment_allocations, public.receipts, public.payment_proofs to authenticated;
grant execute on function public.record_payment(uuid,numeric,date,text,text,text,text,text) to authenticated;
grant execute on function public.reverse_payment(uuid,text) to authenticated;
