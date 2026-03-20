"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  FileSpreadsheet,
  LoaderCircle,
  ShieldAlert,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";

type ColumnMode = "tight" | "balanced" | "wide";
type SheetMode = "per-page" | "single-sheet";

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

type RowBucket = {
  y: number;
  items: Array<{
    text: string;
    x: number;
    width: number;
    height: number;
  }>;
};

const columnModes: Record<ColumnMode, { label: string; threshold: number; description: string }> = {
  tight: {
    label: "Tight",
    threshold: 12,
    description: "Best when table columns sit close together.",
  },
  balanced: {
    label: "Balanced",
    threshold: 20,
    description: "A sensible default for most table-style PDFs.",
  },
  wide: {
    label: "Wide",
    threshold: 32,
    description: "Best when columns are clearly separated by large gaps.",
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

function sanitizeSheetName(name: string) {
  return name.replace(/[\\/?*\[\]:]/g, " ").trim().slice(0, 31) || "Sheet";
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

function bucketRows(items: PdfTextItem[]) {
  const rows: RowBucket[] = [];

  for (const item of items) {
    const text = item.str?.replace(/\s+/g, " ").trim() ?? "";

    if (!text) {
      continue;
    }

    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    const width = item.width ?? 0;
    const height = item.height ?? 10;
    const row = rows.find((candidate) => Math.abs(candidate.y - y) < Math.max(4, height * 0.45));

    if (row) {
      row.items.push({ text, x, width, height });
    } else {
      rows.push({
        y,
        items: [{ text, x, width, height }],
      });
    }
  }

  return rows.sort((a, b) => b.y - a.y);
}

function rowToCells(row: RowBucket, threshold: number) {
  const sortedItems = [...row.items].sort((a, b) => a.x - b.x);
  const cells: string[] = [];
  let currentCell = "";
  let currentRightEdge = 0;
  let currentGapThreshold = threshold;

  for (const item of sortedItems) {
    const gap = item.x - currentRightEdge;

    if (currentCell && gap > currentGapThreshold) {
      cells.push(currentCell.trim());
      currentCell = item.text;
    } else {
      currentCell = currentCell ? `${currentCell} ${item.text}` : item.text;
    }

    currentRightEdge = item.x + item.width;
    currentGapThreshold = Math.max(threshold, item.height * 0.8);
  }

  if (currentCell) {
    cells.push(currentCell.trim());
  }

  return cells.filter((cell) => cell.length > 0);
}

export default function PdfToExcelTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageSelection, setPageSelection] = useState("1");
  const [columnMode, setColumnMode] = useState<ColumnMode>("balanced");
  const [sheetMode, setSheetMode] = useState<SheetMode>("per-page");
  const [isConverting, setIsConverting] = useState(false);
  const [processedPages, setProcessedPages] = useState(0);
  const [targetPages, setTargetPages] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("pdf-to-excel.xlsx");
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [extractedRows, setExtractedRows] = useState<number | null>(null);

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
    setExtractedRows(null);
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
      const pagesToProcess = parsePageSelection(pageSelection, pageCount);
      setTargetPages(pagesToProcess.length);

      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const pdf = await loadingTask.promise;
      const workbook = XLSX.utils.book_new();
      const combinedRows: Array<Array<string | number>> = [];
      let totalRows = 0;

      for (let index = 0; index < pagesToProcess.length; index += 1) {
        const pageNumber = pagesToProcess[index];
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const rows = bucketRows(textContent.items as PdfTextItem[])
          .map((row) => rowToCells(row, columnModes[columnMode].threshold))
          .filter((row) => row.length > 0);

        totalRows += rows.length;

        if (sheetMode === "per-page") {
          const worksheet = XLSX.utils.aoa_to_sheet(
            rows.length ? rows : [[`No table-like text was detected on page ${pageNumber}.`]],
          );

          XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(`Page ${pageNumber}`));
        } else {
          combinedRows.push([`Page ${pageNumber}`]);
          combinedRows.push(...rows);
          combinedRows.push([]);
        }

        setProcessedPages(index + 1);
      }

      await pdf.destroy();

      if (!totalRows) {
        throw new Error(
          "No table-like text was found in this PDF. This tool works best on text-based reports and tables, not scanned pages or image-only PDFs.",
        );
      }

      if (sheetMode === "single-sheet") {
        const worksheet = XLSX.utils.aoa_to_sheet(combinedRows);

        XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName("Extracted Data"));
      }

      const workbookArray = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([workbookArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setDownloadName(`${sanitizeBaseName(file.name)}.xlsx`);
      setOutputSize(blob.size);
      setExtractedRows(totalRows);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The PDF could not be converted to Excel. Please try another file.",
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
            Extract table-like text into an Excel workbook directly in your browser.
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
            This converter is designed for text-based tables and reports. Scanned PDFs, screenshots, and heavily designed layouts usually need OCR or a server-side parser for reliable Excel output.
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
            Pages to extract
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
          <h3 className="text-sm font-medium text-slate-700">Workbook structure</h3>
          <div className="mt-2 grid gap-3">
            <label
              className={`rounded-2xl border p-4 transition ${
                sheetMode === "per-page" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="sheet-mode"
                value="per-page"
                checked={sheetMode === "per-page"}
                onChange={() => {
                  setSheetMode("per-page");
                  resetDownload();
                }}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-slate-950">One sheet per page</span>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Creates a separate worksheet for each selected PDF page.
              </p>
            </label>

            <label
              className={`rounded-2xl border p-4 transition ${
                sheetMode === "single-sheet" ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="sheet-mode"
                value="single-sheet"
                checked={sheetMode === "single-sheet"}
                onChange={() => {
                  setSheetMode("single-sheet");
                  resetDownload();
                }}
                className="sr-only"
              />
              <span className="text-sm font-semibold text-slate-950">Single combined sheet</span>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Puts all extracted rows into one worksheet with page separators.
              </p>
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <h3 className="text-sm font-medium text-slate-700">Column sensitivity</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.entries(columnModes) as Array<[ColumnMode, (typeof columnModes)[ColumnMode]]>).map(
            ([value, mode]) => (
              <label
                key={value}
                className={`rounded-2xl border p-4 transition ${
                  columnMode === value ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="column-mode"
                  value={value}
                  checked={columnMode === value}
                  onChange={() => {
                    setColumnMode(value);
                    resetDownload();
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-slate-950">{mode.label}</span>
                <p className="mt-2 text-sm leading-6 text-slate-600">{mode.description}</p>
              </label>
            ),
          )}
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
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          )}
          {isConverting ? "Building workbook..." : "PDF to Excel"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Excel file
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Workbook size</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatFileSize(outputSize)}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rows extracted</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{extractedRows ?? 0}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
