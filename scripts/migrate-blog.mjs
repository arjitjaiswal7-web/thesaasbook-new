import fs from "node:fs/promises";
import path from "node:path";

import * as cheerio from "cheerio";
import TurndownService from "turndown";
import turndownPluginGfm from "turndown-plugin-gfm";

const { gfm, tables } = turndownPluginGfm;

const BLOG_URLS = [
  "https://thesaasbook.com/guide/best-client-onboarding-software/",
  "https://thesaasbook.com/guide/how-to-control-iot-devices/",
  "https://thesaasbook.com/guide/how-to-manage-warehouse-employees/",
  "https://thesaasbook.com/strategies/digital-product-strategy/",
  "https://thesaasbook.com/pricing/saas-pricing-models-guide/",
  "https://thesaasbook.com/pricing/economy-pricing/",
  "https://thesaasbook.com/product-development/business-application-development/",
  "https://thesaasbook.com/product-development/iot-application-development/",
  "https://thesaasbook.com/sales-and-marketing/how-is-saas-software-distributed/",
  "https://thesaasbook.com/sales-and-marketing/saas-marketing-strategies/",
  "https://thesaasbook.com/strategies/white-label-saas/",
  "https://thesaasbook.com/product-development/product-design-and-product-development/",
  "https://thesaasbook.com/product-development/iot-product-development/",
];

const BLOG_PATH_PREFIXES = [
  "/guide/",
  "/pricing/",
  "/strategies/",
  "/sales-and-marketing/",
  "/product-development/",
];

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

turndownService.use([gfm, tables]);

turndownService.addRule("removeEmptyLinks", {
  filter(node, options) {
    return (
      options.linkStyle === "inlined" &&
      node.nodeName === "A" &&
      !node.getAttribute("href")
    );
  },
  replacement(content) {
    return content;
  },
});

function escapeFrontmatter(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n+/g, " ")
    .trim();
}

function getSlugFromUrl(url) {
  return new URL(url).pathname.split("/").filter(Boolean).at(-1);
}

