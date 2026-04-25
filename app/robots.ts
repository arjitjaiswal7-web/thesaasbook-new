import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_next/", "/api/"],
    },
    sitemap: [
      absoluteUrl("/sitemap.xml"),
      absoluteUrl("/sitemaps/pages.xml"),
      absoluteUrl("/sitemaps/tools.xml"),
      absoluteUrl("/sitemaps/blog.xml"),
    ],
    host: siteConfig.siteUrl,
  };
}
