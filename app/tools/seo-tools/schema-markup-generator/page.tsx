import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import SchemaMarkupGeneratorTool from "@/components/tools/SchemaMarkupGeneratorTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getLiveToolBySlug, getRelatedTools, getToolFaqs } from "@/lib/tools";

const slug = "schema-markup-generator";

const pageTitle =
  "Schema Markup Generator Online Free - Create JSON-LD | TheSaaSBook";
const pageDescription =
  "Generate schema markup online for free with live JSON-LD preview, validation checks, Rich Results Test links, and URL autofill.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/tools/seo-tools/schema-markup-generator"),
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: absoluteUrl("/tools/seo-tools/schema-markup-generator"),
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

export default function SchemaMarkupGeneratorPage() {
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
    featureList: [
      "Live JSON-LD preview",
      "Rich Results Test link",
      "URL-based schema autofill",
      "Validation checker",
      "Copy and download JSON-LD",
    ],
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

  const detailsSection = (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          What this schema generator covers
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Create clean JSON-LD for Articles, FAQ pages, Organizations, Websites, Products, Local Businesses, and Breadcrumb Lists. The generator keeps the output readable, checks required fields, and gives you a direct handoff into Google’s Rich Results Test.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Live preview",
            description:
              "See the JSON-LD update as you type so you can catch mistakes early.",
          },
          {
            title: "URL autofill",
            description:
              "Pull high-confidence title, description, image, and schema fields from a live page.",
          },
          {
            title: "Validation checker",
            description:
              "Review required fields, recommended fields, and formatting issues before publishing.",
          },
          {
            title: "Rich Results Test",
            description:
              "Open Google’s tester quickly once your schema draft is ready to review.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
          >
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

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
        overviewDescription="Create JSON-LD schema markup with live preview, validation, URL autofill, and a direct Rich Results Test handoff from one dedicated workflow."
        workspace={<SchemaMarkupGeneratorTool />}
        workspaceTitle="Schema Markup Generator"
        workspaceDescription="Choose a schema type, auto-fill suggestions from a live URL if needed, validate the fields, and copy or download the final JSON-LD markup."
        detailsSection={detailsSection}
      />
    </>
  );
}

