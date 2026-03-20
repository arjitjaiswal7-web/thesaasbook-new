"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FilePlus2,
  Image as ImageIcon,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type PageMode = "match-image" | "a4-auto";

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const A4_PORTRAIT = { width: 595.28, height: 841.89 };
const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

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
  return fileName.replace(/\.(jpg|jpeg)$/i, "").replace(/[^a-z0-9-_]+/gi, "-") || "images";
}

function isJpg(file: File) {
  return (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    /\.(jpg|jpeg)$/i.test(file.name)
  );
}

export default function JpgToPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>("a4-auto");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("jpg-to-pdf.pdf");

  useEffect(() => {
    return () => {
      for (const image of images) {
        URL.revokeObjectURL(image.previewUrl);
      }

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [images, downloadUrl]);

  const totalSize = images.reduce((sum, item) => sum + item.file.size, 0);

  function resetDownload() {
    setDownloadUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
  }

  function appendFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(isJpg);

    if (!incoming.length) {
      setError("Please upload JPG or JPEG images only.");
      return;
    }

    setError(null);
    resetDownload();

    setImages((currentImages) => {
      const seen = new Set(
        currentImages.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`),
      );
      const nextImages = [...currentImages];

      for (const file of incoming) {
        const signature = `${file.name}-${file.size}-${file.lastModified}`;

        if (seen.has(signature)) {
          continue;
        }

        seen.add(signature);
        nextImages.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }

      return nextImages;
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      appendFiles(event.target.files);
      event.target.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      appendFiles(event.dataTransfer.files);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((currentImages) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= currentImages.length) {
        return currentImages;
      }

      const nextImages = [...currentImages];
      const [item] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, item);
      return nextImages;
    });
    resetDownload();
  }

  function removeImage(id: string) {
    setImages((currentImages) => {
      const target = currentImages.find((item) => item.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return currentImages.filter((item) => item.id !== id);
    });
    resetDownload();
  }

  async function handleConvert() {
    if (!images.length) {
      setError("Add at least one JPG image to create a PDF.");
      return;
    }

    setIsConverting(true);
    setError(null);
    resetDownload();

    try {
      const pdf = await PDFDocument.create();

      for (const item of images) {
        const imageBytes = await item.file.arrayBuffer();
        const embeddedImage = await pdf.embedJpg(imageBytes);
        const imageDimensions = embeddedImage.scale(1);

        if (pageMode === "match-image") {
          const page = pdf.addPage([imageDimensions.width, imageDimensions.height]);

          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imageDimensions.width,
            height: imageDimensions.height,
          });

          continue;
        }

        const pageSize =
          imageDimensions.width > imageDimensions.height ? A4_LANDSCAPE : A4_PORTRAIT;
        const page = pdf.addPage([pageSize.width, pageSize.height]);
        const margin = 24;
        const availableWidth = pageSize.width - margin * 2;
        const availableHeight = pageSize.height - margin * 2;
        const scale = Math.min(
          availableWidth / imageDimensions.width,
          availableHeight / imageDimensions.height,
        );
        const width = imageDimensions.width * scale;
        const height = imageDimensions.height * scale;
        const x = (pageSize.width - width) / 2;
        const y = (pageSize.height - height) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width,
          height,
        });
      }

      const pdfBytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setDownloadName(`${sanitizeBaseName(images[0]?.file.name ?? "images")}.pdf`);
    } catch {
      setError("The images could not be converted. Please try again with valid JPG files.");
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
            Upload JPG images
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Drag and drop one or more JPG files here, arrange them in order, and export them as a single PDF.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Select JPG files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,.jpg,.jpeg"
            multiple
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Images added
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{images.length}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Total size
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {images.length ? formatFileSize(totalSize) : "0 B"}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Output
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">Single PDF document</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">Page layout</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label
            className={`rounded-2xl border p-4 transition ${
              pageMode === "a4-auto" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="page-mode"
              value="a4-auto"
              checked={pageMode === "a4-auto"}
              onChange={() => {
                setPageMode("a4-auto");
                resetDownload();
              }}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-slate-950">Auto A4 pages</span>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fits each image onto an A4 page with automatic portrait or landscape orientation.
            </p>
          </label>

          <label
            className={`rounded-2xl border p-4 transition ${
              pageMode === "match-image" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="page-mode"
              value="match-image"
              checked={pageMode === "match-image"}
              onChange={() => {
                setPageMode("match-image");
                resetDownload();
              }}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-slate-950">Match image size</span>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keeps each page sized to the original image dimensions for a direct image-to-PDF export.
            </p>
          </label>
        </div>
      </div>

      {images.length ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Arrange image order</h3>
            <p className="mt-1 text-sm text-slate-600">
              The list order will be used when generating the PDF.
            </p>
          </div>
          <ul className="divide-y divide-slate-200">
            {images.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {/* Blob preview URLs are not supported by next/image, so this stays as a plain img. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {index + 1}. {item.file.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{formatFileSize(item.file.size)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0 || isConverting}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1 || isConverting}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    disabled={isConverting}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleConvert}
          disabled={!images.length || isConverting}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isConverting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {isConverting ? "Creating PDF..." : "JPG to PDF"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF
          </a>
        ) : null}
      </div>
    </div>
  );
}
