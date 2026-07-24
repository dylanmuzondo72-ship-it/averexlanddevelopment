import Link from "next/link";
import { notFound } from "next/navigation";
import { setClientArchivedAction } from "@/app/dashboard/clients/actions";
import { Notice } from "@/components/dashboard/Notice";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime, titleCase } from "@/lib/dashboard/format";
import {
  canArchiveClients,
  canEditClients,
} from "@/lib/dashboard/permissions";

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="dashboard-detail">
      <dt>{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}

export default async function ClientDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const { profile, supabase } = await requireDashboardUser();
  const [{ data: clientRows, error }, { data: activity }] = await Promise.all([
    supabase.rpc("get_client_details", { target_client_id: id }),
    supabase.rpc("get_client_activity", {
      target_client_id: id,
      result_limit: 20,
    }),
  ]);
  const client = clientRows?.[0];

  if (error || !client) {
    notFound();
  }

  const mayEdit =
    canEditClients(profile.role) &&
    (profile.role === "administrator" || client.status === "active");
  const mayArchive = canArchiveClients(profile.role);

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow={client.client_reference}
        title={client.display_name}
        description={`${titleCase(client.client_type)} client record`}
        actions={
          <>
            <Link
              className="dashboard-button dashboard-button-secondary"
              href="/dashboard/clients"
            >
              Back to clients
            </Link>
            {mayEdit && (
              <Link
                className="dashboard-button dashboard-button-primary"
                href={`/dashboard/clients/${client.id}/edit`}
              >
                Edit client
              </Link>
            )}
          </>
        }
      />

      <Notice message={notices.message} />
      <Notice message={notices.error} tone="error" />

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h2>Client information</h2>
          <StatusBadge status={client.status} />
        </div>
        <dl className="dashboard-details-grid">
          <Detail label="Reference" value={client.client_reference} />
          <Detail label="Client type" value={titleCase(client.client_type)} />
          <Detail label="Company" value={client.company_name} />
          <Detail label="Contact person" value={client.contact_person} />
          <Detail label="Primary phone" value={client.phone} />
          <Detail label="Alternative phone" value={client.alternative_phone} />
          <Detail label="Email" value={client.email} />
          <Detail label="Tax number" value={client.tax_number} />
          <Detail label="Physical address" value={client.physical_address} />
          <Detail label="Billing address" value={client.billing_address} />
          <Detail label="Assigned staff" value={client.assigned_name} />
          <Detail label="Created by" value={client.created_by_name} />
          <Detail label="Created" value={formatDateTime(client.created_at)} />
          <Detail label="Last updated" value={formatDateTime(client.updated_at)} />
          <Detail label="Updated by" value={client.updated_by_name} />
          {client.archived_at && (
            <Detail label="Archived" value={formatDateTime(client.archived_at)} />
          )}
        </dl>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h2>Internal notes</h2>
        </div>
        <p className="dashboard-record-notes">
          {client.notes || "No internal notes have been added."}
        </p>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h2>Client activity</h2>
        </div>
        {activity && activity.length > 0 ? (
          <ul className="dashboard-activity-list">
            {activity.map((item) => (
              <li key={item.id}>
                <strong>{titleCase(item.action)}</strong>
                <span>
                  {item.summary} by {item.actor_name}
                </span>
                <time dateTime={item.created_at}>
                  {formatDateTime(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-copy">
            No client activity is available yet.
          </p>
        )}
      </section>

      {mayArchive && (
        <section className="dashboard-panel dashboard-status-control">
          <div>
            <p className="dashboard-eyebrow">Record status</p>
            <h2>{client.status === "active" ? "Archive client" : "Restore client"}</h2>
            <p>
              {client.status === "active"
                ? "Archived clients remain available for history and can be restored."
                : "Restoring makes this client active for operational work again."}
            </p>
          </div>
          <form className="dashboard-confirm" action={setClientArchivedAction}>
            <input type="hidden" name="clientId" value={client.id} />
            <input
              type="hidden"
              name="operation"
              value={client.status === "active" ? "archive" : "restore"}
            />
            <label>
              <input type="checkbox" name="confirmed" value="yes" required />
              I confirm this client status change.
            </label>
            <button
              className={
                client.status === "active"
                  ? "dashboard-button dashboard-button-danger"
                  : "dashboard-button dashboard-button-secondary"
              }
              type="submit"
            >
              {client.status === "active" ? "Archive client" : "Restore client"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
