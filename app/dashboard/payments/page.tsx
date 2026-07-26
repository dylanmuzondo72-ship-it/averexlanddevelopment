import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/dashboard/document-format";

export default async function PaymentsPage() {
  const { supabase } = await requireDashboardUser();
  const { data: payments } = await supabase.from("payments").select("*, receipts(receipt_number), invoices:payment_allocations(invoice_id, invoices(invoice_number))").order("payment_date", { ascending: false }).limit(50);
  return <div className="dashboard-content"><PageHeader eyebrow="Payments" title="Payments received" description="Operational payment records linked to issued invoices." actions={<Link className="dashboard-button dashboard-button-primary" href="/dashboard/payments/new">Record payment</Link>} />
    <section className="dashboard-panel"><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{payments?.map((payment) => <tr key={payment.id}><td><Link href={`/dashboard/payments/${payment.id}`}>{payment.payment_reference}</Link></td><td>{formatDateTime(payment.payment_date)}</td><td>{titleCase(payment.payment_method)}</td><td>{formatMoney(payment.amount, payment.currency)}</td><td>{titleCase(payment.status)}</td><td>{Array.isArray(payment.receipts) ? payment.receipts[0]?.receipt_number || "-" : "-"}</td></tr>)}</tbody></table></div>{(!payments || payments.length === 0) && <p className="dashboard-empty-copy">No payments have been recorded.</p>}</section>
  </div>;
}
