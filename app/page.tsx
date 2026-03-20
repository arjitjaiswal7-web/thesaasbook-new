import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles, Zap } from "lucide-react";

import FaqSection from "@/components/FaqSection";
import JsonLd from "@/components/JsonLd";
import ToolCard, { toolIconMap } from "@/components/ToolCard";
import { formatPublishedDate, getLatestBlogPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { featuredTools } from "@/lib/tools";

export const metadata: Metadata = {
  title: "TheSaaSBook – SaaS Tools, Strategies & Growth Guides",
  description:
    "Discover SaaS tools, strategies, pricing, and marketing guides to grow your business faster with actionable insights.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "TheSaaSBook – SaaS Tools, Strategies & Growth Guides",
    description:
      "Discover SaaS tools, strategies, pricing, and marketing guides to grow your business faster with actionable insights.",
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheSaaSBook – SaaS Tools, Strategies & Growth Guides",
    description:
      "Discover SaaS tools, strategies, pricing, and marketing guides to grow your business faster with actionable insights.",
  },
};

const authoritySignals = [
  {
    title: "Fast and Efficient",
    description:
      "Optimized for quick processing so you can get more done faster.",
    icon: Zap,
  },
  {
    title: "Secure and Reliable",
    description:
      "Your files are handled with privacy-first processing.",
    icon: ShieldCheck,
  },
  {
    title: "Designed for Everyday Use",
    description:
      "Built for founders, marketers, and professionals who value simplicity.",
    icon: BadgeCheck,
  },
];

const homepageFaqs = [
  {
    question: "What are free online PDF tools?",
    answer:
      "Free online PDF tools allow you to merge, split, compress, and convert PDF files directly in your browser without installing software.",
  },
  {
    question: "Are TheSaaSBook PDF tools free to use?",
    answer: "Yes. All core PDF tools are free to use with no signup required.",
  },
  {
    question: "Is it safe to upload PDF files online?",
    answer:
      "Yes. Files are processed securely and automatically removed after processing.",
  },
  {
    question: "Can I merge multiple PDF files into one document?",
    answer:
      "Yes. The Merge PDF tool lets you combine multiple PDF files quickly.",
  },
  {
    question: "Can I convert images to PDF online?",
    answer:
      "Yes. JPG to PDF allows you to convert images into PDF documents.",
  },
  {
    question: "Do I need to install software to use these tools?",
    answer: "No. All tools run directly in your browser.",
  },
];

export default async function Page() {
  const latestPosts = await getLatestBlogPosts(3);

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteConfig.name} Home`,
    url: absoluteUrl("/"),
    description:
      "Discover SaaS tools, strategies, pricing, and marketing guides to grow your business faster with actionable insights.",
    mainEntity: {
      "@type": "ItemList",
      name: "Featured PDF tools",
      itemListElement: featuredTools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: absoluteUrl(tool.href),
      })),
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homepageFaqs.map((faq) => ({
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
      <JsonLd data={[homeSchema, faqSchema]} />

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:pb-24 lg:pt-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm shadow-slate-200/50">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                No sign-up required • Fast processing • Works in your browser
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.02]">
                Free Online Tools to Simplify Your Work
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Access powerful PDF tools, image optimization tools, and more — all in one place, designed for speed and simplicity.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
                >
                  Explore Tools
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  Read Blog
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-8 top-8 -z-10 h-64 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.18),_transparent_65%)] blur-3xl" />
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_20px_80px_-24px_rgba(15,23,42,0.25)]">
                <div className="border-b border-slate-200/80 bg-slate-950 px-6 py-5 text-white">
                  <p className="text-sm font-medium text-slate-300">Popular Tools</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-white">
                    Fast, reliable tools to handle everyday tasks — no sign-up required.
                  </p>
                </div>

                <div className="space-y-3 p-6">
                  {featuredTools.slice(0, 3).map((tool) => {
                    const Icon = toolIconMap[tool.icon];

                    return (
                      <Link
                        key={tool.slug}
                        href={tool.href}
                        className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-950">
                            {tool.name}
                          </span>
                          <span className="mt-1 block text-sm text-slate-500">
                            {tool.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}

                  <Link
                    href="/tools/pdf-tools"
                    className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
                  >
                    Browse all PDF tools
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Featured Tools
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Tools That Help You Get Things Done Faster
              </h2>
            </div>
            <Link
              href="/tools/pdf-tools"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
            >
              Open PDF tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-white/75">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Why TheSaaSBook
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Built for Speed, Simplicity, and Trust
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {authoritySignals.map((signal) => (
                <article
                  key={signal.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                    <signal.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                    {signal.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {signal.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Latest Blogs
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Actionable Guides for SaaS Founders and Marketers
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
            >
              View all blog posts
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {latestPosts.map((post) => (
              <article
                key={post.slug}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/60 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70"
              >
                {post.featuredImage ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt ?? post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>
                ) : null}
                <div className="p-6">
                  <p className="text-sm font-medium text-sky-700">{post.category}</p>
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {post.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{formatPublishedDate(post.publishedDate)}</span>
                    <Link
                      href={post.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
                    >
                      Read blog
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <FaqSection
          title="Frequently Asked Questions"
          intro="Common questions about using TheSaaSBook tools online."
          items={homepageFaqs}
        />

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-10 text-white shadow-[0_20px_80px_-24px_rgba(15,23,42,0.45)] sm:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                  Get Started with Free Tools
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Start Using Tools That Save Your Time
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  Access simple, powerful tools and practical guides — all in one place.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/pdf-tools"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Open PDF Tools
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Read Blog
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
