import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import BrokenLinkCheckerTool from "@/components/tools/BrokenLinkCheckerTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "broken-link-checker";

const pageTitle = "Broken Link Checker Online Free - Scan Websites Fast | TheSaaSBook";
const pageDescription =
  "Scan any website for broken links, crawler-blocked URLs, and timeout issues with a free grouped broken link checker. Export clean CSV reports with no login required.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/seo-tools/broken-link-checker"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/seo-tools/broken-link-checker"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function BrokenLinkCheckerPage() {
  const tool = getLiveToolBySlug(slug);

  if (!tool || tool.group !== "seo-tools") {
    notFound();
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: absoluteUrl("/tools"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "SEO Tools",
        item: absoluteUrl("/tools/seo-tools"),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: tool.name,
        item: absoluteUrl(tool.href),
      },
    ],
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl(tool.href),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const faqs = getToolFaqs(tool.slug);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, appSchema, faqSchema]} />
      <ToolPageTemplate
        tool={tool}
        relatedTools={getRelatedTools(tool.slug)}
        faqs={faqs}
        toolGroupLabel="SEO Tools"
        toolGroupHref="/tools/seo-tools"
        relatedToolsTitle="Related SEO Tools"
        overviewDescription="Crawl a website, group duplicate URLs into one result, and review only issue links: broken URLs, crawler-blocked responses, and timeouts with clean source-page reporting."
        workspace={<BrokenLinkCheckerTool />}
        workspaceTitle="Broken Link Checker"
        workspaceDescription="Enter a website URL and scan the domain recursively to detect unique issue links only, including broken URLs, crawler-blocked URLs, timeout responses, source pages, and grouped occurrences."
      />
    </>
  );
}
