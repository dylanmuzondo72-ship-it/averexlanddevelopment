import { companySettings } from "@/lib/company";
import { ContactForm } from "./ContactForm";

export function ContactSection() {
  return (
    <section className="section section-soft" id="contact">
      <div className="container contact-grid">
        <div className="contact-info reveal visible">
          <p className="eyebrow">CONTACT US</p>
          <h2>Let’s understand the property before the paperwork becomes a crisis.</h2>
          <p>
            Send a short description of the property, its location and the
            assistance you require. Averex will guide the next practical step.
          </p>
          <div className="contact-list">
            <a href={companySettings.phones.primary.href}>
              <span>PHONE</span>
              <strong>{companySettings.phones.primary.display}</strong>
            </a>
            <a href={companySettings.phones.alternative.href}>
              <span>ALTERNATIVE</span>
              <strong>{companySettings.phones.alternative.display}</strong>
            </a>
            <a href={companySettings.emails.primary.href}>
              <span>EMAIL</span>
              <strong>{companySettings.emails.primary.display}</strong>
            </a>
            <div>
              <span>ADDRESS</span>
              <strong>{companySettings.address}</strong>
            </div>
          </div>
        </div>
        <ContactForm />
      </div>
      <div className="container map-wrap reveal visible">
        <iframe
          title="Averex Land Solutions location map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={companySettings.map.embedUrl}
        />
      </div>
    </section>
  );
}
