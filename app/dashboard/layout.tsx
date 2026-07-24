import type { Metadata } from "next";
import { signOutAction } from "@/app/auth/actions";
import { DashboardNavigation } from "@/components/dashboard/DashboardNavigation";
import { requireDashboardUser } from "@/lib/dashboard/access";
import { roleLabels } from "@/lib/dashboard/permissions";
import "./dashboard.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireDashboardUser();

  return (
    <section className="dashboard-shell" aria-label="Averex staff dashboard">
      <DashboardNavigation role={profile.role} />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-user-summary">
            <span className="dashboard-avatar" aria-hidden="true">
              {(profile.full_name || user.email || "A").charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{profile.full_name || user.email}</strong>
              <span>{roleLabels[profile.role]}</span>
            </div>
          </div>
          <form action={signOutAction}>
            <button className="dashboard-button dashboard-button-secondary" type="submit">
              Logout
            </button>
          </form>
        </header>
        {children}
      </div>
    </section>
  );
}
