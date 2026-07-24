import type { Metadata } from "next";
import { AvailableLandExplorer } from "@/components/AvailableLandExplorer";
import { getPublishedListings } from "@/lib/land-listings";
import { getSiteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Available Land",
  description:
    "Search published Averex land listings by location, type, price, size and availability. Listings appear only after verification and publication.",
};

export default function AvailableLandPage() {
  const listings = getPublishedListings();

  return (
    <>
      <section className="page-hero compact">
        <div className="container">
          <p className="eyebrow">AVAILABLE LAND</p>
          <h1>Verified published land listings</h1>
          <p>
            This module is ready for residential stands, commercial stands and
            development-project listings. Database-backed listing management,
            image storage and pagination begin in Phase 4.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <AvailableLandExplorer listings={listings} siteUrl={getSiteUrl()} />
        </div>
      </section>
    </>
  );
}
