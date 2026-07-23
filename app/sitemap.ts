import type { MetadataRoute } from "next";
import { getPublishedListings } from "@/lib/land-listings";
import { getSiteUrl } from "@/lib/seo";

const publicRoutes = [
  "",
  "/about",
  "/services",
  "/available-land",
  "/projects",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routeEntries = publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const listingEntries = getPublishedListings().map((listing) => ({
    url: `${siteUrl}/available-land/${listing.slug}`,
    lastModified: listing.publicationDate ? new Date(listing.publicationDate) : new Date(),
  }));

  return [...routeEntries, ...listingEntries];
}
