"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  FileText,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  Upload,
} from "lucide-react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

type PositionKey =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

type PageScope = "all" | "single";
type RotationMode = "none" | "left" | "right" | "flip";
type ColorKey = "navy" | "slate" | "green" | "red";

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

function getTextCoordinates(
  position: PositionKey,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
) {
  const padding = 36;

  const horizontal = {
    left: padding,
    center: Math.max((pageWidth - textWidth) / 2, padding / 2),
    right: Math.max(pageWidth - textWidth - padding, padding / 2),
  };

  const vertical = {
    top: Math.max(pageHeight - textHeight - padding, padding / 2),
    middle: Math.max((pageHeight - textHeight) / 2, padding / 2),
    bottom: padding,
  };

  switch (position) {
    case "top-left":
      return { x: horizontal.left, y: vertical.top };
    case "top-center":
      return { x: horizontal.center, y: vertical.top };
    case "top-right":
      return { x: horizontal.right, y: vertical.top };
    case "middle-center":
      return { x: horizontal.center, y: vertical.middle };
    case "bottom-left":
      return { x: horizontal.left, y: vertical.bottom };
    case "bottom-center":
      return { x: horizontal.center, y: vertical.bottom };
    case "bottom-right":
      return { x: horizontal.right, y: vertical.bottom };
  }
}

const positionOptions: Array<{ value: PositionKey; label: string }> = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "middle-center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
];

