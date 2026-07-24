import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { requireRoles } from "@/lib/dashboard/access";
import {
  allowedActions,
  allowedResources,
  parseActivityFilters,
  type ActivityFilters,
} from "@/lib/dashboard/activity-validation";
import {
  formatDateTime,
  getPageCount,
  titleCase,
} from "@/lib/dashboard/format";

const pageSize = 20;

function toStartOfDay(value: string) {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function toNextDay(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function buildActivityHref(filters: ActivityFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.action) params.set("action", filters.action);
  if (filters.resource) params.set("resource", filters.resource);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/dashboard/activity${query ? `?${query}` : ""}`;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseActivityFilters(params);
  const { profile, supabase } = await requireRoles([
    "administrator",
    "accountant",
  ]);
  const { data: activity, error } = await supabase.rpc(
    "search_activity_logs",
    {
      ...(filters.search ? { search_term: filters.search } : {}),
      ...(filters.action ? { action_filter: filters.action } : {}),
      ...(filters.resource ? { resource_filter: filters.resource } : {}),
      ...(filters.dateFrom
        ? { date_from: toStartOfDay(filters.dateFrom) }
        : {}),
      ...(filters.dateTo ? { date_to: toNextDay(filters.dateTo) } : {}),
      page_size: pageSize,
      page_offset: (filters.page - 1) * pageSize,
    },
  );
  const total = activity?.[0]?.total_count || 0;
  const totalPages = getPageCount(total, pageSize);

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Audit trail"
        title="Activity"
        description={
          profile.role === "administrator"
            ? "Review safe operational events across Phase 3 records."
            : "Review relevant client and company-settings activity."
        }
      />

      <form className="dashboard-panel dashboard-filter-form" method="get">
        <label className="dashboard-field">
          <span>Actor or activity</span>
          <input
            type="search"
            name="q"
            defaultValue={filters.search}
            placeholder="Actor, action or summary"
          />
        </label>
        <label className="dashboard-field">
          <span>Action</span>
          <select name="action" defaultValue={filters.action}>
            <option value="">All actions</option>
            {allowedActions.map((action) => (
              <option value={action} key={action}>
                {titleCase(action)}
              </option>
            ))}
          </select>
        </label>
        <label className="dashboard-field">
          <span>Resource</span>
          <select name="resource" defaultValue={filters.resource}>
            <option value="">All resources</option>
            {allowedResources
              .filter(
                (resource) =>
                  profile.role === "administrator" || resource !== "profile",
              )
              .map((resource) => (
                <option value={resource} key={resource}>
                  {titleCase(resource)}
                </option>
              ))}
          </select>
        </label>
        <label className="dashboard-field">
          <span>From</span>
          <input type="date" name="from" defaultValue={filters.dateFrom} />
        </label>
        <label className="dashboard-field">
          <span>To</span>
          <input type="date" name="to" defaultValue={filters.dateTo} />
        </label>
        <button className="dashboard-button dashboard-button-secondary" type="submit">
          Apply
        </button>
      </form>

      {error && (
        <p className="dashboard-notice dashboard-notice-error" role="alert">
          Activity records could not be loaded.
        </p>
      )}

      {activity && activity.length > 0 ? (
        <>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Summary</th>
                  <th>Resource</th>
                  <th>Date</th>
                  {profile.role === "administrator" && <th>Metadata</th>}
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Action">{titleCase(item.action)}</td>
                    <td data-label="Actor">{item.actor_name}</td>
                    <td data-label="Summary">{item.summary}</td>
                    <td data-label="Resource">
                      {titleCase(item.resource_type)}
                    </td>
                    <td data-label="Date">{formatDateTime(item.created_at)}</td>
                    {profile.role === "administrator" && (
                      <td data-label="Metadata">
                        <details>
                          <summary>View safe metadata</summary>
                          <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                        </details>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={Math.min(filters.page, totalPages)}
            totalPages={totalPages}
            buildHref={(page) => buildActivityHref(filters, page)}
          />
        </>
      ) : (
        <section className="dashboard-empty-state">
          <p className="dashboard-eyebrow">No activity</p>
          <h2>No activity matches these filters.</h2>
          <p>Recorded Phase 3 events will appear here when available.</p>
        </section>
      )}
    </div>
  );
}
