import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import ImageCompressorTool from "@/components/tools/ImageCompressorTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "image-compressor";

const pageTitle = "Image Compressor Online Free - Fast & High Quality | TheSaaSBook";
const pageDescription =
  "Compress images online for free with quality controls. Optimize JPG, PNG, and WebP files quickly while keeping visuals clear.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/image-tools/image-compressor"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/image-tools/image-compressor"),
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

export default function ImageCompressorPage() {
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
        overviewDescription="Compress image assets for web pages, ads, product docs, and social posts without leaving the browser."
        workspace={<ImageCompressorTool />}
        workspaceTitle="Image Compressor Tool"
        workspaceDescription="Upload JPG, PNG, or WebP images, choose a compression preset, and download optimized files with clear quality and size savings."
      />
    </>
  );
}
