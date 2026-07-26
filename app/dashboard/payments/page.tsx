import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/dashboard/document-format";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; method?: string; page?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireDashboardUser();
  const page = Math.max(1, Number(params.page || "1"));
  const query = params.q?.trim().toLowerCase() || "";
  const { data: rawPayments } = await supabase.from("payments").select("*, receipts(receipt_number), payment_allocations(invoice_id, invoices(invoice_number, subject))").order("payment_date", { ascending: false }).limit(200);
  const payments = (rawPayments || []).filter((payment) => {
    const receipt = Array.isArray(payment.receipts) ? payment.receipts[0]?.receipt_number || "" : "";
    const allocation = Array.isArray(payment.payment_allocations) ? payment.payment_allocations[0] : null;
    const invoice = allocation?.invoices?.invoice_number || "";
    return (!query || [payment.payment_reference, payment.external_reference || "", receipt, invoice].some((value) => value.toLowerCase().includes(query))) && (!params.status || payment.status === params.status) && (!params.method || payment.payment_method === params.method);
  });
  const pageRows = payments.slice((page - 1) * 20, page * 20);
  return <div className="dashboard-content"><PageHeader eyebrow="Payments" title="Payments received" description="Operational payment records linked to issued invoices." actions={<Link className="dashboard-button dashboard-button-primary" href="/dashboard/payments/new">Record payment</Link>} />
    <form className="dashboard-panel dashboard-filter-form" method="get"><label>Search<input name="q" defaultValue={params.q} placeholder="Payment, receipt, invoice or reference" /></label><label>Status<select name="status" defaultValue={params.status || ""}><option value="">All statuses</option><option value="active">Active</option><option value="reversed">Reversed</option></select></label><label>Method<select name="method" defaultValue={params.method || ""}><option value="">All methods</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="ecocash">EcoCash</option><option value="card">Card</option><option value="cheque">Cheque</option><option value="other">Other</option></select></label><button className="dashboard-button dashboard-button-secondary" type="submit">Filter</button></form>
    <section className="dashboard-panel"><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{pageRows.map((payment) => <tr key={payment.id}><td><Link href={`/dashboard/payments/${payment.id}`}>{payment.payment_reference}</Link></td><td>{formatDateTime(payment.payment_date)}</td><td>{titleCase(payment.payment_method)}</td><td>{formatMoney(payment.amount, payment.currency)}</td><td>{titleCase(payment.status)}</td><td>{Array.isArray(payment.receipts) ? payment.receipts[0]?.receipt_number || "-" : "-"}</td></tr>)}</tbody></table></div>{pageRows.length === 0 && <p className="dashboard-empty-copy">No payments match the selected filters.</p>}<p className="dashboard-field-hint">Page {page} of {Math.max(1, Math.ceil(payments.length / 20))} · {payments.length} matching payments</p></section>
  </div>;
}
