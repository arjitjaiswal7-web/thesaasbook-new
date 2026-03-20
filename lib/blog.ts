import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { cache } from "react";

export type BlogFrontmatter = {
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  slug: string;
  featuredImage?: string;
  featuredImageAlt?: string;
};

export type TableOfContentsItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

export type BlogFaq = {
  question: string;
  answer: string;
};

export type BlogPost = BlogFrontmatter & {
  href: `/blog/${string}`;
  content: string;
  headings: TableOfContentsItem[];
  faqs: BlogFaq[];
  category: string;
  keywords: string[];
};

export type BlogPostSummary = Omit<BlogPost, "content" | "headings" | "faqs" | "keywords">;

const BLOG_DIRECTORY = path.join(process.cwd(), "content", "blog");
const BLOG_IMAGE_PLACEHOLDER = "/blog-placeholder.svg";
const LEGACY_BLOG_IMAGE_PREFIXES = [
  "https://thesaasbook.com/wp-content/uploads/",
  "https://www.thesaasbook.com/wp-content/uploads/",
];

const blogCategoryMap: Record<string, string> = {
  "best-client-onboarding-software": "Guide",
  "how-to-control-iot-devices": "Guide",
  "how-to-manage-warehouse-employees": "Guide",
  "digital-product-strategy": "Strategy",
  "saas-pricing-models-guide": "Pricing",
  "economy-pricing": "Pricing",
  "business-application-development": "Product Development",
  "iot-application-development": "Product Development",
  "how-is-saas-software-distributed": "Sales and Marketing",
  "saas-marketing-strategies": "Sales and Marketing",
  "white-label-saas": "Strategy",
  "product-design-and-product-development": "Product Development",
  "iot-product-development": "Product Development",
};

const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "best",
  "between",
  "business",
  "build",
  "for",
  "from",
  "guide",
  "how",
  "into",
  "more",
  "online",
  "saas",
  "software",
  "that",
  "the",
  "their",
  "this",
  "tool",
  "tools",
  "what",
  "with",
  "your",
]);

export const blogAuthor = {
  name: "Arjit Jaiswal",
  role: "Founder of TheSaaSBook",
  bio:
    "Arjit Jaiswal is the founder of TheSaaSBook. He builds practical SaaS tools and writes about product development, SaaS pricing strategies, and marketing workflows. His goal is to help founders, marketers, and builders launch faster and operate more efficiently.",
  image: "/author/Arjit-jaiswal.jpg",
  website: "https://thesaasbook.com",
  linkedin: "https://www.linkedin.com/in/arjit-jaiswal-0322b6166/",
  href: "/about-us",
} as const;

const blogFaqSupplements: Partial<Record<string, BlogFaq[]>> = {
  "product-design-and-product-development": [
    {
      question: "Why is product design important in SaaS?",
      answer:
        "Product design is important in SaaS because it shapes usability, customer adoption, and the overall experience users have with the product.",
    },
    {
      question: "How can SaaS teams reduce risk during product development?",
      answer:
        "SaaS teams can reduce risk during product development by validating ideas early, gathering user feedback, and iterating through smaller releases instead of waiting for a large launch.",
    },
  ],
};

function toTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function cleanMarkdownText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      cleanMarkdownText(value)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2 && !stopWords.has(token)),
    ),
  );
}

function extractFirstMarkdownImage(content: string) {
  const match = content.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/m);

  if (!match) {
    return null;
  }

  return {
    alt: match[1] || "",
    src: match[2],
  };
}

