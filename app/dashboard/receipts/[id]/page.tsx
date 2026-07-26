import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";

export default async function ReceiptDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireDashboardUser();
  const { data: receipt } = await supabase.from("receipts").select("*").eq("id", id).maybeSingle();
  if (!receipt) notFound();
  const client = receipt.client_snapshot && typeof receipt.client_snapshot === "object" && !Array.isArray(receipt.client_snapshot) ? receipt.client_snapshot as Record<string, unknown> : {};
  const allocation = Array.isArray(receipt.allocation_snapshot) ? receipt.allocation_snapshot[0] as Record<string, unknown> | undefined : undefined;
  return <div className="dashboard-content"><PageHeader eyebrow={receipt.receipt_number} title="Receipt" description="Immutable payment receipt" actions={<Link className="dashboard-button dashboard-button-primary" href={`/dashboard/receipts/${id}/print`}>Print / Save as PDF</Link>} /><section className="dashboard-panel"><dl className="dashboard-details-grid"><div className="dashboard-detail"><dt>Client</dt><dd>{String(client.display_name || client.company_name || "Client")}</dd></div><div className="dashboard-detail"><dt>Invoice</dt><dd>{String(allocation?.invoice_number || "-")}</dd></div><div className="dashboard-detail"><dt>Payment reference</dt><dd>{receipt.payment_id}</dd></div><div className="dashboard-detail"><dt>Amount</dt><dd>{receipt.currency} {receipt.payment_amount.toFixed(2)}</dd></div><div className="dashboard-detail"><dt>Payment method</dt><dd>{receipt.payment_method}</dd></div><div className="dashboard-detail"><dt>Payment date</dt><dd>{receipt.payment_date}</dd></div><div className="dashboard-detail"><dt>External reference</dt><dd>{receipt.external_reference || "-"}</dd></div><div className="dashboard-detail"><dt>Invoice total</dt><dd>{receipt.currency} {receipt.invoice_total.toFixed(2)}</dd></div><div className="dashboard-detail"><dt>Total paid after payment</dt><dd>{receipt.currency} {receipt.total_paid_after.toFixed(2)}</dd></div><div className="dashboard-detail"><dt>Remaining balance</dt><dd>{receipt.currency} {receipt.remaining_balance.toFixed(2)}</dd></div><div className="dashboard-detail"><dt>Status</dt><dd>{receipt.status}</dd></div></dl></section></div>;
}
