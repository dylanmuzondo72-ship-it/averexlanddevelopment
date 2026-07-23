import type { MetadataRoute } from "next";
import { getSiteUrl, isPreviewDeployment } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/available-land/*?draft=*"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
