"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  FileText,
  LoaderCircle,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

type TextContentItem = {
  str?: string;
  transform?: number[];
  hasEOL?: boolean;
};

type LineBucket = {
  y: number;
  parts: Array<{ x: number; text: string }>;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeBaseName(fileName: string) {
  return fileName.replace(/\.pdf$/i, "").replace(/[^a-z0-9-_]+/gi, "-") || "document";
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildPageText(items: TextContentItem[]) {
  const lines: LineBucket[] = [];

  for (const item of items) {
    const rawText = item.str ?? "";
    const text = normalizeText(rawText);

    if (!text) {
      continue;
    }

    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    const existingLine = lines.find((line) => Math.abs(line.y - y) < 4);

    if (existingLine) {
      existingLine.parts.push({ x, text });
    } else {
      lines.push({
        y,
        parts: [{ x, text }],
      });
    }
  }

  return lines
    .sort((a, b) => b.y - a.y)
    .map((line) =>
      normalizeText(
        line.parts
          .sort((a, b) => a.x - b.x)
          .map((part) => part.text)
          .join(" "),
      ),
    )
    .filter(Boolean);
}

export default function PdfToWordTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [processedPages, setProcessedPages] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("pdf-to-word.docx");
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [extractMode, setExtractMode] = useState<"page-sections" | "continuous">("page-sections");

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  function resetDownload() {
    setDownloadUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
    setOutputSize(null);
  }

  async function loadFile(nextFile: File) {
    if (!(nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf"))) {
      setError("Please upload a valid PDF file.");
      return;
    }

    try {
      setError(null);
      resetDownload();
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await nextFile.arrayBuffer()) });
      const pdf = await loadingTask.promise;

      setFile(nextFile);
      setPageCount(pdf.numPages);
      await pdf.destroy();
    } catch {
      setFile(null);
      setPageCount(null);
      setError("This PDF could not be opened. Please use a valid, unlocked PDF file.");
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];

    if (nextFile) {
      void loadFile(nextFile);
      event.target.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const nextFile = event.dataTransfer.files?.[0];

    if (nextFile) {
      void loadFile(nextFile);
    }
  }

  async function handleConvert() {
    if (!file) {
      setError("Upload a PDF file before converting it.");
      return;
    }

    setIsConverting(true);
    setProcessedPages(0);
    setError(null);
    resetDownload();

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await loadingTask.promise;
      const paragraphs: Paragraph[] = [];
      let extractedLines = 0;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const lines = buildPageText(textContent.items as TextContentItem[]);

        if (extractMode === "page-sections") {
          paragraphs.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 180 },
              children: [new TextRun(`Page ${pageNumber}`)],
            }),
          );
        }

        if (lines.length) {
          for (const line of lines) {
            paragraphs.push(
              new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun(line)],
              }),
            );
          }
          extractedLines += lines.length;
        } else if (extractMode === "page-sections") {
          paragraphs.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: "No editable text was detected on this page.",
                  italics: true,
                }),
              ],
            }),
          );
        }

        if (extractMode === "page-sections" && pageNumber < pdf.numPages) {
          paragraphs.push(new Paragraph({ spacing: { after: 240 } }));
        }

        setProcessedPages(pageNumber);
      }

      await pdf.destroy();

      if (!extractedLines) {
        throw new Error(
          "No editable text was found in this PDF. This usually means the file is scanned or image-based and needs OCR before Word conversion.",
        );
      }

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                heading: HeadingLevel.TITLE,
                spacing: { after: 240 },
                children: [new TextRun(file.name.replace(/\.pdf$/i, ""))],
              }),
              ...paragraphs,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setDownloadName(`${sanitizeBaseName(file.name)}.docx`);
      setOutputSize(blob.size);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The PDF could not be converted to Word. Please try another file.",
      );
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-[1.5rem] border border-dashed px-6 py-10 text-center transition sm:px-10 ${
          isDragging ? "border-sky-400 bg-sky-50" : "border-slate-300 bg-slate-50"
        }`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm shadow-slate-200/70">
            <Upload className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            Upload one PDF file
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Convert text-based PDFs into editable Word documents directly in your browser.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Select PDF file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            This converter extracts the PDF text layer and rebuilds it as a Word document. Scanned or image-only PDFs will usually need OCR before they can be converted accurately.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">File loaded</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            {file ? file.name : "No file selected"}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total pages</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{pageCount ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Original size</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {file ? formatFileSize(file.size) : "0 B"}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">Output structure</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label
            className={`rounded-2xl border p-4 transition ${
              extractMode === "page-sections" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="extract-mode"
              value="page-sections"
              checked={extractMode === "page-sections"}
              onChange={() => {
                setExtractMode("page-sections");
                resetDownload();
              }}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-slate-950">Page sections</span>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Adds page headings so the extracted Word document stays easier to review.
            </p>
          </label>

          <label
            className={`rounded-2xl border p-4 transition ${
              extractMode === "continuous" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="extract-mode"
              value="continuous"
              checked={extractMode === "continuous"}
              onChange={() => {
                setExtractMode("continuous");
                resetDownload();
              }}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-slate-950">Continuous text</span>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Outputs a simpler Word document with fewer structural markers between pages.
            </p>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleConvert}
          disabled={!file || isConverting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isConverting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}
          {isConverting ? "Converting PDF..." : "PDF to Word"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Word file
          </a>
        ) : null}
      </div>

      {isConverting && pageCount ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>Extracting text</span>
            <span>
              {processedPages} / {pageCount}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-950 transition-all"
              style={{ width: `${pageCount ? (processedPages / pageCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {outputSize ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Word file size</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatFileSize(outputSize)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
