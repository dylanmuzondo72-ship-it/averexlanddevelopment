import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { formatDateTime } from "@/lib/dashboard/format";
import { roleLabels } from "@/lib/dashboard/permissions";

export default async function ProfilePage() {
  const { profile } = await requireDashboardUser();

  return (
    <div className="dashboard-content">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Review the staff identity and access role connected to your authenticated account."
      />
      <section className="dashboard-panel">
        <div className="dashboard-panel-header">
          <div>
            <h2>{profile.full_name || profile.email}</h2>
            <p className="dashboard-panel-subtitle">
              {roleLabels[profile.role]}
            </p>
          </div>
          <StatusBadge status={profile.status} />
        </div>
        <dl className="dashboard-details-grid">
          <div className="dashboard-detail">
            <dt>Full name</dt>
            <dd>{profile.full_name || "Not provided"}</dd>
          </div>
          <div className="dashboard-detail">
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div className="dashboard-detail">
            <dt>Phone</dt>
            <dd>{profile.phone || "Not provided"}</dd>
          </div>
          <div className="dashboard-detail">
            <dt>Role</dt>
            <dd>{roleLabels[profile.role]}</dd>
          </div>
          <div className="dashboard-detail">
            <dt>Last seen</dt>
            <dd>{formatDateTime(profile.last_seen_at)}</dd>
          </div>
          <div className="dashboard-detail">
            <dt>Profile created</dt>
            <dd>{formatDateTime(profile.created_at)}</dd>
          </div>
        </dl>
        <p className="dashboard-profile-note">
          Contact an administrator to request a profile-name, phone, role or
          status change. Authentication email and password changes are not
          available from this dashboard.
        </p>
      </section>
    </div>
  );
}
