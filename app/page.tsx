import Link from "next/link";
import { ContactSection } from "@/components/ContactSection";
import { AvailableLandExplorer } from "@/components/AvailableLandExplorer";
import { companySettings } from "@/lib/company";
import { getFeaturedListings, landListingDisclaimer } from "@/lib/land-listings";
import { getSiteUrl } from "@/lib/seo";
import { serviceGroups } from "@/lib/services";
import { publicWhatsAppLinks } from "@/lib/whatsapp";

export default function HomePage() {
  const featuredListings = getFeaturedListings();

  return (
    <>
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy reveal visible">
            <p className="eyebrow">LAND • PROPERTY • DEVELOPMENT</p>
            <h1>
              Make confident property decisions. <span>Enhance your land value.</span>
            </h1>
            <p className="hero-kicker">Integrated Land, Planning and Development Solutions</p>
            <p className="hero-lead">
              Averex Land Solutions supports individuals, businesses and investors
              with land advisory, property due diligence, ownership-verification
              support, town-planning coordination, surveying input and
              development project management.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/contact">
                Book a Consultation
              </Link>
              <Link className="btn btn-secondary" href="/services">
                Explore Services
              </Link>
            </div>
            <div className="hero-points" aria-label="Key service qualities">
              <div>
                <strong>Clear guidance</strong>
                <span>Understand the opportunity, process and risks.</span>
              </div>
              <div>
                <strong>Practical oversight</strong>
                <span>Coordinate professionals and project activities.</span>
              </div>
              <div>
                <strong>Informed decisions</strong>
                <span>Use available records, site information and expert input.</span>
              </div>
            </div>
          </div>
          <div className="hero-visual reveal visible">
            <div className="image-frame">
              <img
                src={companySettings.assets.heroLand}
                alt="Professional photo of a planned land development site with surveyed plots"
                loading="eager"
              />
            </div>
            <div className="floating-card">
              <span className="floating-icon">✓</span>
              <div>
                <strong>Land decisions need evidence</strong>
                <small>Assess first. Commit second.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="service-strip" aria-label="Core services">
        <div className="container strip-grid">
          <span>Land Advisory</span>
          <span>Surveying Support</span>
          <span>Town Planning</span>
          <span>Construction Coordination</span>
          <span>Project Management</span>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container split-grid">
          <div className="visual-stack reveal visible">
            <img
              className="main-visual"
              src={companySettings.assets.advisory}
              alt="Professional land and property consultation meeting"
            />
            <img
              className="small-visual"
              src={companySettings.assets.mapLocation}
              alt="Land planning desk with maps and location analysis tools"
              loading="lazy"
            />
          </div>
          <div className="section-copy reveal visible">
            <p className="eyebrow">ABOUT AVEREX</p>
            <h2>Professional guidance across the property journey</h2>
            <p>
              Averex Land Solutions is a Zimbabwean land, property and
              development-services company helping clients investigate
              opportunities, reduce avoidable risk and coordinate development
              work with greater clarity.
            </p>
            <p>
              Averex coordinates qualified professionals across surveying,
              planning, architecture, engineering and construction according to
              the requirements of each project.
            </p>
            <div className="value-list">
              <div>
                <span>01</span>
                <p>
                  <strong>Evidence before commitment</strong>
                  <br />
                  Review available documents, site context and professional input
                  before major decisions.
                </p>
              </div>
              <div>
                <span>02</span>
                <p>
                  <strong>One coordinated process</strong>
                  <br />
                  Bring technical, administrative and development activities
                  around a clear plan.
                </p>
              </div>
              <div>
                <span>03</span>
                <p>
                  <strong>Value-focused thinking</strong>
                  <br />
                  Approach land as a long-term asset that needs planning,
                  protection and proper management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft" id="services">
        <div className="container">
          <div className="section-heading reveal visible">
            <div>
              <p className="eyebrow">MAIN SERVICES</p>
              <h2>Integrated support built around informed action</h2>
            </div>
            <p>
              From initial land enquiries to development coordination, Averex
              connects practical guidance with the right technical and
              administrative steps.
            </p>
          </div>
          <div className="services-grid">
            {serviceGroups.slice(0, 5).map((group, index) => (
              <article className="service-card reveal visible" key={group.id}>
                <div className="service-image">
                  <img src={group.image} alt={`${group.label} visual`} loading="lazy" />
                </div>
                <div className="service-body">
                  <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{group.label}</h3>
                  <p>{group.services[0].explanation}</p>
                  <ul>
                    {group.services.slice(0, 3).map((service) => (
                      <li key={service.title}>{service.title}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <p className="service-note">
            Legal, valuation, surveying and regulatory work should be completed
            or confirmed by appropriately registered professionals and relevant
            authorities.
          </p>
        </div>
      </section>

      <section className="section" id="available-land">
        <div className="container">
          <div className="section-heading reveal visible">
            <div>
              <p className="eyebrow">FEATURED AVAILABLE LAND</p>
              <h2>Published land opportunities will appear here after verification</h2>
            </div>
            <p>
              The public site is ready for featured residential, commercial and
              development listings once Phase 4 connects approved published data.
            </p>
          </div>
          <AvailableLandExplorer listings={featuredListings} siteUrl={getSiteUrl()} />
          <p className="service-note">{landListingDisclaimer}</p>
        </div>
      </section>

      <section className="section dark-section" id="process">
        <div className="container">
          <div className="section-heading light reveal visible">
            <div>
              <p className="eyebrow">HOW AVEREX WORKS</p>
              <h2>A clear route from enquiry to action</h2>
            </div>
            <p>
              Property work becomes expensive when nobody agrees what is being
              checked, who is responsible, or what happens next. Averex keeps the
              path visible.
            </p>
          </div>
          <div className="process-grid">
            {["Consult", "Investigate", "Advise", "Coordinate"].map((step, index) => (
              <div className="process-step reveal visible" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step}</h3>
                <p>
                  {[
                    "Establish the property, transaction or development goal and the decisions you need to make.",
                    "Identify required documents, site information, stakeholders and specialist checks.",
                    "Organise findings into practical guidance, issues to resolve and recommended next steps.",
                    "Support consultant coordination, monitoring and implementation oversight where required.",
                  ][index]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="insights">
        <div className="container">
          <div className="section-heading reveal visible">
            <div>
              <p className="eyebrow">DEVELOPMENT EXPERTISE</p>
              <h2>Support for land, planning, construction and project objectives</h2>
            </div>
            <p>
              These are representative service scenarios. They are not presented
              as completed Averex projects until verified project details and
              photographs are supplied.
            </p>
          </div>
          <div className="expertise-grid">
            <article className="expertise-card reveal visible">
              <img src={companySettings.assets.heroLand} alt="Planned land development site" />
              <div>
                <p className="tag">LAND DEVELOPMENT</p>
                <h3>Subdivision and development planning support</h3>
                <p>
                  Coordinate information and professional inputs needed to
                  evaluate and structure a land-development opportunity.
                </p>
              </div>
            </article>
            <article className="expertise-card reveal visible">
              <img src={companySettings.assets.dueDiligence} alt="Property due diligence review" />
              <div>
                <p className="tag">TRANSACTION SUPPORT</p>
                <h3>Pre-acquisition property due diligence</h3>
                <p>
                  Review available information before funds are committed and
                  identify matters requiring confirmation.
                </p>
              </div>
            </article>
            <article className="expertise-card reveal visible">
              <img src={companySettings.assets.infrastructure} alt="Serviced land infrastructure" />
              <div>
                <p className="tag">PROJECT OVERSIGHT</p>
                <h3>Construction and infrastructure coordination</h3>
                <p>
                  Maintain a clearer line of sight across scope, progress,
                  responsibilities and emerging project issues.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="disclaimer-band">
        <div className="container">
          <p className="eyebrow">PROFESSIONAL DISCLAIMER</p>
          <p>
            Averex provides advisory, coordination and project-support services.
            Regulated legal, valuation, surveying, planning, architectural,
            engineering and construction work must be confirmed by qualified
            professionals and relevant authorities. No website information should
            be treated as a guarantee of title, approval, ownership, land
            availability or regulatory outcome.
          </p>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-inner reveal visible">
          <div>
            <p className="eyebrow">START WITH CLARITY</p>
            <h2>Discuss your land or property requirement with Averex.</h2>
            <p>
              Share the location, documents available and the outcome you are
              trying to achieve. The team can then advise on the appropriate next
              step.
            </p>
          </div>
          <a
            className="btn btn-light"
            href={publicWhatsAppLinks.discussPropertyMatter}
            target="_blank"
            rel="noopener"
          >
            Start on WhatsApp
          </a>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
