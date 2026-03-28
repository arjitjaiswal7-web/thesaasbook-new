import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import ImageResizerTool from "@/components/tools/ImageResizerTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "image-resizer";

const pageTitle = "Image Resizer Online Free - Resize Images Fast | TheSaaSBook";
const pageDescription =
  "Resize images online for free with custom dimensions, aspect-ratio lock, and preset sizes for web and social use.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/image-tools/image-resizer"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/image-tools/image-resizer"),
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

export default function ImageResizerPage() {
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
        overviewDescription="Resize image assets for websites, ads, marketplaces, and social channels with custom dimensions or ready-made presets."
        workspace={<ImageResizerTool />}
        workspaceTitle="Image Resizer Tool"
        workspaceDescription="Upload images, choose a preset or custom size, keep the aspect ratio when needed, and download resized files directly in your browser."
      />
    </>
  );
}
