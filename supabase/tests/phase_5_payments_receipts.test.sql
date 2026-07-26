do $$
declare
  counter_keys text[];
begin
  if not (select rowsecurity from pg_tables where schemaname='public' and tablename='payments') then raise exception 'Payment RLS is not enabled'; end if;
  if not (select rowsecurity from pg_tables where schemaname='public' and tablename='receipts') then raise exception 'Receipt RLS is not enabled'; end if;
  if not (select rowsecurity from pg_tables where schemaname='public' and tablename='payment_allocations') then raise exception 'Allocation RLS is not enabled'; end if;
  select array_agg(counter_key order by counter_key) into counter_keys from app_private.document_counters;
  if counter_keys <> array['invoice','payment','quotation','receipt']::text[] then raise exception 'Payment and receipt counters are not configured'; end if;
  if not exists (select 1 from pg_constraint where conrelid='public.payment_allocations'::regclass and contype='f') then raise exception 'Allocation relationships are missing'; end if;
  raise notice 'Phase 5 payment and receipt foundation tests passed';
end $$;
