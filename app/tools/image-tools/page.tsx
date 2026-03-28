import type { Metadata } from "next";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import ToolCard from "@/components/ToolCard";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { imageTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Image Optimization Tools – Compress & Convert Images Online",
  description:
    "Use image optimization tools to compress and convert image files quickly in your browser. Fast workflow, quality controls, and zero install.",
  alternates: {
    canonical: absoluteUrl("/tools/image-tools"),
  },
  openGraph: {
    title: "Image Optimization Tools – Compress & Convert Images Online",
    description:
      "Use image optimization tools to compress and convert image files quickly in your browser. Fast workflow, quality controls, and zero install.",
    url: absoluteUrl("/tools/image-tools"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default function ImageToolsPage() {
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
    ],
  };

  const imageToolsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteConfig.name} Image Tools`,
    url: absoluteUrl("/tools/image-tools"),
    description:
      "Use image optimization tools to compress and convert image files quickly in your browser.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: imageTools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        ...(tool.status === "live" ? { url: absoluteUrl(tool.href) } : {}),
      })),
    },
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema, imageToolsSchema]} />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "Image Tools" },
          ]}
        />

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/40 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Image Tools
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Compress and optimize images for faster websites
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Start with Image Compressor and optimize JPG, PNG, and WebP assets
            with quality controls. Additional image conversion and editing tools
            are being added to this collection.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {imageTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </section>
      </main>
    </>
  );
}
