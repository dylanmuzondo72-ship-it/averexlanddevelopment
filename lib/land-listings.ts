import { companySettings } from "./company";

export const propertyTypes = [
  "Residential",
  "Commercial",
  "Industrial",
  "Agricultural",
  "Mixed-use",
  "Development project",
  "Other",
] as const;

export const availabilityStatuses = [
  "available",
  "reserved",
  "sold",
  "unavailable",
] as const;

export const publicationStatuses = ["draft", "published", "archived"] as const;

export type PropertyType = (typeof propertyTypes)[number];
export type AvailabilityStatus = (typeof availabilityStatuses)[number];
export type PublicationStatus = (typeof publicationStatuses)[number];

export type LandListingImage = {
  src: string;
  alt: string;
  caption?: string;
  isPrimary?: boolean;
};

export type LandListing = {
  id: string;
  reference: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  location: string;
  province: string;
  district: string;
  propertyType: PropertyType;
  landSize: number;
  sizeUnit: string;
  price: number | null;
  currency: string;
  showPrice: boolean;
  depositRequired?: string;
  paymentTerms?: string;
  availabilityStatus: AvailabilityStatus;
  publicationStatus: PublicationStatus;
  developmentStatus?: string;
  accessRoad?: string;
  water?: string;
  electricity?: string;
  sewerOrSanitation?: string;
  nearbyFacilities?: string[];
  features: string[];
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
  contactPhone: string;
  contactEmail: string;
  featured: boolean;
  publicationDate?: string;
  showSoldListing: boolean;
  images: LandListingImage[];
};

export type ListingFilters = {
  search?: string;
  location?: string;
  propertyType?: PropertyType | "";
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  availability?: AvailabilityStatus | "";
  sort?: "newest" | "price-asc" | "price-desc" | "size-asc" | "size-desc";
};

export const landListingDisclaimer =
  "Property information is provided for general guidance and remains subject to verification, availability and confirmation by the relevant professionals and authorities.";

export const landListings: LandListing[] = [];

export function getPublishedListings(listings: LandListing[] = landListings) {
  return listings.filter((listing) => {
    if (listing.publicationStatus !== "published") return false;
    if (listing.availabilityStatus === "sold" && !listing.showSoldListing) {
      return false;
    }
    return listing.images.some((image) => image.isPrimary);
  });
}

export function getFeaturedListings(listings: LandListing[] = landListings) {
  return getPublishedListings(listings).filter((listing) => listing.featured);
}

export function getPublishedListingBySlug(slug: string) {
  return getPublishedListings().find((listing) => listing.slug === slug);
}

export function formatListingReference(sequence: number) {
  return `${companySettings.defaults.landListingPrefix}-${String(sequence).padStart(
    4,
    "0",
  )}`;
}

export function formatListingPrice(listing: Pick<LandListing, "price" | "currency" | "showPrice">) {
  if (!listing.showPrice || listing.price === null) return "Contact for Price";
  return `${listing.currency} ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(listing.price)}`;
}

export function filterListings(
  listings: LandListing[],
  filters: ListingFilters,
) {
  const search = filters.search?.trim().toLowerCase();
  const filtered = listings.filter((listing) => {
    if (search) {
      const haystack = [
        listing.title,
        listing.reference,
        listing.location,
        listing.shortDescription,
        listing.propertyType,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.location && listing.location !== filters.location) return false;
    if (filters.propertyType && listing.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.availability && listing.availabilityStatus !== filters.availability) {
      return false;
    }
    if (filters.minSize && listing.landSize < filters.minSize) return false;
    if (filters.minPrice && (listing.price ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice && (listing.price ?? 0) > filters.maxPrice) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
      case "price-desc":
        return (b.price ?? 0) - (a.price ?? 0);
      case "size-asc":
        return a.landSize - b.landSize;
      case "size-desc":
        return b.landSize - a.landSize;
      case "newest":
      default:
        return (
          new Date(b.publicationDate ?? 0).getTime() -
          new Date(a.publicationDate ?? 0).getTime()
        );
    }
  });
}
