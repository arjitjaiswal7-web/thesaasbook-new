import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import CompressPdfTool from "@/components/tools/CompressPdfTool";
import EditPdfTool from "@/components/tools/EditPdfTool";
import JpgToPdfTool from "@/components/tools/JpgToPdfTool";
import MergePdfTool from "@/components/tools/MergePdfTool";
import PdfToExcelTool from "@/components/tools/PdfToExcelTool";
import PdfToJpgTool from "@/components/tools/PdfToJpgTool";
import PdfToPowerPointTool from "@/components/tools/PdfToPowerPointTool";
import PdfToWordTool from "@/components/tools/PdfToWordTool";
import SplitPdfTool from "@/components/tools/SplitPdfTool";
import WordToPdfTool from "@/components/tools/WordToPdfTool";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getPdfToolBySlug, getRelatedTools, getToolFaqs, pdfTools } from "@/lib/tools";

type ToolPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const toolMetadata: Record<string, { title: string; description: string }> = {
  "merge-pdf": {
    title: "Merge PDF Online Free – Combine Files Fast | TheSaaSBook",
    description:
      "Merge PDF files online for free. Combine multiple PDFs quickly, securely, and easily without signup using TheSaaSBook tools.",
  },
  "split-pdf": {
    title: "Split PDF Online Free – Extract Pages Easily | TheSaaSBook",
    description:
      "Split PDF files online for free. Extract pages or divide PDFs quickly and securely with our easy-to-use tool on TheSaaSBook.",
  },
  "edit-pdf": {
    title: "Edit PDF Online Free – Modify PDFs Easily | TheSaaSBook",
    description:
      "Edit PDF files online for free. Add text, images, and make changes easily with a fast, secure PDF editor on TheSaaSBook.",
  },
  "compress-pdf": {
    title: "Compress PDF Online Free – Reduce File Size Fast",
    description:
      "Compress PDF files online to reduce size without losing quality. Fast, secure, and easy compression tool on TheSaaSBook.",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF Online Free – Convert Images Fast",
    description:
      "Convert JPG to PDF online for free. Turn images into high-quality PDFs quickly and securely with TheSaaSBook tool.",
  },
  "pdf-to-word": {
    title: "PDF to Word Online Free – Convert PDF to DOC",
    description:
      "Convert PDF to Word online for free. Easily turn PDFs into editable DOC files quickly, accurately, and securely.",
  },
  "word-to-pdf": {
    title: "Word to PDF Online Free – Convert DOC to PDF",
    description:
      "Convert Word to PDF online for free. Turn DOC files into high-quality PDFs quickly and securely using TheSaaSBook.",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG Online Free – Convert PDF to Images",
    description:
      "Convert PDF to JPG online for free. Extract images from PDFs or convert pages into JPG format quickly and securely.",
  },
  "pdf-to-excel": {
    title: "PDF to Excel Online Free – Convert PDF to XLS",
    description:
      "Convert PDF to Excel online for free. Extract tables and data into editable XLS files quickly and accurately.",
  },
  "pdf-to-powerpoint": {
    title: "PDF to PowerPoint Online Free – Convert PDF to PPT",
    description:
      "Convert PDF to PowerPoint online for free. Turn PDFs into editable PPT slides quickly and easily with TheSaaSBook.",
  },
};

const toolOverviewDescriptions: Record<string, string> = {
  "merge-pdf":
    "Combine multiple PDF files into one organized document when you need a single file for sharing, review, or delivery.",
  "split-pdf":
    "Extract selected pages or break a large PDF into smaller files so you can keep only the pages you need.",
  "edit-pdf":
    "Use a visual PDF editor that detects text lines, lets you overlay edited content in place, and exports a revised PDF that looks updated.",
  "compress-pdf":
    "Reduce PDF file size for faster uploads, email attachments, and easier sharing without leaving the browser.",
  "jpg-to-pdf":
    "Turn one or more JPG images into a clean PDF document that is easier to share, print, and archive.",
  "pdf-to-word":
    "Convert text-based PDF files into editable Word documents so you can revise the content more easily.",
  "word-to-pdf":
    "Convert DOCX files into polished PDF documents for consistent formatting across devices and teams.",
  "pdf-to-jpg":
    "Export PDF pages as JPG images when you need visuals for websites, presentations, or quick sharing.",
  "pdf-to-excel":
    "Pull table-style content out of PDF files and into Excel so you can sort, edit, and analyze the data.",
  "pdf-to-powerpoint":
    "Convert PDF pages into PowerPoint slides when you need a presentation-ready deck based on an existing document.",
};

