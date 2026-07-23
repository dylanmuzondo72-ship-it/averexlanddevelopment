import { companySettings } from "./company";

const whatsAppBaseUrl = `https://wa.me/${companySettings.phones.primary.whatsappNumber}`;

export function buildWhatsAppUrl(message: string) {
  return `${whatsAppBaseUrl}?text=${encodeURIComponent(message)}`;
}

export const publicWhatsAppLinks = {
  floating: buildWhatsAppUrl("Hello Averex Land Solutions"),
  requestConsultation: buildWhatsAppUrl(
    "Hello Averex Land Solutions, I would like to request a consultation.",
  ),
  discussPropertyMatter: buildWhatsAppUrl(
    "Hello Averex Land Solutions, I would like to discuss a land or property matter.",
  ),
};

export type ContactFormValues = {
  name: string;
  phone?: string;
  email?: string;
  service: string;
  message: string;
};

export function buildContactFormWhatsAppText(values: ContactFormValues) {
  return `Hello Averex Land Solutions, I would like to make an enquiry.\n\nName: ${values.name.trim()}\nPhone: ${
    values.phone?.trim() || "Not provided"
  }\nEmail: ${values.email?.trim() || "Not provided"}\nService: ${
    values.service
  }\n\nProperty / project details:\n${values.message.trim()}`;
}

export function buildContactFormWhatsAppUrl(values: ContactFormValues) {
  return buildWhatsAppUrl(buildContactFormWhatsAppText(values));
}

export function buildListingWhatsAppUrl(input: {
  title: string;
  reference: string;
  location: string;
  url: string;
}) {
  return buildWhatsAppUrl(
    `Hello Averex Land Solutions. I am interested in ${input.reference}, located in ${input.location}. Please send me more information.\n\nListing: ${input.title}\nURL: ${input.url}`,
  );
}
