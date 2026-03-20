"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Download,
  FilePlus2,
  FileType,
  LoaderCircle,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PageSize = "a4" | "letter";

type MammothResult = {
  value: string;
};

const pageSizes = {
  a4: { width: 595.28, height: 841.89, label: "A4" },
  letter: { width: 612, height: 792, label: "Letter" },
} satisfies Record<PageSize, { width: number; height: number; label: string }>;

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
  return fileName.replace(/\.(docx|doc)$/i, "").replace(/[^a-z0-9-_]+/gi, "-") || "document";
}

function wrapText(text: string, maxWidth: number, measure: (value: string) => number) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (measure(candidate) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (measure(word) <= maxWidth) {
      currentLine = word;
      continue;
    }

    let segment = "";

    for (const character of word) {
      const nextSegment = `${segment}${character}`;

      if (measure(nextSegment) <= maxWidth) {
        segment = nextSegment;
      } else {
        if (segment) {
          lines.push(segment);
        }
        segment = character;
      }
    }

    currentLine = segment;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

function isWordDocument(file: File) {
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.(docx)$/i.test(file.name)
  );
}

export default function WordToPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("word-to-pdf.pdf");
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [paragraphCount, setParagraphCount] = useState<number | null>(null);

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
    setParagraphCount(null);
  }

  async function loadFile(nextFile: File) {
    if (!isWordDocument(nextFile)) {
      setError("Please upload a valid .docx Word document.");
      return;
    }

    setError(null);
    resetDownload();
    setFile(nextFile);
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
      setError("Upload a .docx file before converting it.");
      return;
    }

    setIsConverting(true);
    setError(null);
    resetDownload();

    try {
      const mammoth = (await import("mammoth")) as {
        extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
      };

      const { value } = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
      });

      const paragraphs = value
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
        .filter(Boolean);

      if (!paragraphs.length) {
        throw new Error(
          "No readable text was found in this Word file. Try a standard .docx document with editable text.",
        );
      }

      const pdf = await PDFDocument.create();
      const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
      const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const page = pageSizes[pageSize];
      const marginX = 52;
      const marginTop = 64;
      const marginBottom = 56;
      const bodyFontSize = 11;
      const titleFontSize = 18;
      const bodyLineHeight = 16;
      const titleLineHeight = 24;
      const maxWidth = page.width - marginX * 2;
      const title = file.name.replace(/\.(docx|doc)$/i, "");
      let currentPage = pdf.addPage([page.width, page.height]);
      let cursorY = page.height - marginTop;

      function addPage() {
        currentPage = pdf.addPage([page.width, page.height]);
        cursorY = page.height - marginTop;
      }

      const titleLines = wrapText(title, maxWidth, (line) =>
        titleFont.widthOfTextAtSize(line, titleFontSize),
      );

      for (const line of titleLines) {
        if (cursorY - titleLineHeight < marginBottom) {
          addPage();
        }

        currentPage.drawText(line, {
          x: marginX,
          y: cursorY,
          size: titleFontSize,
          font: titleFont,
          color: rgb(0.06, 0.12, 0.28),
        });

        cursorY -= titleLineHeight;
      }

      cursorY -= 12;

      for (const paragraph of paragraphs) {
        const lines = wrapText(paragraph, maxWidth, (line) =>
          bodyFont.widthOfTextAtSize(line, bodyFontSize),
        );

        for (const line of lines) {
          if (cursorY - bodyLineHeight < marginBottom) {
            addPage();
          }

          currentPage.drawText(line, {
            x: marginX,
            y: cursorY,
            size: bodyFontSize,
            font: bodyFont,
            color: rgb(0.12, 0.16, 0.22),
          });

          cursorY -= bodyLineHeight;
        }

        cursorY -= 10;
      }

      const pdfBytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setDownloadName(`${sanitizeBaseName(file.name)}.pdf`);
      setOutputSize(blob.size);
      setParagraphCount(paragraphs.length);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "The Word file could not be converted. Please try another .docx document.",
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
            Upload a Word document
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Convert `.docx` files into clean PDFs directly in the browser with a text-first layout.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Select Word file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            This converter keeps the document text and rebuilds it into a clean PDF layout. Complex Word formatting, tables, and positioned graphics may not match the source file exactly.
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
            Input type
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">DOCX</p>
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
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">PDF layout</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.entries(pageSizes) as Array<[PageSize, (typeof pageSizes)[PageSize]]>).map(
            ([value, size]) => (
              <label
                key={value}
                className={`rounded-2xl border p-4 transition ${
                  pageSize === value ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="page-size"
                  value={value}
                  checked={pageSize === value}
                  onChange={() => {
                    setPageSize(value);
                    resetDownload();
                  }}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-slate-950">{size.label}</span>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Export the PDF using a standard {size.label} page layout.
                </p>
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
            <FileType className="h-4 w-4" aria-hidden="true" />
          )}
          {isConverting ? "Creating PDF..." : "Word to PDF"}
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

      {outputSize ? (
        <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:p-5">
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              PDF size
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{formatFileSize(outputSize)}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Paragraphs converted
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{paragraphCount ?? 0}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
