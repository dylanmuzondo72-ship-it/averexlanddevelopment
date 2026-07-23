import type { Metadata } from "next";
import { serviceGroups, getServiceEnquiryUrl } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore Averex Land Solutions services across surveying coordination, mapping, town planning, applications, drawings, construction, property advisory and project management.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="page-hero compact">
        <div className="container">
          <p className="eyebrow">SERVICES</p>
          <h1>Land, planning, property and development services</h1>
          <p>
            Averex provides practical guidance and coordinates qualified
            professionals where a project requires regulated surveying, planning,
            architectural, engineering or construction input.
          </p>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container service-group-list">
          {serviceGroups.map((group) => (
            <article className="service-group" id={group.id} key={group.id}>
              <div className="service-group-heading">
                <img src={group.image} alt={`${group.label} service visual`} loading="lazy" />
                <div>
                  <p className="eyebrow">{group.label}</p>
                  <h2>{group.label}</h2>
                </div>
              </div>
              <div className="service-detail-grid">
                {group.services.map((service) => (
                  <div className="service-detail" key={service.title}>
                    <h3>{service.title}</h3>
                    <p>{service.explanation}</p>
                    <dl>
                      <div>
                        <dt>Typical client</dt>
                        <dd>{service.typicalClient}</dd>
                      </div>
                      <div>
                        <dt>Expected process</dt>
                        <dd>{service.process}</dd>
                      </div>
                      <div>
                        <dt>Required client information</dt>
                        <dd>{service.requiredInformation}</dd>
                      </div>
                    </dl>
                    <a
                      className="btn btn-primary"
                      href={getServiceEnquiryUrl(service.title)}
                      target="_blank"
                      rel="noopener"
                    >
                      Enquire on WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