export function isLegacyBlogImageUrl(value: string) {
  return LEGACY_BLOG_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function legacyBlogImageToLocalPath(value: string) {
  for (const prefix of LEGACY_BLOG_IMAGE_PREFIXES) {
    if (value.startsWith(prefix)) {
      return `/legacy-uploads/${value.slice(prefix.length)}`;
    }
  }

  return "";
}

export function resolveBlogImageSrc(value?: string) {
  if (!value) {
    return "";
  }

  if (isLegacyBlogImageUrl(value)) {
    return legacyBlogImageToLocalPath(value) || BLOG_IMAGE_PLACEHOLDER;
  }

  return value;
}

export function headingToId(value: string) {
  return cleanMarkdownText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getUniqueHeadingId(
  value: string,
  tracker: Map<string, number>,
) {
  const baseId = headingToId(value) || "section";
  const currentCount = tracker.get(baseId) ?? 0;
  const nextCount = currentCount + 1;

  tracker.set(baseId, nextCount);

  return nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
}

export function formatPublishedDate(value: string) {
  const timestamp = toTimestamp(value);

  if (!timestamp) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function isFaqSectionStart(line: string) {
  const normalized = cleanMarkdownText(line).toLowerCase();

  if (!normalized) {
    return false;
  }

  return normalized === "faqs" || normalized.includes("frequently asked questions") || normalized.startsWith("faqs about");
}

function getFaqSectionStartIndex(lines: string[]) {
  return lines.findIndex((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return false;
    }

    if (/^##\s+/.test(trimmed)) {
      return isFaqSectionStart(trimmed);
    }

    if (/^\*\*.*\*\*$/.test(trimmed)) {
      return isFaqSectionStart(trimmed);
    }

    return false;
  });
}

function extractHeadings(content: string): TableOfContentsItem[] {
  const lines = content.split(/\r?\n/);
  const headings: TableOfContentsItem[] = [];
  const headingTracker = new Map<string, number>();
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^(##|###|####)\s+(.+)$/);

    if (!match) {
      continue;
    }

    const level = match[1].length;
    const title = cleanMarkdownText(match[2]);

    if (!title) {
      continue;
    }

    const id = getUniqueHeadingId(title, headingTracker);

    if (level === 2 || level === 3) {
      headings.push({
        id,
        title,
        level,
      });
    }
  }

  return headings;
}

function extractFaqs(content: string): BlogFaq[] {
  const lines = content.split(/\r?\n/);
  const faqStartIndex = getFaqSectionStartIndex(lines);
  const faqs: BlogFaq[] = [];
  let inCodeBlock = false;
  let currentQuestion: string | null = null;
  let answerLines: string[] = [];

  if (faqStartIndex === -1) {
    return faqs;
  }

  const pushFaq = () => {
    if (!currentQuestion) {
      return;
    }

    const answer = cleanMarkdownText(answerLines.join(" "));

    if (answer) {
      faqs.push({
        question: cleanMarkdownText(currentQuestion),
        answer,
      });
    }

    currentQuestion = null;
    answerLines = [];
  };

  for (const line of lines.slice(faqStartIndex + 1)) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    if (/^##\s+/.test(line) && !isFaqSectionStart(line)) {
      pushFaq();
      break;
    }

    const questionMatch = line.match(/^#{3,4}\s+(.+)$/);

    if (questionMatch) {
      pushFaq();
      currentQuestion = questionMatch[1];
      continue;
    }

    if (currentQuestion) {
      answerLines.push(line);
    }
  }

  pushFaq();

  return faqs;
}

function stripFaqSection(content: string) {
  const lines = content.split(/\r?\n/);
  const faqStartIndex = getFaqSectionStartIndex(lines);

  if (faqStartIndex === -1) {
    return content.trim();
  }

  return lines.slice(0, faqStartIndex).join("\n").trim();
}

export function getDisplayBlogFaqs(post: Pick<BlogPost, "slug" | "faqs">) {
  const baseFaqs = post.faqs.slice(0, 5);

  if (baseFaqs.length >= 4) {
    return baseFaqs;
  }

  const supplement = blogFaqSupplements[post.slug] ?? [];
  return [...baseFaqs, ...supplement].slice(0, 5);
}

function toSummary(post: BlogPost): BlogPostSummary {
  return {
    title: post.title,
    description: post.description,
    author: post.author,
    publishedDate: post.publishedDate,
    slug: post.slug,
    featuredImage: post.featuredImage,
    featuredImageAlt: post.featuredImageAlt,
    href: post.href,
    category: post.category,
  };
}

const loadBlogPosts = cache(async () => {
  const files = (await fs.readdir(BLOG_DIRECTORY)).filter((file) => file.endsWith(".mdx"));

  const posts = await Promise.all(
    files.map(async (file) => {
      const source = await fs.readFile(path.join(BLOG_DIRECTORY, file), "utf8");
      const { data, content } = matter(source);
      const frontmatter = data as Partial<BlogFrontmatter>;
      const slug = frontmatter.slug ?? file.replace(/\.mdx$/, "");
      const faqs = extractFaqs(content);
      const bodyContent = stripFaqSection(content);

      const post: BlogPost = {
        title: frontmatter.title ?? "",
        description: frontmatter.description ?? "",
        author: frontmatter.author ?? "arjit",
        publishedDate: frontmatter.publishedDate ?? "",
        slug,
        featuredImage: resolveBlogImageSrc(
          frontmatter.featuredImage ?? extractFirstMarkdownImage(content)?.src ?? "",
        ),
        featuredImageAlt:
          frontmatter.featuredImageAlt ??
          extractFirstMarkdownImage(content)?.alt ??
          frontmatter.title ??
          "",
        href: `/blog/${slug}`,
        content: bodyContent,
        headings: extractHeadings(bodyContent),
        faqs,
        category: blogCategoryMap[slug] ?? "Blog",
        keywords: tokenize(`${frontmatter.title ?? ""} ${frontmatter.description ?? ""} ${slug.replace(/-/g, " ")}`),
      };

      return post;
    }),
  );

  return posts.sort((left, right) => toTimestamp(right.publishedDate) - toTimestamp(left.publishedDate));
});

export async function getAllBlogPosts() {
  return loadBlogPosts();
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await loadBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getLatestBlogPosts(limit = 3) {
  const posts = await loadBlogPosts();
  return posts.slice(0, limit).map(toSummary);
}

export async function getRelatedBlogPosts(slug: string, limit = 3) {
  const posts = await loadBlogPosts();
  const currentPost = posts.find((post) => post.slug === slug);

  if (!currentPost) {
    return [];
  }

  const currentKeywords = new Set(currentPost.keywords);

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => {
      let score = post.category === currentPost.category ? 4 : 0;

      for (const keyword of post.keywords) {
        if (currentKeywords.has(keyword)) {
          score += 1;
        }
      }

      return { post, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return toTimestamp(right.post.publishedDate) - toTimestamp(left.post.publishedDate);
    })
    .slice(0, limit)
    .map(({ post }) => toSummary(post));
}
