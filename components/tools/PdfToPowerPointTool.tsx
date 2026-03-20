"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  LoaderCircle,
  Presentation,
  ShieldAlert,
  Upload,
} from "lucide-react";
import PptxGenJS from "pptxgenjs";

type QualityLevel = "standard" | "high" | "maximum";

type QualityProfile = {
  label: string;
  description: string;
  renderScale: number;
  jpegQuality: number;
};

const qualityProfiles: Record<QualityLevel, QualityProfile> = {
  standard: {
    label: "Standard",
    description: "Balanced output for smaller PowerPoint files.",
    renderScale: 1.3,
    jpegQuality: 0.72,
  },
  high: {
    label: "High",
    description: "Sharper slides for normal presentation use.",
    renderScale: 1.8,
    jpegQuality: 0.84,
  },
  maximum: {
    label: "Maximum",
    description: "Highest slide fidelity with larger file size.",
    renderScale: 2.3,
    jpegQuality: 0.92,
  },
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

function parsePageSelection(input: string, totalPages: number) {
  const tokens = input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) {
    throw new Error("Enter at least one page number or range.");
  }

  const pages: number[] = [];
  const seen = new Set<number>();

  for (const token of tokens) {
    if (token.includes("-")) {
      const [startValue, endValue] = token.split("-").map((value) => Number.parseInt(value.trim(), 10));

      if (!Number.isInteger(startValue) || !Number.isInteger(endValue) || startValue < 1 || endValue < 1) {
        throw new Error(`Invalid page range: ${token}`);
      }

      if (startValue > endValue) {
        throw new Error(`Range start must be before range end: ${token}`);
      }

      if (endValue > totalPages) {
        throw new Error(`Page range ${token} exceeds the document length.`);
      }

      for (let page = startValue; page <= endValue; page += 1) {
        if (!seen.has(page)) {
          seen.add(page);
          pages.push(page);
        }
      }

      continue;
    }

    const pageNumber = Number.parseInt(token, 10);

    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      throw new Error(`Invalid page number: ${token}`);
    }

    if (!seen.has(pageNumber)) {
      seen.add(pageNumber);
      pages.push(pageNumber);
    }
  }

  return pages;
}

export default function PdfToPowerPointTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quality, setQuality] = useState<QualityLevel>("high");
  const [pageSelection, setPageSelection] = useState("1");
  const [isConverting, setIsConverting] = useState(false);
  const [processedPages, setProcessedPages] = useState(0);
  const [targetPages, setTargetPages] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("pdf-to-powerpoint.pptx");
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [slideCount, setSlideCount] = useState<number | null>(null);

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
    setSlideCount(null);
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
      setPageSelection(pdf.numPages > 1 ? `1-${Math.min(pdf.numPages, 3)}` : "1");
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
    if (!file || !pageCount) {
      setError("Upload a PDF file before converting it.");
      return;
    }

    setIsConverting(true);
    setProcessedPages(0);
    setError(null);
    resetDownload();

    try {
      const pagesToRender = parsePageSelection(pageSelection, pageCount);
      setTargetPages(pagesToRender.length);

      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await loadingTask.promise;
      const profile = qualityProfiles[quality];
      const pptx = new PptxGenJS();

      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "TheSaaSBook";
      pptx.company = "TheSaaSBook";
      pptx.subject = "PDF to PowerPoint export";
      pptx.title = file.name.replace(/\.pdf$/i, "");

      const slideWidth = 13.33;
      const slideHeight = 7.5;
      const margin = 0.24;

      for (let index = 0; index < pagesToRender.length; index += 1) {
        const pageNumber = pagesToRender[index];
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: profile.renderScale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas rendering is not available in this browser.");
        }

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const imageDataUrl = canvas.toDataURL("image/jpeg", profile.jpegQuality);
        const imageAspectRatio = canvas.width / canvas.height;
        const maxWidth = slideWidth - margin * 2;
        const maxHeight = slideHeight - margin * 2;
        let renderWidth = maxWidth;
        let renderHeight = renderWidth / imageAspectRatio;

        if (renderHeight > maxHeight) {
          renderHeight = maxHeight;
          renderWidth = renderHeight * imageAspectRatio;
        }

        const x = (slideWidth - renderWidth) / 2;
        const y = (slideHeight - renderHeight) / 2;
        const slide = pptx.addSlide();

        slide.background = { color: "FFFFFF" };
        slide.addImage({
          data: imageDataUrl,
          x,
          y,
          w: renderWidth,
          h: renderHeight,
        });

        slide.addText(`Page ${pageNumber}`, {
          x: margin,
          y: 0.12,
          w: 2.4,
          h: 0.28,
          fontFace: "Aptos",
          fontSize: 8,
          color: "4B5563",
          margin: 0,
        });

        setProcessedPages(index + 1);
      }

      await pdf.destroy();

      const output = await pptx.write({ outputType: "blob", compression: true });
      const blob = output instanceof Blob ? output : new Blob([output as ArrayBuffer]);
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setDownloadName(`${sanitizeBaseName(file.name)}.pptx`);
      setOutputSize(blob.size);
      setSlideCount(pagesToRender.length);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The PDF could not be converted to PowerPoint. Please try another file.",
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
            Convert selected PDF pages into a PowerPoint deck with one page per slide.
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
            This converter creates image-based slides. That keeps the page look intact, but the resulting PowerPoint content is not individually editable like native text boxes or charts.
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

      <div className="grid gap-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6 lg:grid-cols-2">
        <div>
          <label htmlFor="page-selection" className="text-sm font-medium text-slate-700">
            Pages to convert
          </label>
          <input
            id="page-selection"
            type="text"
            value={pageSelection}
            onChange={(event) => {
              setPageSelection(event.target.value);
              resetDownload();
            }}
            placeholder="Example: 1,3-5,8"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Use commas for separate pages and hyphens for ranges. Example: 1, 3-5, 8.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700">Slide quality</h3>
          <div className="mt-2 grid gap-3">
            {(Object.entries(qualityProfiles) as Array<[QualityLevel, QualityProfile]>).map(
              ([value, profile]) => (
                <label
                  key={value}
                  className={`rounded-2xl border p-4 transition ${
                    quality === value ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="quality-level"
                    value={value}
                    checked={quality === value}
                    onChange={() => {
                      setQuality(value);
                      resetDownload();
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-slate-950">{profile.label}</span>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{profile.description}</p>
                </label>
              ),
            )}
          </div>
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
            <Presentation className="h-4 w-4" aria-hidden="true" />
          )}
          {isConverting ? "Building deck..." : "PDF to PowerPoint"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PowerPoint
          </a>
        ) : null}
      </div>

      {isConverting && targetPages ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>Processing pages</span>
            <span>
              {processedPages} / {targetPages}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-950 transition-all"
              style={{ width: `${targetPages ? (processedPages / targetPages) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {outputSize ? (
        <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:p-5">
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Deck size</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatFileSize(outputSize)}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Slides generated</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{slideCount ?? 0}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
