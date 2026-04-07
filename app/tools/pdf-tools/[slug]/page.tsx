import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ToolPageTemplate from "@/components/ToolPageTemplate";
import PdfToolWorkspace from "@/components/tools/PdfToolWorkspace";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import { getPdfToolBySlug, getRelatedTools, getToolFaqs, pdfTools } from "@/lib/tools";

const toolDetailContent: Record<
  string,
  {
    intro: string;
    highlights: string[];
    useCases: string[];
  }
> = {
  "merge-pdf": {
    intro:
      "Merge PDF is built for situations where multiple files need to become one clean document without reformatting pages by hand.",
    highlights: [
      "Combine contracts, reports, invoices, or supporting documents into a single shareable PDF.",
      "Keep the original page order under your control before export.",
      "Avoid re-saving pages manually in desktop software just to create one final file.",
    ],
    useCases: [
      "Sending one complete proposal instead of several attachments.",
      "Preparing signed PDFs and appendices for clients or legal review.",
      "Bundling monthly reports into one downloadable archive document.",
    ],
  },
  "split-pdf": {
    intro:
      "Split PDF is useful when one large file contains only a few pages you actually need to reuse, share, or archive separately.",
    highlights: [
      "Extract exact pages or ranges without rebuilding the document from scratch.",
      "Create smaller PDFs that are easier to email, review, or store.",
      "Keep the original page quality and layout while removing unnecessary pages.",
    ],
    useCases: [
      "Sharing only the relevant chapter, invoice, or appendix from a large PDF.",
      "Creating one file per page for approvals or signatures.",
      "Separating mixed-source scans into smaller documents for team workflows.",
    ],
  },
  "edit-pdf": {
    intro:
      "Edit PDF focuses on quick browser-based content adjustments when you need a revised-looking PDF without opening heavier desktop software.",
    highlights: [
      "Overlay updated text on top of detected PDF lines directly in the browser.",
      "Add new text boxes where the original document needs a visible revision.",
      "Export a revised PDF that keeps the page layout visually consistent.",
    ],
    useCases: [
      "Correcting names, labels, or visible text in a finalized PDF.",
      "Updating a quote, proposal, or form before resending it.",
      "Making fast content edits when the source file is no longer available.",
    ],
  },
  "compress-pdf": {
    intro:
      "Compress PDF helps reduce oversized documents so they are easier to upload, share, and attach while staying readable.",
    highlights: [
      "Lower PDF file size for portals, forms, and email attachments.",
      "Choose a compression level based on how much size reduction you need.",
      "Handle large image-heavy PDFs entirely in the browser.",
    ],
    useCases: [
      "Submitting PDFs to websites with strict upload limits.",
      "Reducing document weight before emailing clients or teams.",
      "Optimizing scanned files for faster downloads and storage.",
    ],
  },
  "jpg-to-pdf": {
    intro:
      "JPG to PDF converts scattered images into one document, which is often easier to print, share, and archive than separate files.",
    highlights: [
      "Combine one or many JPG images into a single PDF document.",
      "Control image order before export so pages appear correctly.",
      "Create cleaner, more professional files from screenshots or photo scans.",
    ],
    useCases: [
      "Turning scanned pages or photographed documents into one PDF.",
      "Sending receipts, proofs, or image-based forms in document format.",
      "Creating printable PDFs from image sets for operations or admin work.",
    ],
  },
  "pdf-to-word": {
    intro:
      "PDF to Word is meant for text-based PDFs that need rewriting, updating, or reuse in an editable document format.",
    highlights: [
      "Extract editable text from PDF files into a Word document.",
      "Reduce the manual copy-paste work required to revise old PDFs.",
      "Preserve enough structure to make follow-up editing faster.",
    ],
    useCases: [
      "Updating contracts, proposals, or internal documents from existing PDFs.",
      "Reusing text from report PDFs in editable office workflows.",
      "Making content revisions when only the exported PDF is available.",
    ],
  },
  "word-to-pdf": {
    intro:
      "Word to PDF is designed for turning editable .docx files into stable PDFs that look consistent across devices and recipients.",
    highlights: [
      "Convert Word documents into a fixed-layout PDF for sharing.",
      "Keep the output easier to print and distribute than editable source files.",
      "Generate browser-side PDFs without needing office software on the device.",
    ],
    useCases: [
      "Sending resumes, proposals, or client documents in final format.",
      "Publishing internal documents that should not be casually edited.",
      "Creating stable document outputs for review and sign-off.",
    ],
  },
  "pdf-to-jpg": {
    intro:
      "PDF to JPG is useful when a PDF page needs to become an image for slides, web uploads, previews, or sharing in visual form.",
    highlights: [
      "Export selected PDF pages as image files instead of documents.",
      "Choose page ranges and quality for the output you need.",
      "Make PDF content easier to drop into websites, presentations, or chats.",
    ],
    useCases: [
      "Turning brochure pages or reports into presentation visuals.",
      "Sharing a document page quickly as an image preview.",
      "Using PDF content inside design, ad, or CMS workflows.",
    ],
  },
  "pdf-to-excel": {
    intro:
      "PDF to Excel is built for table-heavy PDFs where the goal is to move structured data into a spreadsheet for sorting, cleanup, or analysis.",
    highlights: [
      "Convert table-like PDF content into editable spreadsheet rows.",
      "Choose page ranges and workbook structure before export.",
      "Reduce manual spreadsheet entry when source data is locked in a PDF.",
    ],
    useCases: [
      "Extracting invoice, report, or statement tables into Excel.",
      "Preparing spreadsheet data from client PDFs for analysis.",
      "Moving operational or financial tables into editable workflows.",
    ],
  },
  "pdf-to-powerpoint": {
    intro:
      "PDF to PowerPoint is aimed at turning presentation-like PDFs into a deck format that is easier to present, reuse, or adapt slide by slide.",
    highlights: [
      "Convert PDF pages into a PowerPoint deck with one page per slide.",
      "Keep the original visual structure close to the source document.",
      "Reuse PDF-based content in meeting, sales, or reporting workflows.",
    ],
    useCases: [
      "Rebuilding a presentation when only the PDF export remains.",
      "Using PDF-based pitch decks inside PowerPoint workflows.",
      "Turning document pages into presentation-ready slides quickly.",
    ],
  },
};

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
    robots: {
      index: true,
      follow: true,
    },
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
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl(tool.href),
    isAccessibleForFree: true,
    featureList: toolDetailContent[tool.slug]?.highlights ?? tool.howToSteps,
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

  const workspace = <PdfToolWorkspace slug={tool.slug} />;

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
  const detailContent = toolDetailContent[tool.slug];

  const detailsSection = detailContent ? (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
        What this {tool.name.toLowerCase()} tool helps you do
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {detailContent.intro}
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-950">Key benefits</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {detailContent.highlights.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-950">Common use cases</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {detailContent.useCases.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-950" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  ) : undefined;

  return (
    <>
      <JsonLd data={[breadcrumbSchema, appSchema, faqSchema]} />
      <ToolPageTemplate
        tool={tool}
        relatedTools={getRelatedTools(tool.slug)}
        faqs={faqs}
        overviewDescription={overviewDescription}
        detailsSection={detailsSection}
        workspace={workspace}
        workspaceTitle={workspaceTitle}
        workspaceDescription={workspaceDescription}
      />
    </>
  );
}
