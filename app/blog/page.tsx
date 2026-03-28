import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { formatPublishedDate, getAllBlogPosts } from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "SaaS Blog – Strategies, Marketing & Growth Tips",
  description:
    "Read SaaS strategies, marketing tips, and growth guides to scale your business with expert insights.",
  alternates: {
    canonical: absoluteUrl("/blog"),
  },
  openGraph: {
    title: "SaaS Blog – Strategies, Marketing & Growth Tips",
    description:
      "Read SaaS strategies, marketing tips, and growth guides to scale your business with expert insights.",
    url: absoluteUrl("/blog"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteConfig.name} Blog`,
    url: absoluteUrl("/blog"),
    description:
      "Read SaaS strategies, marketing tips, and growth guides to scale your business with expert insights.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: post.title,
        url: absoluteUrl(post.href),
      })),
    },
  };

  return (
    <>
      <JsonLd data={blogSchema} />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/40 lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Blog
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Practical blog posts for founders, marketers, and builders
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Browse detailed guides on pricing, product development, strategy,
            operations, and SaaS growth workflows.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Latest Blog Posts
          </h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {posts.map((post) => (
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
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {post.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      {formatPublishedDate(post.publishedDate)}
                    </span>
                    <Link
                      href={post.href}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
                    >
                      Read Blog
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
