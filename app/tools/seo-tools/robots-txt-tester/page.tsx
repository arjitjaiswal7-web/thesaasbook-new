import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import RobotsTxtTesterTool from "@/components/tools/RobotsTxtTesterTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "robots-txt-tester";

const pageTitle = "Robots.txt Tester Online Free - Test Crawl Rules | TheSaaSBook";
const pageDescription =
  "Test robots.txt rules online for free. Check whether a URL is blocked for a specific bot and inspect important page resources.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/seo-tools/robots-txt-tester"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/seo-tools/robots-txt-tester"),
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

export default function RobotsTxtTesterPage() {
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
        overviewDescription="Test robots.txt rules for a URL, simulate different bots, inspect matched directives, and audit whether linked resources are blocked from crawling."
        workspace={<RobotsTxtTesterTool />}
        workspaceTitle="Robots.txt Tester"
        workspaceDescription="Enter a URL, choose a user-agent, optionally paste custom robots.txt rules, and inspect crawl access plus blocked resources."
      />
    </>
  );
}
