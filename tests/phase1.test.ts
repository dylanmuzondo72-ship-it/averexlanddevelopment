import { describe, expect, it } from "vitest";
import { companySettings } from "../lib/company";
import {
  buildContactFormWhatsAppText,
  buildContactFormWhatsAppUrl,
  publicWhatsAppLinks,
} from "../lib/whatsapp";
import {
  filterListings,
  formatListingReference,
  getPublishedListings,
  LandListing,
} from "../lib/land-listings";
import { getRobotsForEnvironment } from "../lib/seo";

describe("company settings", () => {
  it("centralises verified Averex details", () => {
    expect(companySettings.name).toBe("Averex Land Solutions");
    expect(companySettings.ceoName).toBe("B. Mungofa");
    expect(companySettings.slogan).toBe("Enhance Your True Land Value");
    expect(companySettings.phones.primary.href).toBe("tel:+263774041144");
    expect(companySettings.emails.primary.href).toBe("mailto:averexls@gmail.com");
  });
});

describe("whatsapp links", () => {
  it("preserves the existing public WhatsApp CTA URLs", () => {
    expect(publicWhatsAppLinks.floating).toBe(
      "https://wa.me/263774041144?text=Hello%20Averex%20Land%20Solutions",
    );
    expect(publicWhatsAppLinks.requestConsultation).toBe(
      "https://wa.me/263774041144?text=Hello%20Averex%20Land%20Solutions%2C%20I%20would%20like%20to%20request%20a%20consultation.",
    );
  });

  it("preserves the exact contact form message structure", () => {
    const text = buildContactFormWhatsAppText({
      name: "Tariro",
      phone: "",
      email: "",
      service: "Property Due Diligence",
      message: "Please review a stand in Doornfontein.",
    });
    expect(text).toBe(
      "Hello Averex Land Solutions, I would like to make an enquiry.\n\nName: Tariro\nPhone: Not provided\nEmail: Not provided\nService: Property Due Diligence\n\nProperty / project details:\nPlease review a stand in Doornfontein.",
    );
    expect(decodeURIComponent(buildContactFormWhatsAppUrl({
      name: "Tariro",
      phone: "",
      email: "",
      service: "Property Due Diligence",
      message: "Please review a stand in Doornfontein.",
    }))).toContain(text);
  });
});

describe("land listing helpers", () => {
  const listing: LandListing = {
    id: "1",
    reference: "AVX-LAND-0001",
    slug: "doornfontein-stand",
    title: "Doornfontein Residential Stand",
    shortDescription: "A verified residential stand record.",
    fullDescription: "Full listing description.",
    location: "Doornfontein",
    province: "Harare",
    district: "Harare",
    propertyType: "Residential",
    landSize: 1200,
    sizeUnit: "sqm",
    price: 25000,
    currency: "USD",
    showPrice: true,
    availabilityStatus: "available",
    publicationStatus: "published",
    contactPhone: "+263 774 041 144",
    contactEmail: "averexls@gmail.com",
    featured: true,
    publicationDate: "2026-07-23",
    showSoldListing: false,
    images: [{ src: "/assets/images/hero-land.png", alt: "Stand", isPrimary: true }],
    features: ["Road access"],
  };

  it("formats listing references with the Averex prefix", () => {
    expect(formatListingReference(1)).toBe("AVX-LAND-0001");
  });

  it("only exposes published listings with primary images", () => {
    expect(getPublishedListings([listing])).toHaveLength(1);
    expect(getPublishedListings([{ ...listing, publicationStatus: "draft" }])).toHaveLength(0);
    expect(getPublishedListings([{ ...listing, images: [] }])).toHaveLength(0);
  });

  it("filters and sorts public listings in memory for Phase 1", () => {
    const results = filterListings([listing], {
      search: "residential",
      propertyType: "Residential",
      minSize: 1000,
      sort: "newest",
    });
    expect(results[0]?.reference).toBe("AVX-LAND-0001");
  });
});

describe("seo robots", () => {
  it("noindexes Vercel previews", () => {
    expect(getRobotsForEnvironment("preview").index).toBe(false);
    expect(getRobotsForEnvironment("production").index).toBe(true);
  });
});