function isBlogPath(pathname) {
  return BLOG_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function rewriteHref(rawHref, pageUrl) {
  if (!rawHref) {
    return rawHref;
  }

  if (rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
    return rawHref;
  }

  try {
    const resolved = new URL(rawHref, pageUrl);
    const host = resolved.hostname.replace(/^www\./, "");

    if (host === "thesaasbook.com" && isBlogPath(resolved.pathname)) {
      const slug = getSlugFromUrl(resolved.toString());
      return slug ? `/blog/${slug}${resolved.hash}` : "/blog";
    }

    if (host === "thesaasbook.com") {
      const path = resolved.pathname.replace(/\/$/, "") || "/";
      return `${path}${resolved.search}${resolved.hash}`;
    }

    return resolved.toString();
  } catch {
    return rawHref;
  }
}

function normalizeMarkdown(markdown) {
  return markdown
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\\-\n/g, "\n-\n")
    .replace(/\|\s*\n\n\|/g, "|\n|")
    .replace(/\n(?:-\s+.+\n){3,}\n(?=##\s)/m, "\n")
    .trim();
}

function escapeTableCell(value) {
  return value.replace(/\|/g, "\\|");
}

function tableToMarkdown(table, $) {
  const rows = [];

  $(table)
    .find("tr")
    .each((_, row) => {
      const cells = $(row)
        .find("th, td")
        .map((__, cell) => escapeTableCell($(cell).text().replace(/\s+/g, " ").trim()))
        .get();

      if (cells.length) {
        rows.push(cells);
      }
    });

  if (!rows.length) {
    return "";
  }

  const [header, ...body] = rows;
  const separator = header.map(() => "---");
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`),
  ];

  return `\n${lines.join("\n")}\n`;
}

async function fetchArticle(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; TheSaaSBookMigration/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const articleRoot = $(".entry-content").first().clone();
  const tablePlaceholders = new Map();

  if (!articleRoot.length) {
    throw new Error(`Could not locate article body for ${url}`);
  }

  articleRoot
    .find(
      [
        "script",
        "style",
        "noscript",
        "iframe",
        ".sharedaddy",
        ".jp-relatedposts",
        ".yarpp-related",
        ".rank-math-breadcrumb",
        ".ez-toc-container",
        ".toc_container",
        ".wp-block-jetpack-contact-form",
        ".wp-block-buttons:has(a[href*='contact'])",
      ].join(","),
    )
    .remove();

  articleRoot.find("h2, h3, h4, h5, h6").each((_, element) => {
    const heading = articleRoot.find(element);
    const text = heading.text().replace(/\s+/g, " ").trim().toLowerCase();

    if (text !== "table of contents") {
      return;
    }

    let next = heading.next();

    while (next.length && /^(ul|ol)$/i.test(next.prop("tagName") ?? "")) {
      const current = next;
      next = next.next();
      current.remove();
    }

    heading.remove();
  });

  articleRoot.find("table").each((index, element) => {
    const placeholder = `TABLEPLACEHOLDER${index}`;
    tablePlaceholders.set(placeholder, tableToMarkdown(element, $));
    $(element).replaceWith(`<p>${placeholder}</p>`);
  });

  const firstH2 = articleRoot.find("h2").first();

  if (firstH2.length) {
    let previous = firstH2.prev();

    while (previous.length && /^(ul|ol)$/i.test(previous.prop("tagName") ?? "")) {
      const current = previous;
      previous = previous.prev();
      current.remove();
    }
  }

  articleRoot.find("a[href]").each((_, element) => {
    const link = articleRoot.find(element);
    const href = link.attr("href");

    if (!href) {
      return;
    }

    link.attr("href", rewriteHref(href, url));
  });

  articleRoot.find("img").each((_, element) => {
    const image = articleRoot.find(element);
    const src = image.attr("src") || image.attr("data-src");

    if (src) {
      image.attr("src", new URL(src, url).toString());
    }

    image.removeAttr("srcset");
    image.removeAttr("sizes");
    image.removeAttr("loading");
    image.removeAttr("decoding");
    image.removeAttr("class");
    image.removeAttr("width");
    image.removeAttr("height");
  });

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("h1").first().text().trim();
  const description =
    $("meta[name='description']").attr("content")?.trim() ||
    $("meta[property='og:description']").attr("content")?.trim() ||
    "";
  const publishedRaw =
    $("meta[property='article:published_time']").attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    "";
  const firstArticleImage = articleRoot.find("img").first();
  const featuredImageRaw =
    $("meta[property='og:image']").attr("content")?.trim() ||
    $("meta[name='twitter:image']").attr("content")?.trim() ||
    firstArticleImage.attr("src") ||
    "";
  const featuredImage = featuredImageRaw
    ? new URL(featuredImageRaw, url).toString()
    : "";
  const featuredImageAlt =
    $("meta[property='og:image:alt']").attr("content")?.trim() ||
    firstArticleImage.attr("alt")?.trim() ||
    title;
  const publishedDate = publishedRaw ? new Date(publishedRaw).toISOString().slice(0, 10) : "";
  const slug = getSlugFromUrl(url);
  let markdown = turndownService.turndown(articleRoot.html() ?? "");

  for (const [placeholder, tableMarkdown] of tablePlaceholders) {
    markdown = markdown.replace(placeholder, tableMarkdown.trim());
  }

  markdown = normalizeMarkdown(markdown);

  return {
    slug,
    title,
    description,
    publishedDate,
    featuredImage,
    featuredImageAlt,
    markdown,
  };
}

async function main() {
  const outputDir = path.join(process.cwd(), "content", "blog");
  await fs.mkdir(outputDir, { recursive: true });

  for (const url of BLOG_URLS) {
    const article = await fetchArticle(url);
    const filePath = path.join(outputDir, `${article.slug}.mdx`);
    const frontmatter = [
      "---",
      `title: \"${escapeFrontmatter(article.title)}\"`,
      `description: \"${escapeFrontmatter(article.description)}\"`,
      'author: "arjit"',
      `publishedDate: \"${escapeFrontmatter(article.publishedDate)}\"`,
      `slug: \"${escapeFrontmatter(article.slug)}\"`,
      `featuredImage: \"${escapeFrontmatter(article.featuredImage)}\"`,
      `featuredImageAlt: \"${escapeFrontmatter(article.featuredImageAlt)}\"`,
      "---",
      "",
    ].join("\n");

    await fs.writeFile(filePath, `${frontmatter}${article.markdown}\n`, "utf8");
    console.log(`Migrated ${article.slug}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
