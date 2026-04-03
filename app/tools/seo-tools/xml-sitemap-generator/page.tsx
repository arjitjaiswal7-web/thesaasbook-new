import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import XmlSitemapGeneratorTool from "@/components/tools/XmlSitemapGeneratorTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "xml-sitemap-generator";

const pageTitle = "XML Sitemap Generator Online Free - Build Sitemap Files | TheSaaSBook";
const pageDescription =
  "Generate XML sitemap files online for free from direct URLs or TXT, CSV, JSON, and XML imports. Include lastmod, changefreq, and priority fields.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/seo-tools/xml-sitemap-generator"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/seo-tools/xml-sitemap-generator"),
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

export default function XmlSitemapGeneratorPage() {
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
        overviewDescription="Build a valid XML sitemap from direct URLs or imported files, then fine-tune last modified dates, change frequency, and priority before downloading the final sitemap.xml file." 
        workspace={<XmlSitemapGeneratorTool />}
        workspaceTitle="XML Sitemap Generator"
        workspaceDescription="Paste URLs directly, upload TXT, CSV, JSON, or XML files, edit sitemap fields, and export a ready-to-submit XML sitemap with up to 500 URLs."
      />
    </>
  );
}
