import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cancelInvoiceAction,
  issueInvoiceAction,
  refreshInvoiceSnapshotsAction,
} from "@/app/dashboard/invoices/actions";
import { DocumentPreview } from "@/components/dashboard/documents/DocumentPreview";
import { PrintButton } from "@/components/dashboard/documents/PrintButton";
import { Notice } from "@/components/dashboard/Notice";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/dashboard/document-format";

export default async function InvoiceDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const { profile, supabase } = await requireDashboardUser();
  const [{ data: invoice }, { data: items }, { data: activity }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
    profile.role === "administrator" || profile.role === "accountant"
      ? supabase.rpc("get_document_activity", { document_kind: "invoice", target_document_id: id, result_limit: 50 })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (!invoice || !items) notFound();

  const mayManage = profile.role === "administrator" || profile.role === "accountant";
  const clientName =
    invoice.client_snapshot &&
    typeof invoice.client_snapshot === "object" &&
    !Array.isArray(invoice.client_snapshot) &&
    typeof invoice.client_snapshot.display_name === "string"
      ? invoice.client_snapshot.display_name
      : "the selected client";

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow={invoice.invoice_number || "Draft invoice"}
        title={invoice.subject}
        description={titleCase(invoice.status) + " invoice for " + clientName}
        actions={
          <>
            <Link className="dashboard-button dashboard-button-secondary" href="/dashboard/invoices">Back to invoices</Link>
            <Link className="dashboard-button dashboard-button-secondary" href={"/dashboard/invoices/" + invoice.id + "/print"}>Open printable view</Link>
            <PrintButton />
            {mayManage && invoice.status === "draft" && <Link className="dashboard-button dashboard-button-primary" href={"/dashboard/invoices/" + invoice.id + "/edit"}>Edit draft</Link>}
          </>
        }
      />
      <Notice message={notices.message} />
      <Notice message={notices.error} tone="error" />

      <section className="dashboard-document-meta-grid">
        <div className="dashboard-panel">
          <p className="dashboard-eyebrow">Status</p>
          <span className={"document-status-badge document-status-" + invoice.status}>{titleCase(invoice.status)}</span>
          <dl className="dashboard-details-grid">
            <div className="dashboard-detail"><dt>Issued</dt><dd>{formatDateTime(invoice.issue_date)}</dd></div>
            <div className="dashboard-detail"><dt>Due</dt><dd>{formatDateTime(invoice.due_date)}</dd></div>
            <div className="dashboard-detail"><dt>Source quotation</dt><dd>{invoice.source_quotation_id ? <Link href={"/dashboard/quotes/" + invoice.source_quotation_id}>Open quotation</Link> : "Direct invoice"}</dd></div>
            <div className="dashboard-detail"><dt>Snapshot version</dt><dd>{invoice.snapshot_version}</dd></div>
            <div className="dashboard-detail"><dt>Last updated</dt><dd>{formatDateTime(invoice.updated_at)}</dd></div>
            <div className="dashboard-detail"><dt>Lock version</dt><dd>{invoice.lock_version}</dd></div>
          </dl>
        </div>
        <div className="dashboard-panel">
          <p className="dashboard-eyebrow">Authoritative total</p>
          <strong className="dashboard-large-total">{formatMoney(invoice.grand_total, invoice.currency)}</strong>
          <dl className="dashboard-details-grid">
            <div className="dashboard-detail"><dt>Subtotal</dt><dd>{formatMoney(invoice.subtotal, invoice.currency)}</dd></div>
            <div className="dashboard-detail"><dt>Tax</dt><dd>{formatMoney(invoice.tax_total, invoice.currency)}</dd></div>
            <div className="dashboard-detail"><dt>Amount paid</dt><dd>{formatMoney(invoice.amount_paid, invoice.currency)}</dd></div>
            <div className="dashboard-detail"><dt>Balance due</dt><dd>{formatMoney(invoice.balance_due, invoice.currency)}</dd></div>
          </dl>
        </div>
      </section>

      {mayManage && invoice.status === "draft" && (
        <section className="dashboard-action-strip">
          <form className="dashboard-confirm-inline" action={issueInvoiceAction}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input type="hidden" name="lockVersion" value={invoice.lock_version} />
            <label><input type="checkbox" name="confirmed" value="yes" required /> Confirm final values are ready</label>
            <button className="dashboard-button dashboard-button-primary" type="submit">Issue invoice</button>
          </form>
          <form className="dashboard-confirm-inline" action={refreshInvoiceSnapshotsAction}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input type="hidden" name="lockVersion" value={invoice.lock_version} />
            <label><input type="checkbox" name="confirmed" value="yes" required /> Refresh draft snapshots</label>
            <button className="dashboard-button dashboard-button-secondary" type="submit">Refresh details</button>
          </form>
        </section>
      )}

      {mayManage && invoice.status !== "cancelled" && (
        <section className="dashboard-panel dashboard-status-control">
          <div><p className="dashboard-eyebrow">Record status</p><h2>Cancel invoice</h2><p>Cancellation preserves the document and its activity history.</p></div>
          <form className="dashboard-confirm" action={cancelInvoiceAction}>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <input type="hidden" name="lockVersion" value={invoice.lock_version} />
            <label><span>Reason</span><input name="cancellationReason" minLength={3} required /></label>
            <label><input type="checkbox" name="confirmed" value="yes" required /> I confirm this cancellation.</label>
            <button className="dashboard-button dashboard-button-danger" type="submit">Cancel invoice</button>
          </form>
        </section>
      )}

      <section className="dashboard-panel dashboard-document-preview-panel">
        <div className="dashboard-panel-header"><div><p className="dashboard-eyebrow">Branded document</p><h2>Invoice preview</h2></div></div>
        <DocumentPreview kind="invoice" document={invoice} items={items} />
      </section>

      {(profile.role === "administrator" || profile.role === "accountant") && (
        <section className="dashboard-panel">
          <div className="dashboard-panel-header"><h2>Invoice activity</h2></div>
          {activity && activity.length > 0 ? (
            <ul className="dashboard-activity-list">{activity.map((item) => <li key={item.id}><strong>{titleCase(item.action)}</strong><span>{item.summary} by {item.actor_name}</span><time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time></li>)}</ul>
          ) : <p className="dashboard-empty-copy">No invoice activity is available yet.</p>}
        </section>
      )}
    </div>
  );
}
