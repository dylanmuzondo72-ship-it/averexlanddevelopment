import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedListingBySlug, formatListingPrice, landListingDisclaimer } from "@/lib/land-listings";
import { getSiteUrl } from "@/lib/seo";
import { buildListingWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = getPublishedListingBySlug(slug);
  if (!listing) {
    return {
      title: "Listing Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  const primaryImage = listing.images.find((image) => image.isPrimary) ?? listing.images[0];
  return {
    title: listing.title,
    description: `${listing.location} • ${listing.landSize} ${listing.sizeUnit} • ${listing.propertyType}. ${listing.shortDescription}`,
    openGraph: {
      title: `${listing.title} | ${listing.location}`,
      description: listing.shortDescription,
      images: primaryImage
        ? [
            {
              url: primaryImage.src,
              alt: primaryImage.alt,
            },
          ]
        : undefined,
    },
  };
}

export default async function LandListingDetailPage({ params }: Props) {
  const { slug } = await params;
  const listing = getPublishedListingBySlug(slug);
  if (!listing) notFound();

  const primaryImage = listing.images.find((image) => image.isPrimary) ?? listing.images[0];
  const listingUrl = `${getSiteUrl()}/available-land/${listing.slug}`;

  return (
    <section className="section">
      <div className="container listing-detail">
        <div className="listing-gallery">
          <img src={primaryImage.src} alt={primaryImage.alt} loading="eager" />
          <div className="listing-thumbs">
            {listing.images.map((image) => (
              <img src={image.src} alt={image.alt} key={image.src} loading="lazy" />
            ))}
          </div>
        </div>
        <div className="listing-detail-body">
          <p className="eyebrow">{listing.reference}</p>
          <h1>{listing.title}</h1>
          <p className="price-line">{formatListingPrice(listing)}</p>
          <p>{listing.fullDescription}</p>
          <dl className="listing-facts">
            <div><dt>Location</dt><dd>{listing.location}</dd></div>
            <div><dt>Province</dt><dd>{listing.province}</dd></div>
            <div><dt>District</dt><dd>{listing.district}</dd></div>
            <div><dt>Land size</dt><dd>{listing.landSize} {listing.sizeUnit}</dd></div>
            <div><dt>Property type</dt><dd>{listing.propertyType}</dd></div>
            <div><dt>Availability</dt><dd>{listing.availabilityStatus}</dd></div>
            <div><dt>Development status</dt><dd>{listing.developmentStatus ?? "To be confirmed"}</dd></div>
            <div><dt>Access road</dt><dd>{listing.accessRoad ?? "To be confirmed"}</dd></div>
            <div><dt>Water</dt><dd>{listing.water ?? "To be confirmed"}</dd></div>
            <div><dt>Electricity</dt><dd>{listing.electricity ?? "To be confirmed"}</dd></div>
            <div><dt>Sewer or sanitation</dt><dd>{listing.sewerOrSanitation ?? "To be confirmed"}</dd></div>
          </dl>
          <div className="listing-actions">
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
            <a className="btn btn-secondary" href="/contact">
              Request Consultation
            </a>
          </div>
          <p className="service-note">{landListingDisclaimer}</p>
        </div>
      </div>
    </section>
  );
}
