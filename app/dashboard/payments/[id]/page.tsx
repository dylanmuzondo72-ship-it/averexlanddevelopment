import Link from "next/link";
import { notFound } from "next/navigation";
import { reversePaymentAction } from "@/app/dashboard/payments/actions";
import { Notice } from "@/components/dashboard/Notice";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/dashboard/document-format";

export default async function PaymentDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params; const notices = await searchParams; const { supabase, profile } = await requireDashboardUser();
  const { data: payment } = await supabase.from("payments").select("*, receipts(*), payment_allocations(*, invoices(invoice_number, grand_total, amount_paid, balance_due))").eq("id", id).maybeSingle();
  if (!payment) notFound(); const receipt = Array.isArray(payment.receipts) ? payment.receipts[0] : null; const allocation = Array.isArray(payment.payment_allocations) ? payment.payment_allocations[0] : null; const canReverse = (profile.role === "administrator" || profile.role === "accountant") && payment.status === "active";
  return <div className="dashboard-content"><PageHeader eyebrow={payment.payment_reference} title="Payment details" description={titleCase(payment.status)} actions={<>{receipt && <Link className="dashboard-button dashboard-button-secondary" href={`/dashboard/receipts/${receipt.id}/print`}>Print / Save as PDF</Link>}<Link className="dashboard-button dashboard-button-secondary" href="/dashboard/payments">Back to payments</Link></>} /><Notice message={notices.message} /><Notice message={notices.error} tone="error" /><section className="dashboard-panel"><dl className="dashboard-details-grid"><div className="dashboard-detail"><dt>Amount</dt><dd>{formatMoney(payment.amount,payment.currency)}</dd></div><div className="dashboard-detail"><dt>Method</dt><dd>{titleCase(payment.payment_method)}</dd></div><div className="dashboard-detail"><dt>Date</dt><dd>{formatDateTime(payment.payment_date)}</dd></div><div className="dashboard-detail"><dt>Invoice</dt><dd>{allocation?.invoices?.invoice_number || "-"}</dd></div><div className="dashboard-detail"><dt>Receipt</dt><dd>{receipt?.receipt_number || "-"}</dd></div></dl></section>{canReverse && <section className="dashboard-panel"><h2>Reverse payment</h2><p>This preserves the payment and receipt while recalculating the invoice balance.</p><form className="dashboard-form" action={reversePaymentAction}><input type="hidden" name="paymentId" value={payment.id} /><label>Reason<input name="reason" minLength={3} required /></label><button className="dashboard-button dashboard-button-danger" type="submit">Reverse payment</button></form></section>}</div>;
}
