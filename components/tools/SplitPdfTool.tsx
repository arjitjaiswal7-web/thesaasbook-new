"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  Files,
  LoaderCircle,
  Scissors,
  Upload,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type SplitMode = "extract" | "individual";

type SplitOutput = {
  id: string;
  name: string;
  url: string;
  label: string;
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
          pages.push(page - 1);
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
      pages.push(pageNumber - 1);
    }
  }

  return pages;
}

export default function SplitPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<SplitMode>("extract");
  const [pageSelection, setPageSelection] = useState("1-2");
  const [outputs, setOutputs] = useState<SplitOutput[]>([]);

  useEffect(() => {
    return () => {
      for (const output of outputs) {
        URL.revokeObjectURL(output.url);
      }
    };
  }, [outputs]);

  function clearOutputs() {
    setOutputs((currentOutputs) => {
      for (const output of currentOutputs) {
        URL.revokeObjectURL(output.url);
      }

      return [];
    });
  }

  async function loadFile(nextFile: File) {
    if (!(nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf"))) {
      setError("Please upload a valid PDF file.");
      return;
    }

    try {
      setError(null);
      clearOutputs();
      const bytes = await nextFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();

      setFile(nextFile);
      setPageCount(totalPages);
      setPageSelection(totalPages > 1 ? `1-${Math.min(totalPages, 2)}` : "1");
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

  async function handleSplit() {
    if (!file || !pageCount) {
      setError("Upload a PDF file before splitting.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    clearOutputs();

    try {
      const bytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(bytes);
      const baseName = sanitizeBaseName(file.name);

      if (mode === "extract") {
        const selectedPages = parsePageSelection(pageSelection, pageCount);
        const outputPdf = await PDFDocument.create();
        const copiedPages = await outputPdf.copyPages(sourcePdf, selectedPages);

        for (const page of copiedPages) {
          outputPdf.addPage(page);
        }

        const savedBytes = await outputPdf.save();
        const blob = new Blob([new Uint8Array(savedBytes)], { type: "application/pdf" });

        setOutputs([
          {
            id: crypto.randomUUID(),
            name: `${baseName}-pages-${pageSelection.replace(/\s+/g, "").replace(/,/g, "-")}.pdf`,
            url: URL.createObjectURL(blob),
            label: `Selected pages: ${pageSelection}`,
          },
        ]);
      } else {
        const nextOutputs: SplitOutput[] = [];

        for (let index = 0; index < pageCount; index += 1) {
          const outputPdf = await PDFDocument.create();
          const [copiedPage] = await outputPdf.copyPages(sourcePdf, [index]);

          outputPdf.addPage(copiedPage);

          const savedBytes = await outputPdf.save();
          const blob = new Blob([new Uint8Array(savedBytes)], { type: "application/pdf" });

          nextOutputs.push({
            id: crypto.randomUUID(),
            name: `${baseName}-page-${index + 1}.pdf`,
            url: URL.createObjectURL(blob),
            label: `Page ${index + 1}`,
          });
        }

        setOutputs(nextOutputs);
      }
    } catch (splitError) {
      setError(
        splitError instanceof Error
          ? splitError.message
          : "The PDF could not be split. Please try another file.",
      );
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
            Drag and drop a PDF here, then choose whether to extract selected pages or split the document into separate single-page PDFs.
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

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          Split mode
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={`rounded-2xl border p-4 transition ${mode === "extract" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
            <input
              type="radio"
              name="split-mode"
              value="extract"
              checked={mode === "extract"}
              onChange={() => setMode("extract")}
              className="sr-only"
            />
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Scissors className="h-4 w-4" aria-hidden="true" />
              Extract selected pages
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create one new PDF using the page numbers or ranges you enter below.
            </p>
          </label>

          <label className={`rounded-2xl border p-4 transition ${mode === "individual" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
            <input
              type="radio"
              name="split-mode"
              value="individual"
              checked={mode === "individual"}
              onChange={() => setMode("individual")}
              className="sr-only"
            />
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Files className="h-4 w-4" aria-hidden="true" />
              Split every page
            </span>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Generate a separate single-page PDF for each page in the document.
            </p>
          </label>
        </div>

        {mode === "extract" ? (
          <div className="mt-5">
            <label htmlFor="page-selection" className="text-sm font-medium text-slate-700">
              Pages to extract
            </label>
            <input
              id="page-selection"
              type="text"
              value={pageSelection}
              onChange={(event) => setPageSelection(event.target.value)}
              placeholder="Example: 1,3-5,8"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Use commas for separate pages and hyphens for ranges. Example: 1, 3-5, 8.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSplit}
          disabled={!file || isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isProcessing ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Scissors className="h-4 w-4" aria-hidden="true" />
          )}
          {isProcessing ? "Processing PDF..." : "Split PDF"}
        </button>
      </div>

      {outputs.length ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Download split files
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {outputs.length === 1
                ? "Your new PDF is ready to download."
                : `${outputs.length} PDF files are ready to download.`}
            </p>
          </div>
          <ul className="divide-y divide-slate-200">
            {outputs.map((output) => (
              <li
                key={output.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{output.label}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{output.name}</p>
                </div>
                <a
                  href={output.url}
                  download={output.name}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
