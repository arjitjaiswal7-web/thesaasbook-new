"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FilePlus2,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

type SelectedPdf = {
  id: string;
  file: File;
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

function createOutputName(firstFileName: string) {
  const sanitized = firstFileName.replace(/\.pdf$/i, "").replace(/[^a-z0-9-_]+/gi, "-");
  return `${sanitized || "merged"}-merged.pdf`;
}

export default function MergePdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedPdf[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("merged-pdf.pdf");

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0);

  function resetDownload() {
    setDownloadUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
  }

  function appendFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );

    if (!incoming.length) {
      setError("Please upload PDF files only.");
      return;
    }

    setError(null);
    resetDownload();
    setFiles((currentFiles) => {
      const seen = new Set(
        currentFiles.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`),
      );
      const nextFiles = [...currentFiles];

      for (const file of incoming) {
        const signature = `${file.name}-${file.size}-${file.lastModified}`;

        if (seen.has(signature)) {
          continue;
        }

        seen.add(signature);
        nextFiles.push({
          id: crypto.randomUUID(),
          file,
        });
      }

      return nextFiles;
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

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((currentFiles) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= currentFiles.length) {
        return currentFiles;
      }

      const nextFiles = [...currentFiles];
      const [item] = nextFiles.splice(index, 1);

      nextFiles.splice(targetIndex, 0, item);
      return nextFiles;
    });
    resetDownload();
  }

  function removeFile(id: string) {
    setFiles((currentFiles) => currentFiles.filter((item) => item.id !== id));
    resetDownload();
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError("Add at least two PDF files to merge them.");
      return;
    }

    setIsMerging(true);
    setError(null);
    resetDownload();

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of files) {
        const bytes = await item.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

        for (const page of pages) {
          mergedPdf.addPage(page);
        }
      }

      const mergedBytes = await mergedPdf.save();
      const outputBytes = new Uint8Array(mergedBytes.length);

      outputBytes.set(mergedBytes);

      const blob = new Blob([outputBytes], { type: "application/pdf" });
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setDownloadName(createOutputName(files[0]?.file.name ?? "merged-pdf"));
    } catch {
      setError(
        "One of the selected files could not be merged. Please check that every file is a valid, unlocked PDF.",
      );
    } finally {
      setIsMerging(false);
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
          isDragging
            ? "border-sky-400 bg-sky-50"
            : "border-slate-300 bg-slate-50"
        }`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm shadow-slate-200/70">
            <Upload className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            Upload PDF files
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Drag and drop multiple PDFs here, or browse files from your device.
            Your selected files stay in the browser while you merge them.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Select PDF files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleInputChange}
            className="sr-only"
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Files added
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{files.length}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Total size
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {files.length ? formatFileSize(totalSize) : "0 B"}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Output
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            Single merged PDF
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {files.length ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Arrange file order
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Move files up or down. The list order will be used in the merged PDF.
            </p>
          </div>
          <ul className="divide-y divide-slate-200">
            {files.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {index + 1}. {item.file.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{formatFileSize(item.file.size)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveFile(index, -1)}
                    disabled={index === 0 || isMerging}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFile(index, 1)}
                    disabled={index === files.length - 1 || isMerging}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    disabled={isMerging}
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
          onClick={handleMerge}
          disabled={files.length < 2 || isMerging}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isMerging ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {isMerging ? "Merging PDFs..." : "Merge PDF"}
        </button>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download merged PDF
          </a>
        ) : null}
      </div>
    </div>
  );
}
