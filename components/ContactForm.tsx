"use client";

import { FormEvent } from "react";
import { buildContactFormWhatsAppUrl } from "@/lib/whatsapp";

const services = [
  "Land & Property Advisory",
  "Property Due Diligence",
  "Ownership Verification Support",
  "Site & Development Assessment",
  "Project Management",
  "Development Coordination",
  "Land Surveying and Mapping",
  "Town Planning and Applications",
  "Architectural and Engineering Support",
  "Construction and Infrastructure",
  "Other",
];

export function ContactForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const url = buildContactFormWhatsAppUrl({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      service: String(data.get("service") ?? services[0]),
      message: String(data.get("message") ?? ""),
    });
    window.open(url, "_blank", "noopener");
  }

  return (
    <form className="contact-form" id="whatsappForm" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          Full name
          <input type="text" name="name" id="name" required placeholder="Your name" />
        </label>
        <label>
          Phone number
          <input type="tel" name="phone" id="phone" placeholder="e.g. +263 ..." />
        </label>
      </div>
      <label>
        Email address
        <input type="email" name="email" id="email" placeholder="you@example.com" />
      </label>
      <label>
        Service required
        <select name="service" id="service" defaultValue={services[0]}>
          {services.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
      </label>
      <label>
        Property or project details
        <textarea
          name="message"
          id="message"
          required
          rows={5}
          placeholder="Describe the property, location, documents available and what you need help with."
        />
      </label>
      <button className="btn btn-primary form-submit" type="submit">
        Send Enquiry on WhatsApp
      </button>
      <p className="form-small">
        Submitting opens WhatsApp with your enquiry. No information is stored by
        this website.
      </p>
    </form>
  );
}
