export const siteConfig = {
  name: "TheSaaSBook",
  description:
    "Free PDF tools and practical blog content for SaaS founders, marketers, and lean teams.",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://thesaasbook.com",
  locale: "en_US",
  keywords: [
    "PDF tools",
    "Merge PDF",
    "Split PDF",
    "Compress PDF",
    "SaaS blog",
    "marketing blog",
  ],
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.siteUrl).toString();
}
