import type { MetadataRoute } from "next";

import { getAllBlogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-config";
import { pdfTools } from "@/lib/tools";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogPosts();
  const routes = [
    "/",
    "/about-us",
    "/contact-us",
    "/security",
    "/tools",
    "/tools/pdf-tools",
    "/blog",
    "/privacy-policy",
    "/terms-and-conditions",
    ...pdfTools.map((tool) => tool.href),
    ...posts.map((post) => post.href),
  ];
  const now = new Date();

  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/tools/pdf-tools/") ? 0.8 : 0.7,
  }));
}