const colorOptions: Array<{ value: ColorKey; label: string }> = [
  { value: "navy", label: "Navy" },
  { value: "slate", label: "Slate" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
];

const colorMap = {
  navy: rgb(0.06, 0.12, 0.28),
  slate: rgb(0.2, 0.24, 0.31),
  green: rgb(0.1, 0.42, 0.25),
  red: rgb(0.72, 0.12, 0.12),
} satisfies Record<ColorKey, ReturnType<typeof rgb>>;

const rotationMap = {
  none: 0,
  left: -90,
  right: 90,
  flip: 180,
} satisfies Record<RotationMode, number>;

export default function EditPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState("Reviewed by TheSaaSBook");
  const [pageScope, setPageScope] = useState<PageScope>("all");
  const [pageNumber, setPageNumber] = useState("1");
  const [position, setPosition] = useState<PositionKey>("bottom-right");
  const [fontSize, setFontSize] = useState(20);
  const [color, setColor] = useState<ColorKey>("navy");
  const [rotation, setRotation] = useState<RotationMode>("none");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("edited-pdf.pdf");

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
      setPageNumber("1");
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

  async function handleEdit() {
    if (!file || !pageCount) {
      setError("Upload a PDF file before applying edits.");
      return;
    }

    const trimmedText = text.trim();

    if (!trimmedText && rotation === "none") {
      setError("Add some text or choose a rotation before applying edits.");
      return;
    }

    let targetPageIndex = 0;

    if (pageScope === "single") {
      targetPageIndex = Number.parseInt(pageNumber, 10) - 1;

      if (!Number.isInteger(targetPageIndex) || targetPageIndex < 0 || targetPageIndex >= pageCount) {
        setError(`Enter a page number between 1 and ${pageCount}.`);
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    resetDownload();

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);

      if (rotation !== "none") {
        const rotationDelta = rotationMap[rotation];

        for (const page of pages) {
          const currentAngle = page.getRotation().angle;
          page.setRotation(degrees(currentAngle + rotationDelta));
        }
      }

      if (trimmedText) {
        const targetPages = pageScope === "all" ? pages : [pages[targetPageIndex]];

        for (const page of targetPages) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(trimmedText, fontSize);
          const textHeight = font.heightAtSize(fontSize);
          const { x, y } = getTextCoordinates(position, width, height, textWidth, textHeight);

          page.drawText(trimmedText, {
            x,
            y,
            size: fontSize,
            font,
            color: colorMap[color],
            opacity: 0.9,
          });
        }
      }

      const editedBytes = await pdf.save();
      const blob = new Blob([new Uint8Array(editedBytes)], { type: "application/pdf" });

      setDownloadUrl(URL.createObjectURL(blob));
      setDownloadName(`${sanitizeBaseName(file.name)}-edited.pdf`);
    } catch {
      setError("The PDF could not be updated. Please try another file.");
    } finally {
      setIsProcessing(false);
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
            Add text annotations, stamp key notes, and rotate the document before downloading the updated PDF.
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
            File size
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

      <div className="grid gap-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6 lg:grid-cols-2">
        <div>
          <label htmlFor="edit-text" className="text-sm font-medium text-slate-700">
            Text to add
          </label>
          <textarea
            id="edit-text"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              resetDownload();
            }}
            rows={4}
            placeholder="Add a note, signature label, or review stamp"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="text-position" className="text-sm font-medium text-slate-700">
                Text position
              </label>
              <select
                id="text-position"
                value={position}
                onChange={(event) => {
                  setPosition(event.target.value as PositionKey);
                  resetDownload();
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                {positionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="text-color" className="text-sm font-medium text-slate-700">
                Text color
              </label>
              <select
                id="text-color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value as ColorKey);
                  resetDownload();
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              >
                {colorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="font-size" className="text-sm font-medium text-slate-700">
                Font size
              </label>
              <span className="text-sm font-semibold text-slate-950">{fontSize}px</span>
            </div>
            <input
              id="font-size"
              type="range"
              min="12"
              max="48"
              step="1"
              value={fontSize}
              onChange={(event) => {
                setFontSize(Number(event.target.value));
                resetDownload();
              }}
              className="mt-3 w-full accent-slate-950"
            />
          </div>
        </div>

        <div>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Apply text to</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className={`rounded-2xl border p-4 transition ${pageScope === "all" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
                <input
                  type="radio"
                  name="page-scope"
                  value="all"
                  checked={pageScope === "all"}
                  onChange={() => {
                    setPageScope("all");
                    resetDownload();
                  }}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  All pages
                </span>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add the same text to every page in the document.
                </p>
              </label>

              <label className={`rounded-2xl border p-4 transition ${pageScope === "single" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
                <input
                  type="radio"
                  name="page-scope"
                  value="single"
                  checked={pageScope === "single"}
                  onChange={() => {
                    setPageScope("single");
                    resetDownload();
                  }}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <PencilLine className="h-4 w-4" aria-hidden="true" />
                  One page only
                </span>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Target a specific page number for a single-page edit.
                </p>
              </label>
            </div>
          </fieldset>

          {pageScope === "single" ? (
            <div className="mt-5">
              <label htmlFor="page-number" className="text-sm font-medium text-slate-700">
                Page number
              </label>
              <input
                id="page-number"
                type="number"
                min="1"
                max={pageCount ?? 1}
                value={pageNumber}
                onChange={(event) => {
                  setPageNumber(event.target.value);
                  resetDownload();
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          ) : null}

          <div className="mt-5">
            <label htmlFor="rotation" className="text-sm font-medium text-slate-700">
              Rotate document
            </label>
            <select
              id="rotation"
              value={rotation}
              onChange={(event) => {
                setRotation(event.target.value as RotationMode);
                resetDownload();
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            >
              <option value="none">No rotation</option>
              <option value="left">Rotate left 90°</option>
              <option value="right">Rotate right 90°</option>
              <option value="flip">Rotate 180°</option>
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Rotation is applied across the full document.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleEdit}
          disabled={!file || isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isProcessing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <PencilLine className="h-4 w-4" aria-hidden="true" />
          )}
          {isProcessing ? "Applying edits..." : "Apply edits"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download edited PDF
          </a>
        ) : null}

        {file ? (
          <button
            type="button"
            onClick={() => {
              setText("Reviewed by TheSaaSBook");
              setPageScope("all");
              setPageNumber("1");
              setPosition("bottom-right");
              setFontSize(20);
              setColor("navy");
              setRotation("none");
              resetDownload();
              setError(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset options
          </button>
        ) : null}
      </div>
    </div>
  );
}
