import Link from "next/link";
import { companySettings } from "@/lib/company";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <img src={companySettings.assets.logo} alt={companySettings.name} />
          <p>
            Professional land, planning and development support focused on
            informed decisions, organised implementation and stronger long-term
            value.
          </p>
        </div>
        <div>
          <h3>Services</h3>
          <Link href="/services#surveying-mapping">Land Surveying</Link>
          <Link href="/services#town-planning">Town Planning</Link>
          <Link href="/services#construction-infrastructure">Construction</Link>
          <Link href="/services#land-property">Property Services</Link>
        </div>
        <div>
          <h3>Contact</h3>
          <a href={companySettings.phones.primary.href}>
            {companySettings.phones.primary.display}
          </a>
          <a href={companySettings.phones.alternative.href}>
            {companySettings.phones.alternative.display}
          </a>
          <a href={companySettings.emails.primary.href}>
            {companySettings.emails.primary.display}
          </a>
          <a href={companySettings.emails.alternative.href}>
            {companySettings.emails.alternative.display}
          </a>
          <Link className="staff-login-link" href="/login">
            Staff Login
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Averex Land Solutions. All rights reserved.</span>
        <span>{companySettings.slogan}</span>
      </div>
    </footer>
  );
}