export function generateStaticParams() {
  return pdfTools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getPdfToolBySlug(slug);
  const meta = toolMetadata[slug];

  if (!tool) {
    return {};
  }

  return {
    title: meta?.title ?? tool.name,
    description: meta?.description ?? tool.description,
    alternates: {
      canonical: absoluteUrl(tool.href),
    },
    openGraph: {
      title: meta?.title ?? tool.name,
      description: meta?.description ?? tool.description,
      url: absoluteUrl(tool.href),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta?.title ?? tool.name,
      description: meta?.description ?? tool.description,
    },
  };
}

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getPdfToolBySlug(slug);

  if (!tool) {
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
        name: "PDF Tools",
        item: absoluteUrl("/tools/pdf-tools"),
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

  const workspace =
    tool.slug === "merge-pdf" ? (
      <MergePdfTool />
    ) : tool.slug === "split-pdf" ? (
      <SplitPdfTool />
    ) : tool.slug === "compress-pdf" ? (
      <CompressPdfTool />
    ) : tool.slug === "edit-pdf" ? (
      <EditPdfTool />
    ) : tool.slug === "jpg-to-pdf" ? (
      <JpgToPdfTool />
    ) : tool.slug === "pdf-to-jpg" ? (
      <PdfToJpgTool />
    ) : tool.slug === "pdf-to-excel" ? (
      <PdfToExcelTool />
    ) : tool.slug === "pdf-to-powerpoint" ? (
      <PdfToPowerPointTool />
    ) : tool.slug === "pdf-to-word" ? (
      <PdfToWordTool />
    ) : tool.slug === "word-to-pdf" ? (
      <WordToPdfTool />
    ) : null;

  const workspaceTitle =
    tool.slug === "merge-pdf"
      ? "Merge PDF Tool"
      : tool.slug === "split-pdf"
        ? "Split PDF Tool"
        : tool.slug === "compress-pdf"
          ? "Compress PDF Tool"
        : tool.slug === "edit-pdf"
          ? "Edit PDF Tool"
        : tool.slug === "jpg-to-pdf"
          ? "JPG to PDF Tool"
        : tool.slug === "pdf-to-jpg"
          ? "PDF to JPG Tool"
        : tool.slug === "pdf-to-excel"
          ? "PDF to Excel Tool"
        : tool.slug === "pdf-to-powerpoint"
          ? "PDF to PowerPoint Tool"
        : tool.slug === "pdf-to-word"
          ? "PDF to Word Tool"
        : tool.slug === "word-to-pdf"
          ? "Word to PDF Tool"
        : undefined;

  const workspaceDescription =
    tool.slug === "merge-pdf"
      ? "Upload multiple PDF files, arrange their order, and download one merged document without leaving the browser."
      : tool.slug === "split-pdf"
        ? "Upload one PDF, then extract selected pages or generate one PDF per page directly in your browser."
        : tool.slug === "compress-pdf"
          ? "Upload a PDF, choose a compression level, and download a smaller image-optimized version directly in your browser."
        : tool.slug === "edit-pdf"
          ? "Upload a PDF, click detected text lines to create editable overlays, add new text boxes, and export a revised PDF with the original text visually covered."
        : tool.slug === "jpg-to-pdf"
          ? "Upload JPG images, arrange them in order, choose a page layout, and export them as a single PDF directly in your browser."
        : tool.slug === "pdf-to-jpg"
          ? "Upload a PDF, choose the pages and JPG quality you need, and download each page as a separate JPG directly in your browser."
        : tool.slug === "pdf-to-excel"
          ? "Upload a table-style PDF, choose the pages and workbook structure you need, and download an Excel workbook directly in your browser."
        : tool.slug === "pdf-to-powerpoint"
          ? "Upload a PDF, choose the pages and slide quality you need, and download a PowerPoint deck with one page per slide directly in your browser."
        : tool.slug === "pdf-to-word"
          ? "Upload a text-based PDF, extract its editable text, and download a Word document directly in your browser."
        : tool.slug === "word-to-pdf"
          ? "Upload a .docx Word file, choose a PDF page size, and export a clean text-based PDF directly in your browser."
        : undefined;

  const overviewDescription = toolOverviewDescriptions[tool.slug];

  return (
    <>
      <JsonLd data={[breadcrumbSchema, appSchema, faqSchema]} />
      <ToolPageTemplate
        tool={tool}
        relatedTools={getRelatedTools(tool.slug)}
        faqs={faqs}
        overviewDescription={overviewDescription}
        workspace={workspace}
        workspaceTitle={workspaceTitle}
        workspaceDescription={workspaceDescription}
      />
    </>
  );
}
