"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  availabilityStatuses,
  filterListings,
  formatListingPrice,
  landListingDisclaimer,
  LandListing,
  ListingFilters,
  propertyTypes,
} from "@/lib/land-listings";
import { buildListingWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  listings: LandListing[];
  siteUrl: string;
};

export function AvailableLandExplorer({ listings, siteUrl }: Props) {
  const [filters, setFilters] = useState<ListingFilters>({ sort: "newest" });
  const filteredListings = useMemo(
    () => filterListings(listings, filters),
    [filters, listings],
  );
  const locations = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.location))).sort(),
    [listings],
  );

  function updateFilter<Key extends keyof ListingFilters>(
    key: Key,
    value: ListingFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const hasFilters = Object.entries(filters).some(
    ([key, value]) => key !== "sort" && value !== undefined && value !== "",
  );

  return (
    <div className="land-explorer">
      <div className="filter-panel" aria-label="Available land filters">
        <label>
          Search
          <input
            type="search"
            value={filters.search ?? ""}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search by location, reference or type"
          />
        </label>
        <label>
          Location
          <select
            value={filters.location ?? ""}
            onChange={(event) => updateFilter("location", event.target.value)}
          >
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>
        <label>
          Property type
          <select
            value={filters.propertyType ?? ""}
            onChange={(event) =>
              updateFilter("propertyType", event.target.value as ListingFilters["propertyType"])
            }
          >
            <option value="">All types</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Availability
          <select
            value={filters.availability ?? ""}
            onChange={(event) =>
              updateFilter("availability", event.target.value as ListingFilters["availability"])
            }
          >
            <option value="">All statuses</option>
            {availabilityStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Minimum price
          <input
            type="number"
            min="0"
            value={filters.minPrice ?? ""}
            onChange={(event) =>
              updateFilter(
                "minPrice",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            placeholder="USD"
          />
        </label>
        <label>
          Maximum price
          <input
            type="number"
            min="0"
            value={filters.maxPrice ?? ""}
            onChange={(event) =>
              updateFilter(
                "maxPrice",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            placeholder="USD"
          />
        </label>
        <label>
          Minimum land size
          <input
            type="number"
            min="0"
            value={filters.minSize ?? ""}
            onChange={(event) =>
              updateFilter(
                "minSize",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            placeholder="Size"
          />
        </label>
        <label>
          Sort
          <select
            value={filters.sort ?? "newest"}
            onChange={(event) => updateFilter("sort", event.target.value as ListingFilters["sort"])}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="size-asc">Size: small to large</option>
            <option value="size-desc">Size: large to small</option>
          </select>
        </label>
        {hasFilters ? (
          <button className="btn btn-secondary filter-clear" type="button" onClick={() => setFilters({ sort: "newest" })}>
            Clear Filters
          </button>
        ) : null}
      </div>

      {filteredListings.length ? (
        <div className="listing-grid">
          {filteredListings.map((listing) => {
            const primaryImage = listing.images.find((image) => image.isPrimary) ?? listing.images[0];
            const listingUrl = `${siteUrl}/available-land/${listing.slug}`;
            return (
              <article className="listing-card" key={listing.id}>
                <img src={primaryImage.src} alt={primaryImage.alt} loading="lazy" />
                <div className="listing-card-body">
                  <div className="listing-card-meta">
                    <span>{listing.reference}</span>
                    <span>{listing.availabilityStatus}</span>
                  </div>
                  <h3>{listing.title}</h3>
                  <p>{listing.shortDescription}</p>
                  <dl>
                    <div>
                      <dt>Location</dt>
                      <dd>{listing.location}</dd>
                    </div>
                    <div>
                      <dt>Size</dt>
                      <dd>
                        {listing.landSize} {listing.sizeUnit}
                      </dd>
                    </div>
                    <div>
                      <dt>Type</dt>
                      <dd>{listing.propertyType}</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>{formatListingPrice(listing)}</dd>
                    </div>
                  </dl>
                  <div className="listing-actions">
                    <Link className="btn btn-secondary" href={`/available-land/${listing.slug}`}>
                      View Details
                    </Link>
                    <a
                      className="btn btn-primary"
                      href={buildListingWhatsAppUrl({
                        title: listing.title,
                        reference: listing.reference,
                        location: listing.location,
                        url: listingUrl,
                      })}
                      target="_blank"
                      rel="noopener"
                    >
                      WhatsApp Enquiry
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">AVAILABLE LAND</p>
          <h2>No published land listings are available yet.</h2>
          <p>
            Averex will publish only verified listing information here. Contact
            the team directly to discuss residential stands, commercial stands
            or development opportunities currently under review.
          </p>
          <Link className="btn btn-primary" href="/contact">
            Request Land Information
          </Link>
        </div>
      )}
      <p className="service-note">{landListingDisclaimer}</p>
    </div>
  );
}
