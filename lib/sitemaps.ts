import fs from "node:fs/promises";
import path from "node:path";

import { getAllBlogPosts } from "@/lib/blog";
import { absoluteUrl } from "@/lib/site-config";
import { liveTools } from "@/lib/tools";

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

export type SitemapIndexEntry = {
  url: string;
  lastModified: string;
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
  "image-compressor": "components/tools/ImageCompressorTool.tsx",
  "image-resizer": "components/tools/ImageResizerTool.tsx",
  "png-to-jpg": "components/tools/PngToJpgTool.tsx",
  "jpg-to-png": "components/tools/JpgToPngTool.tsx",
  "jpg-to-webp": "components/tools/JpgToWebpTool.tsx",
  "image-cropper": "components/tools/ImageCropperTool.tsx",
  "robots-txt-tester": "components/tools/RobotsTxtTesterTool.tsx",
  "xml-sitemap-generator": "components/tools/XmlSitemapGeneratorTool.tsx",
  "broken-link-checker": "components/tools/BrokenLinkCheckerTool.tsx",
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ensureWwwUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.hostname === "thesaasbook.com") {
      url.hostname = "www.thesaasbook.com";
    }

    return url.toString();
  } catch {
    return value;
  }
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
      (entry) => `  <url>\n    <loc>${escapeXml(ensureWwwUrl(entry.url))}</loc>\n    <lastmod>${entry.lastModified}</lastmod>\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function buildSitemapIndexXml(entries: SitemapIndexEntry[]) {
  const sitemaps = entries
    .map(
      (entry) => `  <sitemap>\n    <loc>${escapeXml(ensureWwwUrl(entry.url))}</loc>\n    <lastmod>${entry.lastModified}</lastmod>\n  </sitemap>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>`;
}

function getLatestEntryTimestamp(entries: SitemapEntry[]) {
  if (!entries.length) {
    return new Date().toISOString();
  }

  return entries.reduce((latest, entry) =>
    new Date(entry.lastModified).getTime() > new Date(latest).getTime()
      ? entry.lastModified
      : latest,
  entries[0].lastModified);
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
    "app/tools/image-tools/page.tsx",
    "app/tools/seo-tools/page.tsx",
    "app/tools/image-tools/image-compressor/page.tsx",
    "app/tools/image-tools/image-resizer/page.tsx",
    "app/tools/image-tools/png-to-jpg/page.tsx",
    "app/tools/image-tools/jpg-to-png/page.tsx",
    "app/tools/image-tools/jpg-to-webp/page.tsx",
    "app/tools/image-tools/image-cropper/page.tsx",
    "app/tools/seo-tools/robots-txt-tester/page.tsx",
    "app/tools/seo-tools/xml-sitemap-generator/page.tsx",
    "app/tools/seo-tools/broken-link-checker/page.tsx",
    "app/api/seo/robots-txt-tester/route.ts",
    "app/api/scan/route.ts",
    "lib/robots-txt.ts",
    "lib/broken-link-checker.ts",
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
    {
      url: absoluteUrl("/tools/image-tools"),
      lastModified: await getLastModified(
        "app/tools/image-tools/page.tsx",
        "lib/tools.ts",
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/tools/seo-tools"),
      lastModified: await getLastModified(
        "app/tools/seo-tools/page.tsx",
        "lib/tools.ts",
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const toolEntries = await Promise.all(
    liveTools.map(async (tool) => ({
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

export async function getSitemapIndexEntries(): Promise<SitemapIndexEntry[]> {
  const [pagesEntries, toolsEntries, blogEntries] = await Promise.all([
    getPagesSitemapEntries(),
    getToolsSitemapEntries(),
    getBlogSitemapEntries(),
  ]);

  return [
    {
      url: absoluteUrl("/sitemaps/pages.xml"),
      lastModified: getLatestEntryTimestamp(pagesEntries),
    },
    {
      url: absoluteUrl("/sitemaps/tools.xml"),
      lastModified: getLatestEntryTimestamp(toolsEntries),
    },
    {
      url: absoluteUrl("/sitemaps/blog.xml"),
      lastModified: getLatestEntryTimestamp(blogEntries),
    },
  ];
}
