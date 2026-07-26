create or replace function public.record_payment(
  target_invoice_id uuid, new_amount numeric, new_payment_date date, new_payment_method text,
  new_currency text, new_other_method_description text default null, new_external_reference text default null,
  new_notes text default null
) returns jsonb language plpgsql volatile security definer set search_path = public, app_private, pg_temp as $$
declare actor_id uuid := auth.uid(); inv public.invoices; payment_row public.payments; receipt_row public.receipts; paid numeric; next_num bigint; settings public.company_settings; client_snapshot jsonb; company_snapshot jsonb;
begin
  perform app_private.require_active_role(array['administrator','accountant']::public.app_role[]);
  if new_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
  if new_payment_date > current_date then raise exception 'Payment date cannot be in the future'; end if;
  select * into inv from public.invoices where id=target_invoice_id for update;
  if inv.id is null or inv.status <> 'issued' then raise exception 'Only issued invoices may receive payments'; end if;
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
