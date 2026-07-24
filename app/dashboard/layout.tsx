import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { companySettings } from "@/lib/company";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const dashboardSections = [
  "Clients",
  "Quotes",
  "Invoices",
  "Payments",
  "Projects",
  "Land",
  "Reports",
  "Settings",
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="dashboard-shell" aria-label="Averex staff dashboard">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/dashboard">
          <img src={companySettings.assets.logo} alt={companySettings.name} />
          <span>Business System</span>
        </Link>
        <nav className="dashboard-nav" aria-label="Dashboard sections">
          <Link href="/dashboard" aria-current="page">
            Overview
          </Link>
          {dashboardSections.map((section) => (
            <span key={section} aria-disabled="true">
              {section}
            </span>
          ))}
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">STAFF PORTAL</p>
            <h1>Averex Business System</h1>
            <p>
              Signed in as {profile?.full_name || user.email}. Role:{" "}
              {profile?.role || "pending profile"}.
            </p>
          </div>
          <form action={signOutAction}>
            <button className="btn btn-secondary" type="submit">
              Logout
            </button>
          </form>
        </header>
        {children}
      </div>
    </section>
  );
}
