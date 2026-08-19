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
    old.invoice_number, old.client_id, old.source_quotation_id,
    old.client_snapshot, old.company_snapshot, old.snapshot_version,
    old.snapshot_frozen_at, old.currency, old.issue_date, old.due_date,
    old.subject, old.notes, old.terms_conditions, old.subtotal,
    old.discount_type, old.discount_value, old.discount_total,
    old.taxable_subtotal, old.tax_mode, old.tax_rate, old.tax_label,
    old.tax_total, old.grand_total, old.created_by, old.issued_by, old.issued_at
  ) is distinct from row(
    new.invoice_number, new.client_id, new.source_quotation_id,
    new.client_snapshot, new.company_snapshot, new.snapshot_version,
    new.snapshot_frozen_at, new.currency, new.issue_date, new.due_date,
    new.subject, new.notes, new.terms_conditions, new.subtotal,
    new.discount_type, new.discount_value, new.discount_total,
    new.taxable_subtotal, new.tax_mode, new.tax_rate, new.tax_label,
    new.tax_total, new.grand_total, new.created_by, new.issued_by, new.issued_at
  ) then
    raise exception 'Issued invoice content is immutable'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_invoice_immutability()
  from public, anon, authenticated;
