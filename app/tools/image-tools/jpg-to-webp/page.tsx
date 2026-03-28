import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import JpgToWebpTool from "@/components/tools/JpgToWebpTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "jpg-to-webp";

const pageTitle = "JPG to WebP Online Free - Convert JPG Images Fast | TheSaaSBook";
const pageDescription =
  "Convert JPG to WebP online for free with batch uploads, quality controls, and smaller browser-ready image outputs.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/image-tools/jpg-to-webp"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/image-tools/jpg-to-webp"),
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

export default function JpgToWebpPage() {
  const tool = getLiveToolBySlug(slug);

  if (!tool || tool.group !== "image-tools") {
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
        name: "Image Tools",
        item: absoluteUrl("/tools/image-tools"),
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
    applicationCategory: "MultimediaApplication",
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
        toolGroupLabel="Image Tools"
        toolGroupHref="/tools/image-tools"
        relatedToolsTitle="Related Tools"
        overviewDescription="Turn JPG images into smaller WebP assets for websites, product pages, ad creatives, and faster image delivery across modern browsers."
        workspace={<JpgToWebpTool />}
        workspaceTitle="JPG to WebP Tool"
        workspaceDescription="Upload JPG files, choose a WebP quality level, and download lighter browser-ready outputs directly in your browser."
      />
    </>
  );
}
