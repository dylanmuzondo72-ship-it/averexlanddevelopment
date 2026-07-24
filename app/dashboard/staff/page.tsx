import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pagination } from "@/components/dashboard/Pagination";
import { StaffProfileForm } from "@/components/dashboard/staff/StaffProfileForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { requireRoles } from "@/lib/dashboard/access";
import { formatDateTime, getPageCount } from "@/lib/dashboard/format";
import { appRoles, roleLabels } from "@/lib/dashboard/permissions";
import {
  parseStaffFilters,
  type StaffFilters,
} from "@/lib/dashboard/staff-validation";

const pageSize = 12;

function buildStaffHref(filters: StaffFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.role) params.set("role", filters.role);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/dashboard/staff${query ? `?${query}` : ""}`;
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseStaffFilters(params);
  const { profile: currentProfile, supabase } = await requireRoles([
    "administrator",
  ]);
  const { data: profiles, error } = await supabase.rpc(
    "search_staff_profiles",
    {
      ...(filters.search ? { search_term: filters.search } : {}),
      ...(filters.role ? { role_filter: filters.role } : {}),
      ...(filters.status ? { status_filter: filters.status } : {}),
      page_size: pageSize,
      page_offset: (filters.page - 1) * pageSize,
    },
  );
  const total = profiles?.[0]?.total_count || 0;
  const totalPages = getPageCount(total, pageSize);

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Administrator"
        title="Staff profiles"
        description="Manage existing Supabase-linked staff profiles. Authentication emails and passwords remain read-only."
      />

      <form className="dashboard-panel dashboard-filter-form" method="get">
        <label className="dashboard-field">
          <span>Search</span>
          <input
            type="search"
            name="q"
            defaultValue={filters.search}
            placeholder="Name or email"
          />
        </label>
        <label className="dashboard-field">
          <span>Role</span>
          <select name="role" defaultValue={filters.role || ""}>
            <option value="">All roles</option>
            {appRoles.map((role) => (
              <option value={role} key={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="dashboard-field">
          <span>Status</span>
          <select name="status" defaultValue={filters.status || ""}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button className="dashboard-button dashboard-button-secondary" type="submit">
          Apply
        </button>
      </form>

      {error && (
        <p className="dashboard-notice dashboard-notice-error" role="alert">
          Staff profiles could not be loaded.
        </p>
      )}

      {profiles && profiles.length > 0 ? (
        <>
          <div className="dashboard-staff-list">
            {profiles.map((profile) => (
              <section className="dashboard-panel" key={profile.id}>
                <div className="dashboard-panel-header">
                  <div>
                    <p className="dashboard-eyebrow">{roleLabels[profile.role]}</p>
                    <h2>{profile.full_name || profile.email}</h2>
                    <p className="dashboard-panel-subtitle">
                      Last seen: {formatDateTime(profile.last_seen_at)}
                    </p>
                  </div>
                  <StatusBadge status={profile.status} />
                </div>
                <StaffProfileForm
                  profile={{
                    id: profile.id,
                    email: profile.email,
                    fullName: profile.full_name || "",
                    phone: profile.phone || "",
                    role: profile.role,
                    status: profile.status,
                  }}
                  currentProfileId={currentProfile.id}
                />
              </section>
            ))}
          </div>
          <Pagination
            currentPage={Math.min(filters.page, totalPages)}
            totalPages={totalPages}
            buildHref={(page) => buildStaffHref(filters, page)}
          />
        </>
      ) : (
        <section className="dashboard-empty-state">
          <p className="dashboard-eyebrow">No profiles</p>
          <h2>No staff profiles match these filters.</h2>
          <p>
            New authentication users continue to be created manually through
            Supabase during Phase 3.
          </p>
        </section>
      )}
    </div>
  );
}
