import Link from "next/link";
import { Notice } from "@/components/dashboard/Notice";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { requireDashboardUser } from "@/lib/dashboard/access";
import {
  parseClientFilters,
  type ClientFilters,
} from "@/lib/dashboard/client-validation";
import { formatDate, getPageCount, titleCase } from "@/lib/dashboard/format";
import { canCreateClients } from "@/lib/dashboard/permissions";

const pageSize = 20;

function buildClientListHref(filters: ClientFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/dashboard/clients${query ? `?${query}` : ""}`;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      message?: string;
      error?: string;
    }
  >;
}) {
  const params = await searchParams;
  const filters = parseClientFilters(params);
  const { profile, supabase } = await requireDashboardUser();

  const { data: clients, error } = await supabase.rpc("search_clients", {
    ...(filters.search ? { search_term: filters.search } : {}),
    ...(filters.status ? { status_filter: filters.status } : {}),
    ...(filters.type ? { type_filter: filters.type } : {}),
    sort_order: filters.sort,
    page_size: pageSize,
    page_offset: (filters.page - 1) * pageSize,
  });

  const total = clients?.[0]?.total_count || 0;
  const totalPages = getPageCount(total, pageSize);
  const currentPage = Math.min(filters.page, totalPages);

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Client management"
        title="Clients"
        description="Manage verified client contact and business details without deleting historical records."
        actions={
          canCreateClients(profile.role) ? (
            <Link
              className="dashboard-button dashboard-button-primary"
              href="/dashboard/clients/new"
            >
              Add client
            </Link>
          ) : undefined
        }
      />

      <Notice
        message={typeof params.message === "string" ? params.message : undefined}
      />
      <Notice
        message={typeof params.error === "string" ? params.error : undefined}
        tone="error"
      />
      {error && (
        <Notice
          message="Client records could not be loaded. Try again."
          tone="error"
        />
      )}

      <form className="dashboard-panel dashboard-filter-form" method="get">
        <label className="dashboard-field">
          <span>Search</span>
          <input
            name="q"
            type="search"
            defaultValue={filters.search}
            placeholder="Name, reference, email or phone"
          />
        </label>
        <label className="dashboard-field">
          <span>Status</span>
          <select name="status" defaultValue={filters.status || ""}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="dashboard-field">
          <span>Type</span>
          <select name="type" defaultValue={filters.type || ""}>
            <option value="">All types</option>
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </select>
        </label>
        <label className="dashboard-field">
          <span>Sort</span>
          <select name="sort" defaultValue={filters.sort}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </label>
        <button className="dashboard-button dashboard-button-secondary" type="submit">
          Apply
        </button>
      </form>

      {clients && clients.length > 0 ? (
        <>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td data-label="Client">
                      <div className="dashboard-table-primary">
                        <strong>{client.display_name}</strong>
                        <span>{client.client_reference}</span>
                      </div>
                    </td>
                    <td data-label="Type">{titleCase(client.client_type)}</td>
                    <td data-label="Contact">
                      <div className="dashboard-table-primary">
                        <strong>{client.phone}</strong>
                        <span>{client.email || "No email"}</span>
                      </div>
                    </td>
                    <td data-label="Assigned">
                      {client.assigned_name || "Unassigned"}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={client.status} />
                    </td>
                    <td data-label="Created">{formatDate(client.created_at)}</td>
                    <td data-label="Actions">
                      <div className="dashboard-table-actions">
                        <Link href={`/dashboard/clients/${client.id}`}>View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={(page) => buildClientListHref(filters, page)}
          />
        </>
      ) : (
        <section className="dashboard-empty-state">
          <p className="dashboard-eyebrow">No matching clients</p>
          <h2>
            {filters.search || filters.status || filters.type
              ? "No clients match these filters."
              : "No client records have been created."}
          </h2>
          <p>
            Adjust the filters or create the first client when verified client
            information is available.
          </p>
          {canCreateClients(profile.role) && (
            <Link
              className="dashboard-button dashboard-button-primary"
              href="/dashboard/clients/new"
            >
              Add client
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
