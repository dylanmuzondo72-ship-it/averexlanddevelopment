export const companySettings = {
  name: "Averex Land Solutions",
  ceoName: "B. Mungofa",
  slogan: "Enhance Your True Land Value",
  phones: {
    primary: {
      label: "Primary phone",
      display: "+263 774 041 144",
      href: "tel:+263774041144",
      whatsappNumber: "263774041144",
    },
    alternative: {
      label: "Alternative phone",
      display: "+263 717 515 513",
      href: "tel:+263717515513",
    },
  },
  emails: {
    primary: {
      label: "Primary email",
      display: "averexls@gmail.com",
      href: "mailto:averexls@gmail.com",
    },
    alternative: {
      label: "Alternative email",
      display: "brynermungofa@gmail.com",
      href: "mailto:brynermungofa@gmail.com",
    },
  },
  address:
    "Lot 18 Doornfontein, 24km peg Harare–Bulawayo Road, Harare, Zimbabwe",
  map: {
    query:
      "Lot 18 Doornfontein 24km peg Harare Bulawayo Road Harare Zimbabwe",
    embedUrl:
      "https://www.google.com/maps?q=Lot%2018%20Doornfontein%2024km%20peg%20Harare%20Bulawayo%20Road%20Harare&output=embed",
  },
  defaults: {
    currency: "USD",
    quotePrefix: "AVX-Q",
    invoicePrefix: "AVX-INV",
    receiptPrefix: "AVX-REC",
    landListingPrefix: "AVX-LAND",
  },
  assets: {
    logo: "/assets/images/averex-logo.png",
    favicon: "/assets/images/favicon.png",
    heroLand: "/assets/images/hero-land.png",
    advisory: "/assets/images/advisory.png",
    dueDiligence: "/assets/images/due-diligence.png",
    verification: "/assets/images/verification.png",
    surveying: "/assets/images/surveying.png",
    projectManagement: "/assets/images/project-management.png",
    infrastructure: "/assets/images/infrastructure.png",
    mapLocation: "/assets/images/map-location.png",
  },
} as const;

export type CompanySettings = typeof companySettings;
