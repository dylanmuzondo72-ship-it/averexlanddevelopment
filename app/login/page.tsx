import type { Metadata } from "next";
import Link from "next/link";
import { companySettings } from "@/lib/company";

export const metadata: Metadata = {
  title: "Staff Portal",
  description: "Secure Averex staff portal placeholder.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <section className="login-placeholder">
      <div className="login-panel">
        <img src={companySettings.assets.logo} alt={companySettings.name} />
        <p className="eyebrow">STAFF ACCESS</p>
        <h1>Secure login will be enabled in Phase 2.</h1>
        <p>
          The public website is live first. Supabase Authentication, protected
          dashboard routes, password reset and role-based access control begin in
          the next phase.
        </p>
        <Link className="btn btn-secondary" href="/">
          Return to Public Site
        </Link>
      </div>
    </section>
  );
}
