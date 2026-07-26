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
  state := (case when paid=0 then 'unpaid' when paid=inv.grand_total then 'paid' else 'partially_paid' end)::public.payment_state;
  update public.invoices set amount_paid=paid, balance_due=inv.grand_total-paid, payment_state=state, updated_at=now() where id=target_invoice_id returning * into inv;
  return inv;
end $$;
