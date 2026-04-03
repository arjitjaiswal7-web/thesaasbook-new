import type { Metadata } from "next";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import ToolCard from "@/components/ToolCard";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { seoTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "SEO Tools - Crawl, Robots & Technical Checks | TheSaaSBook",
  description:
    "Use SEO tools to test robots.txt rules, crawl access, and technical SEO setups directly in your browser.",
  alternates: {
    canonical: absoluteUrl("/tools/seo-tools"),
  },
  openGraph: {
    title: "SEO Tools - Crawl, Robots & Technical Checks | TheSaaSBook",
    description:
      "Use SEO tools to test robots.txt rules, crawl access, and technical SEO setups directly in your browser.",
    url: absoluteUrl("/tools/seo-tools"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function SeoToolsPage() {
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
    ],
  };

  const seoToolsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteConfig.name} SEO Tools`,
    url: absoluteUrl("/tools/seo-tools"),
    description:
      "Use SEO tools to test robots.txt rules, crawl access, and technical SEO setups directly in your browser.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: seoTools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        ...(tool.status === "live" ? { url: absoluteUrl(tool.href) } : {}),
      })),
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, seoToolsSchema]} />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "SEO Tools" },
          ]}
        />

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/40 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            SEO Tools
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Technical SEO tools for crawl access and indexing checks
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Start with Robots.txt Tester to validate crawl directives, then use XML Sitemap Generator
            to build ready-to-submit sitemap files with lastmod, changefreq, and priority fields.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {seoTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </section>
      </main>
    </>
  );
}
