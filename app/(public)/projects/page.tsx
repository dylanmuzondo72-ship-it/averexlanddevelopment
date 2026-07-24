import type { Metadata } from "next";
import { companySettings } from "@/lib/company";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Representative Averex Land Solutions service scenarios for land development, due diligence, infrastructure and project-management work.",
};

const scenarios = [
  {
    tag: "LAND DEVELOPMENT",
    title: "Subdivision and development planning support",
    image: companySettings.assets.heroLand,
    text: "Averex can coordinate survey, planning, layout and authority-facing inputs for a land-development opportunity.",
  },
  {
    tag: "TRANSACTION SUPPORT",
    title: "Pre-acquisition due diligence",
    image: companySettings.assets.dueDiligence,
    text: "Clients can use Averex to organise document checks, ownership-verification support and professional referrals before committing funds.",
  },
  {
    tag: "CONSTRUCTION COORDINATION",
    title: "Road, building and infrastructure monitoring",
    image: companySettings.assets.infrastructure,
    text: "Averex can help coordinate contractors, consultants, progress reporting and issue follow-up for development delivery.",
  },
];

export default function ProjectsPage() {
  return (
    <>
      <section className="page-hero compact">
        <div className="container">
          <p className="eyebrow">PROJECTS</p>
          <h1>Representative service scenarios</h1>
          <p>
            These examples show the type of project support Averex can provide.
            They are not presented as completed Averex projects until verified
            project records and photographs are supplied.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container expertise-grid">
          {scenarios.map((scenario) => (
            <article className="expertise-card" key={scenario.title}>
              <img src={scenario.image} alt={scenario.title} loading="lazy" />
              <div>
                <p className="tag">{scenario.tag}</p>
                <h3>{scenario.title}</h3>
                <p>{scenario.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
