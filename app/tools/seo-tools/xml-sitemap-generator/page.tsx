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

  const detailsSection = (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            What Is an XML Sitemap?
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            An XML sitemap is a file that lists the URLs on a website along with optional metadata such as when each page was last updated, how often it changes, and its relative priority. Search engines like Google and Bing read this file to discover pages faster, especially on large sites, new sites with few external links, or sites that rely heavily on JavaScript navigation. A sitemap does not guarantee indexing, but it gives crawlers a clear, structured map of the pages you consider worth crawling.
          </p>
        </div>

      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            What Makes This Sitemap Generator Different
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Most free sitemap generators only crawl a site and spit out a fixed file. This one is built as an editable workspace, so you stay in control of every field before anything gets downloaded.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Per-URL Priority and Changefreq",
              description:
                "Set priority (0.0–1.0) and change frequency individually for each URL in the table, not just once for the whole file.",
            },
            {
              title: "Set Last Modified Dates per URL",
              description:
                "Assign an accurate lastmod date to every page, or leave it blank to default to today automatically.",
            },
            {
              title: "Bulk Apply to Selected or All",
              description:
                "Select specific rows with checkboxes and apply new defaults to just that group, or update every URL at once.",
            },
            {
              title: "Custom Output File Name",
              description:
                "Name the downloaded file whatever you want instead of being locked into a generic sitemap.xml.",
            },
            {
              title: "Metadata-Preserving Imports",
              description:
                "Import from TXT, CSV, JSON, or an existing XML sitemap — CSV, JSON, and XML files keep their original lastmod, changefreq, and priority values instead of resetting them.",
            },
            {
              title: "Automatic Deduplication",
              description:
                "Paste or import overlapping URL lists without worrying about duplicates — repeated URLs are detected and skipped automatically.",
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

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          How It Works
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              step: "1",
              title: "Add Your URLs",
              description:
                "Paste URLs directly into the text box, or upload a TXT, CSV, JSON, or existing XML sitemap file.",
            },
            {
              step: "2",
              title: "Review the Table",
              description:
                "Every URL lands in an editable table where duplicates are already removed automatically.",
            },
            {
              step: "3",
              title: "Fine-Tune the Fields",
              description:
                "Adjust last modified date, change frequency, and priority per URL, or select rows and apply new defaults in bulk.",
            },
            {
              step: "4",
              title: "Generate and Export",
              description:
                "Generate the XML, preview it, then copy it to your clipboard or download it under a custom file name.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Step {item.step}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-600">
          Every step above runs locally in your browser — URLs and uploaded files are never sent to a server just to build the sitemap.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Why XML Sitemaps Matter for SEO
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Search engines crawl the web by following links, but that process can miss pages that are new, poorly linked internally, or several clicks deep in your site structure. Submitting a sitemap through Google Search Console or Bing Webmaster Tools gives crawlers a direct list of URLs to check, which can shorten the time between publishing a page and having it discovered. It is also one of the first things to check when a page seems to be missing from search results.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-950">
              Sitemap Best Practices
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {[
                "Only include canonical, indexable URLs that return a 200 status.",
                "Keep lastmod dates accurate — only update them when page content actually changes.",
                "Split large sites into multiple sitemap files linked from a sitemap index once you approach 50,000 URLs.",
                "Exclude pages blocked by robots.txt or marked noindex.",
                "Resubmit the sitemap after major content updates or site restructuring.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-950">
              Changefreq and Priority, Explained
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              Google has stated it largely ignores changefreq and priority values, treating them as hints rather than instructions. They can still help other crawlers and internal tooling reason about your site, and they cost nothing to include, but lastmod accuracy and a clean, deduplicated URL list matter far more for how search engines actually use a sitemap.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          After You Generate the Sitemap
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Upload the downloaded sitemap.xml file to your site&apos;s root directory (or wherever your CMS serves static files), then reference it in your robots.txt file with a line like <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em]">Sitemap: https://example.com/sitemap.xml</code>. From there, submit the URL in Google Search Console and Bing Webmaster Tools so both can track crawl and indexing status over time.
        </p>
      </section>
    </div>
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
        overviewDescription="Build a valid XML sitemap from direct URLs or imported files, then fine-tune last modified dates, change frequency, and priority before downloading the final sitemap.xml file."
        workspace={<XmlSitemapGeneratorTool />}
        workspaceTitle="XML Sitemap Generator"
        workspaceDescription="Paste URLs directly, upload TXT, CSV, JSON, or XML files, edit sitemap fields, and export a ready-to-submit XML sitemap with up to 500 URLs."
        detailsSection={detailsSection}
        showHowToSteps={false}
      />
    </>
  );
}
