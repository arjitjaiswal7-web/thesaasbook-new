function normalizeSiteUrl(rawUrl?: string) {
  const fallbackUrl = "https://www.thesaasbook.com";

  if (!rawUrl) {
    return fallbackUrl;
  }

  const trimmedUrl = rawUrl.replace(/\/$/, "");

  try {
    const parsedUrl = new URL(trimmedUrl);

    if (parsedUrl.hostname === "thesaasbook.com") {
      parsedUrl.hostname = "www.thesaasbook.com";
    }

    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

export const siteConfig = {
  name: "TheSaaSBook",
  description:
    "Free PDF tools and practical blog content for SaaS founders, marketers, and lean teams.",
  siteUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
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
