import fs from "node:fs/promises";
import path from "node:path";

import { getAllBlogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-config";
import { pdfTools } from "@/lib/tools";

type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type SitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
};

type StaticRouteConfig = {
  route: string;
  sources: string[];
  changeFrequency: SitemapChangeFrequency;
  priority: number;
};

const PROJECT_ROOT = process.cwd();

const pageRoutes: StaticRouteConfig[] = [
  {
    route: "/",
    sources: ["app/page.tsx", "app/layout.tsx"],
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    route: "/about-us",
    sources: ["app/about-us/page.tsx", "app/layout.tsx"],
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    route: "/contact-us",
    sources: ["app/contact-us/page.tsx", "app/layout.tsx"],
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    route: "/privacy-policy",
    sources: ["app/privacy-policy/page.tsx", "app/layout.tsx"],
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    route: "/security",
    sources: ["app/security/page.tsx", "app/layout.tsx"],
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    route: "/terms-and-conditions",
    sources: ["app/terms-and-conditions/page.tsx", "app/layout.tsx"],
    changeFrequency: "yearly",
    priority: 0.5,
  },
];

const toolComponentBySlug: Record<string, string> = {
  "merge-pdf": "components/tools/MergePdfTool.tsx",
  "split-pdf": "components/tools/SplitPdfTool.tsx",
  "edit-pdf": "components/tools/EditPdfTool.tsx",
  "compress-pdf": "components/tools/CompressPdfTool.tsx",
  "jpg-to-pdf": "components/tools/JpgToPdfTool.tsx",
  "pdf-to-word": "components/tools/PdfToWordTool.tsx",
  "word-to-pdf": "components/tools/WordToPdfTool.tsx",
  "pdf-to-jpg": "components/tools/PdfToJpgTool.tsx",
  "pdf-to-excel": "components/tools/PdfToExcelTool.tsx",
  "pdf-to-powerpoint": "components/tools/PdfToPowerPointTool.tsx",
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getLastModified(...sources: string[]) {
  const timestamps = await Promise.all(
    sources.map(async (source) => {
      const filePath = path.join(PROJECT_ROOT, source);
      const stats = await fs.stat(filePath);
      return stats.mtime.getTime();
    }),
  );

  return new Date(Math.max(...timestamps)).toISOString();
}

export function buildSitemapXml(entries: SitemapEntry[]) {
  const urls = entries
    .map(
      (entry) => `  <url>\n    <loc>${escapeXml(entry.url)}</loc>\n    <lastmod>${entry.lastModified}</lastmod>\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export async function getPagesSitemapEntries(): Promise<SitemapEntry[]> {
  return Promise.all(
    pageRoutes.map(async (page) => ({
      url: absoluteUrl(page.route),
      lastModified: await getLastModified(...page.sources),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  );
}

export async function getToolsSitemapEntries(): Promise<SitemapEntry[]> {
  const sharedSources = [
    "app/tools/page.tsx",
    "app/tools/pdf-tools/page.tsx",
    "app/tools/pdf-tools/[slug]/page.tsx",
    "components/ToolPageTemplate.tsx",
    "lib/tools.ts",
  ];

  const indexEntries: SitemapEntry[] = [
    {
      url: absoluteUrl("/tools"),
      lastModified: await getLastModified("app/tools/page.tsx", "lib/tools.ts"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/tools/pdf-tools"),
      lastModified: await getLastModified(
        "app/tools/pdf-tools/page.tsx",
        "lib/tools.ts",
      ),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const toolEntries = await Promise.all(
    pdfTools.map(async (tool) => ({
      url: absoluteUrl(tool.href),
      lastModified: await getLastModified(
        ...sharedSources,
        toolComponentBySlug[tool.slug],
      ),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  return [...indexEntries, ...toolEntries];
}

export async function getBlogSitemapEntries(): Promise<SitemapEntry[]> {
  const posts = await getAllBlogPosts();
  const templateSources = [
    "app/blog/page.tsx",
    "app/blog/[slug]/page.tsx",
    "components/mdx-components.tsx",
    "app/components/AuthorProfile.tsx",
    "app/components/RelatedPosts.tsx",
    "app/components/TableOfContents.tsx",
    "app/components/FAQSection.tsx",
    "lib/blog.ts",
  ];

  const latestPostModified = posts.length
    ? Math.max(
        ...(
          await Promise.all(
            posts.map(async (post) => {
              const stats = await fs.stat(
                path.join(PROJECT_ROOT, "content", "blog", `${post.slug}.mdx`),
              );
              return stats.mtime.getTime();
            }),
          )
        ),
      )
    : Date.now();

  const blogIndexLastModified = new Date(
    Math.max(
      latestPostModified,
      new Date(await getLastModified("app/blog/page.tsx", "lib/blog.ts")).getTime(),
    ),
  ).toISOString();

  const postEntries = await Promise.all(
    posts.map(async (post) => ({
      url: absoluteUrl(post.href),
      lastModified: await getLastModified(
        ...templateSources,
        path.join("content", "blog", `${post.slug}.mdx`),
      ),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  return [
    {
      url: absoluteUrl("/blog"),
      lastModified: blogIndexLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
