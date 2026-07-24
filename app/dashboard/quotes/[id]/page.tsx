import Link from "next/link";
import { notFound } from "next/navigation";
import {
  convertQuotationAction,
  createQuotationRevisionAction,
  refreshQuotationSnapshotsAction,
  transitionQuotationAction,
} from "@/app/dashboard/quotes/actions";
import { DocumentPreview } from "@/components/dashboard/documents/DocumentPreview";
import { PrintButton } from "@/components/dashboard/documents/PrintButton";
import { Notice } from "@/components/dashboard/Notice";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import { formatMoney } from "@/lib/dashboard/document-format";
import { canManageQuotations } from "@/lib/dashboard/permissions";

export default async function QuotationDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const { profile, supabase } = await requireDashboardUser();
  const [{ data: quotation }, { data: items }, { data: activity }] = await Promise.all([
    supabase.from("quotations").select("*").eq("id", id).maybeSingle(),
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("position"),
    profile.role === "viewer"
      ? Promise.resolve({ data: [], error: null })
      : supabase.rpc("get_document_activity", { document_kind: "quotation", target_document_id: id, result_limit: 50 }),
  ]);
  if (!quotation || !items) notFound();

  const mayManage = canManageQuotations(profile.role);
  const mayEdit = mayManage && quotation.status === "draft";
  const mayConvert = (profile.role === "administrator" || profile.role === "accountant") && quotation.status === "accepted";

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow={quotation.quote_number}
        title={quotation.subject}
        description={titleCase(quotation.status) + " quotation for " + (typeof quotation.client_snapshot === "object" && quotation.client_snapshot && !Array.isArray(quotation.client_snapshot) && typeof quotation.client_snapshot.display_name === "string" ? quotation.client_snapshot.display_name : "the selected client")}
        actions={
          <>
            <Link className="dashboard-button dashboard-button-secondary" href="/dashboard/quotes">Back to quotations</Link>
            <Link className="dashboard-button dashboard-button-secondary" href={"/dashboard/quotes/" + quotation.id + "/print"}>Open printable view</Link>
            <PrintButton />
            {mayEdit && <Link className="dashboard-button dashboard-button-primary" href={"/dashboard/quotes/" + quotation.id + "/edit"}>Edit draft</Link>}
          </>
        }
      />
      <Notice message={notices.message} />
      <Notice message={notices.error} tone="error" />

      <section className="dashboard-document-meta-grid">
        <div className="dashboard-panel">
          <p className="dashboard-eyebrow">Status</p>
          <span className={"document-status-badge document-status-" + quotation.status}>{titleCase(quotation.status)}</span>
          <dl className="dashboard-details-grid">
            <div className="dashboard-detail"><dt>Issued</dt><dd>{formatDateTime(quotation.issue_date)}</dd></div>
            <div className="dashboard-detail"><dt>Expires</dt><dd>{formatDateTime(quotation.expiry_date)}</dd></div>
            <div className="dashboard-detail"><dt>Revision</dt><dd>{quotation.revision_number}</dd></div>
            <div className="dashboard-detail"><dt>Snapshot version</dt><dd>{quotation.snapshot_version}</dd></div>
            <div className="dashboard-detail"><dt>Last updated</dt><dd>{formatDateTime(quotation.updated_at)}</dd></div>
            <div className="dashboard-detail"><dt>Lock version</dt><dd>{quotation.lock_version}</dd></div>
          </dl>
        </div>
        <div className="dashboard-panel">
          <p className="dashboard-eyebrow">Authoritative total</p>
          <strong className="dashboard-large-total">{formatMoney(quotation.grand_total, quotation.currency)}</strong>
          <dl className="dashboard-details-grid">
            <div className="dashboard-detail"><dt>Subtotal</dt><dd>{formatMoney(quotation.subtotal, quotation.currency)}</dd></div>
            <div className="dashboard-detail"><dt>Discount</dt><dd>{formatMoney(quotation.discount_total, quotation.currency)}</dd></div>
            <div className="dashboard-detail"><dt>Tax</dt><dd>{formatMoney(quotation.tax_total, quotation.currency)}</dd></div>
          </dl>
        </div>
      </section>

      {mayManage && quotation.status === "draft" && (
        <section className="dashboard-action-strip">
          <form className="dashboard-confirm-inline" action={transitionQuotationAction}>
            <input type="hidden" name="quotationId" value={quotation.id} />
            <input type="hidden" name="lockVersion" value={quotation.lock_version} />
            <input type="hidden" name="status" value="sent" />
            <label><input type="checkbox" name="confirmed" value="yes" required /> Confirm ready to send</label>
            <button className="dashboard-button dashboard-button-primary" type="submit">Mark sent</button>
          </form>
          <form className="dashboard-confirm-inline" action={refreshQuotationSnapshotsAction}>
            <input type="hidden" name="quotationId" value={quotation.id} />
            <input type="hidden" name="lockVersion" value={quotation.lock_version} />
            <label><input type="checkbox" name="confirmed" value="yes" required /> Refresh draft snapshots</label>
            <button className="dashboard-button dashboard-button-secondary" type="submit">Refresh details</button>
          </form>
        </section>
      )}

      {mayManage && quotation.status === "sent" && (
        <section className="dashboard-action-strip">
          {(["accepted", "rejected"] as const).map((status) => (
            <form className="dashboard-confirm-inline" action={transitionQuotationAction} key={status}>
              <input type="hidden" name="quotationId" value={quotation.id} />
              <input type="hidden" name="lockVersion" value={quotation.lock_version} />
              <input type="hidden" name="status" value={status} />
              <label><input type="checkbox" name="confirmed" value="yes" required /> Confirm outcome</label>
              <button className="dashboard-button dashboard-button-secondary" type="submit">{status === "accepted" ? "Mark accepted" : "Mark rejected"}</button>
            </form>
          ))}
          {profile.role === "administrator" && (
            <form className="dashboard-confirm-inline" action={transitionQuotationAction}>
              <input type="hidden" name="quotationId" value={quotation.id} />
              <input type="hidden" name="lockVersion" value={quotation.lock_version} />
              <input type="hidden" name="status" value="cancelled" />
              <input name="cancellationReason" placeholder="Cancellation reason" required minLength={3} />
              <label><input type="checkbox" name="confirmed" value="yes" required /> Confirm cancellation</label>
              <button className="dashboard-button dashboard-button-danger" type="submit">Cancel quotation</button>
            </form>
          )}
        </section>
      )}

      {mayManage && quotation.status === "accepted" && (
        <section className="dashboard-action-strip">
          {mayConvert && (
            <form className="dashboard-confirm-inline" action={convertQuotationAction}>
              <input type="hidden" name="quotationId" value={quotation.id} />
              <input type="hidden" name="lockVersion" value={quotation.lock_version} />
              <label><input type="checkbox" name="confirmed" value="yes" required /> Create one linked draft invoice</label>
              <button className="dashboard-button dashboard-button-primary" type="submit">Convert to invoice</button>
            </form>
          )}
          {profile.role === "administrator" && (
            <form className="dashboard-confirm-inline" action={createQuotationRevisionAction}>
              <input type="hidden" name="quotationId" value={quotation.id} />
              <input type="hidden" name="lockVersion" value={quotation.lock_version} />
              <label><input type="checkbox" name="confirmed" value="yes" required /> Create editable revision</label>
              <button className="dashboard-button dashboard-button-secondary" type="submit">Create revision</button>
            </form>
          )}
        </section>
      )}

      {profile.role === "administrator" && quotation.status === "sent" && (
        <section className="dashboard-panel dashboard-status-control">
          <form className="dashboard-confirm" action={createQuotationRevisionAction}>
            <input type="hidden" name="quotationId" value={quotation.id} />
            <input type="hidden" name="lockVersion" value={quotation.lock_version} />
            <label><input type="checkbox" name="confirmed" value="yes" required /> I confirm the sent quotation needs a revision.</label>
            <button className="dashboard-button dashboard-button-secondary" type="submit">Create revision</button>
          </form>
        </section>
      )}

      <section className="dashboard-panel dashboard-document-preview-panel">
        <div className="dashboard-panel-header"><div><p className="dashboard-eyebrow">Branded document</p><h2>Quotation preview</h2></div></div>
        <DocumentPreview kind="quotation" document={quotation} items={items} />
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header"><h2>Quotation activity</h2></div>
        {activity && activity.length > 0 ? (
          <ul className="dashboard-activity-list">{activity.map((item) => <li key={item.id}><strong>{titleCase(item.action)}</strong><span>{item.summary} by {item.actor_name}</span><time dateTime={item.created_at}>{formatDateTime(item.created_at)}</time></li>)}</ul>
        ) : <p className="dashboard-empty-copy">No quotation activity is available yet.</p>}
      </section>
    </div>
  );
}
