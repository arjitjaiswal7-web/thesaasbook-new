import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import ToolCard from "@/components/ToolCard";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { imageTools, pdfTools, seoTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free Online Tools – PDF & Marketing Tools | TheSaaSBook",
  description:
    "Use free online tools including PDF converters, compressors, and calculators. Fast, secure, and easy tools on TheSaaSBook.",
  alternates: {
    canonical: absoluteUrl("/tools"),
  },
  openGraph: {
    title: "Free Online Tools – PDF & Marketing Tools | TheSaaSBook",
    description:
      "Use free online tools including PDF converters, compressors, and calculators. Fast, secure, and easy tools on TheSaaSBook.",
    url: absoluteUrl("/tools"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function ToolsPage() {
  const featuredPdfTools = pdfTools.slice(0, 6);
  const liveImageTools = imageTools.filter((tool) => tool.status === "live");
  const upcomingImageTools = imageTools.filter((tool) => tool.status === "coming-soon");
  const liveSeoTools = seoTools.filter((tool) => tool.status === "live");

  const toolsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteConfig.name} Tools`,
    url: absoluteUrl("/tools"),
    description:
      "Use free online tools including PDF converters, compressors, and calculators. Fast, secure, and easy tools on TheSaaSBook.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: featuredPdfTools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: absoluteUrl(tool.href),
      })),
    },
  };

  return (
    <>
      <JsonLd data={toolsSchema} />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />

        <section className="mt-6 grid gap-8 rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-200/40 sm:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-10">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Tools
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              A focused collection of tools for faster document workflows
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              The current library is centered on PDF workflows that help teams
              merge, split, compress, and convert files without unnecessary
              friction.
            </p>
          </div>

          <aside className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
              <FolderOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              PDF Tools
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Explore the dedicated PDF tools collection for the fastest path to
              the current utility set.
            </p>
            <Link
              href="/tools/pdf-tools"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
            >
              Browse PDF tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </aside>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            PDF Tools
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Browse the current live PDF tools collection for merging, converting,
            compressing, and editing documents online.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredPdfTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/tools/pdf-tools"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              View All Tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Image Optimization Tools
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Use the live Image Compressor tool today for fast browser-side
                optimization. Additional image tools for resizing and format
                conversion are rolling out next.
              </p>
            </div>
            {upcomingImageTools.length > 0 ? (
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 sm:inline-flex">
                More Coming Soon
              </span>
            ) : null}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {imageTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>

          {liveImageTools.length > 0 ? (
            <div className="mt-10 flex justify-center">
              <Link
                href="/tools/image-tools"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                View All Tools
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                SEO Tools
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Test crawl directives, generate XML sitemaps, and validate whether important SEO resources are accessible to search bots.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {seoTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>

          {liveSeoTools.length > 0 ? (
            <div className="mt-10 flex justify-center">
              <Link
                href="/tools/seo-tools"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                View All Tools
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </>
  );
}
