"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  ImageDown,
  LoaderCircle,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type CompressionLevel = "standard" | "strong" | "maximum";

type CompressionProfile = {
  label: string;
  description: string;
  renderScale: number;
  jpegQuality: number;
};

const compressionProfiles: Record<CompressionLevel, CompressionProfile> = {
  standard: {
    label: "Standard",
    description: "Balanced quality for general sharing and email attachments.",
    renderScale: 1.35,
    jpegQuality: 0.72,
  },
  strong: {
    label: "Strong",
    description: "Smaller files with more visible quality reduction.",
    renderScale: 1.05,
    jpegQuality: 0.52,
  },
  maximum: {
    label: "Maximum",
    description: "Smallest output size, best for scanned or image-based PDFs.",
    renderScale: 0.82,
    jpegQuality: 0.35,
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

function toPercentage(originalSize: number, newSize: number) {
  if (!originalSize || newSize >= originalSize) {
    return 0;
  }

  return Math.round(((originalSize - newSize) / originalSize) * 100);
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compression output could not be created."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

export default function CompressPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [level, setLevel] = useState<CompressionLevel>("standard");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPages, setProcessedPages] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("compressed-pdf.pdf");
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

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
    setCompressedSize(null);
  }

  async function loadFile(nextFile: File) {
    if (!(nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf"))) {
      setError("Please upload a valid PDF file.");
      return;
    }

    try {
      setError(null);
      resetDownload();
      const bytes = await nextFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      setFile(nextFile);
      setPageCount(pdf.getPageCount());
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

  async function handleCompress() {
    if (!file) {
      setError("Upload a PDF file before compressing it.");
      return;
    }

    setIsProcessing(true);
    setProcessedPages(0);
    setError(null);
    resetDownload();

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const profile = compressionProfiles[level];
      const sourceBytes = new Uint8Array(await file.arrayBuffer());
      const loadingTask = pdfjs.getDocument({ data: sourceBytes });
      const sourcePdf = await loadingTask.promise;
      const outputPdf = await PDFDocument.create();

      for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
        const sourcePage = await sourcePdf.getPage(pageNumber);
        const outputViewport = sourcePage.getViewport({ scale: 1 });
        const renderViewport = sourcePage.getViewport({ scale: profile.renderScale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas rendering is not available in this browser.");
        }

        canvas.width = Math.max(1, Math.floor(renderViewport.width));
        canvas.height = Math.max(1, Math.floor(renderViewport.height));

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await sourcePage.render({
          canvas,
          canvasContext: context,
          viewport: renderViewport,
        }).promise;

        const imageBlob = await canvasToBlob(canvas, profile.jpegQuality);
        const imageBytes = await imageBlob.arrayBuffer();
        const image = await outputPdf.embedJpg(imageBytes);
        const outputPage = outputPdf.addPage([outputViewport.width, outputViewport.height]);

        outputPage.drawImage(image, {
          x: 0,
          y: 0,
          width: outputViewport.width,
          height: outputViewport.height,
        });

        setProcessedPages(pageNumber);
      }

      await sourcePdf.destroy();

      const compressedBytes = await outputPdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(compressedBytes)], { type: "application/pdf" });

      setDownloadUrl(URL.createObjectURL(blob));
      setDownloadName(`${sanitizeBaseName(file.name)}-compressed.pdf`);
      setCompressedSize(blob.size);
    } catch (compressionError) {
      setError(
        compressionError instanceof Error
          ? compressionError.message
          : "The PDF could not be compressed. Please try another file.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  const reduction = file && compressedSize ? toPercentage(file.size, compressedSize) : 0;

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
            Compress a PDF by rebuilding each page as a lower-size image. This works best for scanned or image-heavy PDFs.
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
            This compression method converts each page into an image to reduce size. Output files may lose selectable text and searchability.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            File loaded
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            {file ? file.name : "No file selected"}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Total pages
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {pageCount ?? 0}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Original size
          </p>
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
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          Compression level
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.entries(compressionProfiles) as Array<[CompressionLevel, CompressionProfile]>).map(
            ([value, profile]) => (
              <label
                key={value}
                className={`rounded-2xl border p-4 transition ${
                  level === value ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="compression-level"
                  value={value}
                  checked={level === value}
                  onChange={() => {
                    setLevel(value);
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleCompress}
          disabled={!file || isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isProcessing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImageDown className="h-4 w-4" aria-hidden="true" />
          )}
          {isProcessing ? "Compressing PDF..." : "Compress PDF"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download compressed PDF
          </a>
        ) : null}
      </div>

      {isProcessing && pageCount ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>Processing pages</span>
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

      {file && compressedSize ? (
        <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Compressed size
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatFileSize(compressedSize)}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Size reduction
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{reduction}%</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Compression mode
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{compressionProfiles[level].label}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
