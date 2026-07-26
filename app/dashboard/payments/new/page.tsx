import Link from "next/link";
import { recordPaymentAction } from "@/app/dashboard/payments/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireRoles } from "@/lib/dashboard/access";

export default async function NewPaymentPage() {
  const { supabase } = await requireRoles(["administrator", "accountant"]);
  const { data: invoices } = await supabase.from("invoices").select("id, invoice_number, subject, currency, grand_total, amount_paid, balance_due").eq("status", "issued").gt("balance_due", 0).order("issue_date", { ascending: false });
  return <div className="dashboard-content"><PageHeader eyebrow="Payments" title="Record payment" description="Only issued invoices with an outstanding balance are eligible." actions={<Link className="dashboard-button dashboard-button-secondary" href="/dashboard/payments">Back to payments</Link>} />
    <section className="dashboard-panel"><form className="dashboard-form" action={recordPaymentAction}><label>Invoice<select name="invoiceId" required defaultValue=""><option value="" disabled>Select an invoice</option>{invoices?.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number || "Invoice"} - {invoice.subject} ({invoice.currency} {invoice.balance_due})</option>)}</select></label><label>Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label>Payment date<input name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></label><label>Currency<input name="currency" value="USD" readOnly /></label><label>Payment method<select name="paymentMethod" defaultValue="bank_transfer"><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="ecocash">EcoCash</option><option value="card">Card</option><option value="cheque">Cheque</option><option value="other">Other</option></select></label><label>External reference<input name="externalReference" /></label><label>Notes<textarea name="notes" rows={4} /></label><button className="dashboard-button dashboard-button-primary" type="submit">Record payment and issue receipt</button></form></section>
  </div>;
}
