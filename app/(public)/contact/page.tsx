import type { Metadata } from "next";
import { ContactSection } from "@/components/ContactSection";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: "/contact" },
  description:
    "Contact Averex Land Solutions by phone, email, WhatsApp or visit the Harare-Bulawayo Road location.",
};

export default function ContactPage() {
  return (
    <>
      <section className="page-hero compact">
        <div className="container">
          <p className="eyebrow">CONTACT</p>
          <h1>Start with the property, location and objective</h1>
          <p>
            Averex can advise the next step once the team understands the land,
            documents available and outcome you want to achieve.
          </p>
        </div>
      </section>
      <ContactSection />
    </>
  );
}
