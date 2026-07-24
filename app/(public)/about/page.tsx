import type { Metadata } from "next";
import Link from "next/link";
import { companySettings } from "@/lib/company";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Averex Land Solutions, a Zimbabwean land, property and development-services company led by CEO B. Mungofa.",
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">ABOUT AVEREX</p>
            <h1>Integrated guidance for land, planning and development decisions</h1>
            <p>
              Averex Land Solutions helps clients move from uncertainty to a
              better-organised property process, connecting documents, site
              information, professional input and implementation steps.
            </p>
            <Link className="btn btn-primary" href="/contact">
              Talk to Averex
            </Link>
          </div>
          <img
            src={companySettings.assets.advisory}
            alt="Averex advisory meeting for land and property planning"
            loading="eager"
          />
        </div>
      </section>
      <section className="section">
        <div className="container split-grid">
          <div className="section-copy">
            <p className="eyebrow">LEADERSHIP</p>
            <h2>Clear accountability and practical coordination</h2>
            <p>
              The company is led by Chief Executive Officer {companySettings.ceoName}.
              Its public role is to support clients with land and property
              advisory, due diligence, ownership-verification support, planning
              coordination and development management.
            </p>
            <p>
              Averex coordinates qualified professionals across surveying,
              planning, architecture, engineering and construction according to
              the requirements of each project.
            </p>
          </div>
          <div className="values-panel">
            <h3>{companySettings.slogan}</h3>
            <p>
              The slogan reflects a practical operating principle: land value is
              protected and improved through evidence, proper planning, clear
              records and disciplined project execution.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
