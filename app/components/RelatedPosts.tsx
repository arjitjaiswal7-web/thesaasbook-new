import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { BlogPostSummary } from "@/lib/blog";

type RelatedPostsProps = {
  posts: BlogPostSummary[];
};

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts.length) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
        Related Blog Posts
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
              <Link
                href={post.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
              >
                Read Blog
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
