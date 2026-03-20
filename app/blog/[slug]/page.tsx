import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import AuthorProfile from "@/app/components/AuthorProfile";
import FAQSection from "@/app/components/FAQSection";
import RelatedPosts from "@/app/components/RelatedPosts";
import TableOfContents from "@/app/components/TableOfContents";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { createMdxComponents } from "@/components/mdx-components";
import {
  blogAuthor,
  formatPublishedDate,
  getAllBlogPosts,
  getBlogPostBySlug,
  getDisplayBlogFaqs,
  getRelatedBlogPosts,
} from "@/lib/blog";
import { absoluteUrl, siteConfig } from "@/lib/site-config";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const featuredImage = post.featuredImage
    ? absoluteUrl(post.featuredImage)
    : undefined;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: absoluteUrl(post.href),
    },
    openGraph: {
      title: `${siteConfig.name} | ${post.title}`,
      description: post.description,
      url: absoluteUrl(post.href),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "article",
      publishedTime: post.publishedDate,
      authors: [blogAuthor.name],
      images: featuredImage
        ? [
            {
              url: featuredImage,
              alt: post.featuredImageAlt ?? post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: featuredImage ? "summary_large_image" : "summary",
      title: `${siteConfig.name} | ${post.title}`,
      description: post.description,
      images: featuredImage ? [featuredImage] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedBlogPosts(post.slug, 3);
  const displayFaqs = getDisplayBlogFaqs(post);
  const mdxComponents = createMdxComponents();

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
        name: "Blog",
        item: absoluteUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: absoluteUrl(post.href),
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: {
      "@type": "Person",
      name: blogAuthor.name,
      url: absoluteUrl(blogAuthor.href),
    },
    publisher: {
      "@type": "Person",
      name: blogAuthor.name,
    },
    datePublished: post.publishedDate,
    description: post.description,
    image: post.featuredImage ? absoluteUrl(post.featuredImage) : undefined,
    mainEntityOfPage: absoluteUrl(post.href),
  };

  const faqSchema = displayFaqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: displayFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <>
      <JsonLd
        data={faqSchema ? [breadcrumbSchema, articleSchema, faqSchema] : [breadcrumbSchema, articleSchema]}
      />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-10">
          <article className="order-2 min-w-0 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60 sm:p-10 lg:order-1">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                Blog
              </p>
              <h1 className="mt-3 break-words text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500">
                <span>Author: {blogAuthor.name}</span>
                <span aria-hidden="true">•</span>
                <span>Published: {formatPublishedDate(post.publishedDate)}</span>
              </div>
              <p className="mt-6 text-base leading-7 text-slate-600 sm:text-lg">
                {post.description}
              </p>
            </header>

            {post.featuredImage ? (
              <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-sm shadow-slate-200/50">
                <Image
                  src={post.featuredImage}
                  alt={post.featuredImageAlt ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
            ) : null}

            <div className="mt-12 space-y-8 [&>*+*]:mt-6">
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                  },
                }}
              />
            </div>

            <FAQSection
              items={displayFaqs}
              className="mt-12"
            />

            <AuthorProfile className="mt-12" />

            <div className="mt-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to blog
              </Link>
            </div>
          </article>

          <TableOfContents items={post.headings} className="order-1 min-w-0 lg:order-2" />
        </div>

        <RelatedPosts posts={relatedPosts} />
      </main>
    </>
  );
}
