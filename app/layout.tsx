import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { companySettings } from "@/lib/company";
import { getRobotsForEnvironment, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Averex Land Solutions | Land & Property Advisory",
    template: "%s | Averex Land Solutions",
  },
  description:
    "Averex Land Solutions provides integrated land, planning, surveying coordination, property advisory and development support in Zimbabwe.",
  keywords: [
    "land consultancy Zimbabwe",
    "property due diligence Harare",
    "title deed verification",
    "land advisory",
    "town planning Zimbabwe",
    "land surveying coordination",
    "development project management",
  ],
  icons: {
    icon: companySettings.assets.favicon,
  },
  openGraph: {
    title: "Averex Land Solutions | Enhance Your True Land Value",
    description:
      "Integrated land, planning and development support for informed property decisions.",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: companySettings.assets.heroLand,
        width: 1200,
        height: 800,
        alt: "Planned land development site with surveyed plots",
      },
    ],
  },
  robots: getRobotsForEnvironment(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
