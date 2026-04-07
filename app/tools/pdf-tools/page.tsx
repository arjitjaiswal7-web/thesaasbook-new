import type { Metadata } from "next";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import ToolCard from "@/components/ToolCard";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { pdfTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Free PDF Tools Online – Convert, Merge & Edit PDFs",
  description:
    "Use free PDF tools online to merge, split, compress, and convert files quickly and securely on TheSaaSBook.",
  alternates: {
    canonical: absoluteUrl("/tools/pdf-tools"),
  },
  openGraph: {
    title: "Free PDF Tools Online – Convert, Merge & Edit PDFs",
    description:
      "Use free PDF tools online to merge, split, compress, and convert files quickly and securely on TheSaaSBook.",
    url: absoluteUrl("/tools/pdf-tools"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function PdfToolsPage() {
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
        name: "PDF Tools",
        item: absoluteUrl("/tools/pdf-tools"),
      },
    ],
  };

  const pdfToolsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteConfig.name} PDF Tools`,
    url: absoluteUrl("/tools/pdf-tools"),
    description:
      "Use free PDF tools online to merge, split, compress, and convert files quickly and securely on TheSaaSBook.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: pdfTools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: absoluteUrl(tool.href),
      })),
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, pdfToolsSchema]} />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "PDF Tools" },
          ]}
        />

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/40 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            PDF Tools
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Free PDF tools for the workflows teams use most
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Access dedicated tools for merging, splitting, editing,
            compressing, and converting PDF files inside a focused document
            workflow silo.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pdfTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Browse every PDF tool
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Explore each dedicated PDF workflow below, including merge, split, edit, compression, and conversion tools.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {pdfTools.map((tool) => (
              <div key={tool.slug} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-950">
                  <a href={tool.href} className="transition hover:text-sky-700">
                    {tool.name}
                  </a>
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
