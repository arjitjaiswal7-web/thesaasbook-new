"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FilePlus2,
  Layers3,
  LoaderCircle,
  MousePointer2,
  Plus,
  RefreshCcw,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type ColorKey = "navy" | "slate" | "green" | "red" | "amber";

type TextContentItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

type DetectedBlock = {
  id: string;
  pageNumber: number;
  text: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
  fontSize: number;
};

type OverlayItem = {
  id: string;
  pageNumber: number;
  sourceBlockId?: string;
  text: string;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  fontSize: number;
  color: ColorKey;
  coverOriginal: boolean;
  kind: "detected" | "new";
};

type PageRecord = {
  pageNumber: number;
  pdfWidth: number;
  pdfHeight: number;
  thumbnailUrl: string;
  blocks: DetectedBlock[];
};

type PreviewMetrics = {
  renderWidth: number;
  renderHeight: number;
};

type ToolMode = "select" | "add-text";

type PdfJsViewport = {
  width: number;
  height: number;
  scale: number;
};

type PdfJsPage = {
  getViewport: (options: { scale: number }) => PdfJsViewport;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
    canvas?: HTMLCanvasElement;
  }) => { promise: Promise<void> };
  getTextContent: () => Promise<{ items: unknown[] }>;
  cleanup?: () => void;
};

type LoadedPdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  destroy: () => Promise<void>;
};

type DragState = {
  overlayId: string;
  pointerId: number;
  offsetXRatio: number;
  offsetYRatio: number;
};

let pdfJsPromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;

const PREVIEW_SCALE = 1.35;

const colorOptions: Array<{ key: ColorKey; label: string }> = [
  { key: "navy", label: "Navy" },
  { key: "slate", label: "Slate" },
  { key: "green", label: "Green" },
  { key: "red", label: "Red" },
  { key: "amber", label: "Amber" },
];

const previewColorMap: Record<ColorKey, string> = {
  navy: "#0f172a",
  slate: "#334155",
  green: "#166534",
  red: "#b91c1c",
  amber: "#b45309",
};

const pdfColorMap: Record<ColorKey, ReturnType<typeof rgb>> = {
  navy: rgb(15 / 255, 23 / 255, 42 / 255),
  slate: rgb(51 / 255, 65 / 255, 85 / 255),
  green: rgb(22 / 255, 101 / 255, 52 / 255),
  red: rgb(185 / 255, 28 / 255, 28 / 255),
  amber: rgb(180 / 255, 83 / 255, 9 / 255),
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
  return fileName.replace(/\.pdf$/i, "").replace(/[^a-z0-9-_]+/gi, "-") || "edited-pdf";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
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

function buildWrappedParagraphs(text: string, maxWidth: number, measure: (value: string) => number) {
  return text
    .split(/\r?\n/)
    .flatMap((paragraph) => wrapText(paragraph, maxWidth, measure));
}

function buildDetectedBlocks(
  items: TextContentItem[],
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
) {
  const lines: Array<{
    baseline: number;
    items: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      text: string;
    }>;
  }> = [];

  for (const item of items) {
    const rawText = item.str ?? "";
    const text = normalizeText(rawText);

    if (!text) {
      continue;
    }

    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    const width = Math.abs(item.width ?? 0) || text.length * 6;
    const height = Math.abs(item.height ?? item.transform?.[0] ?? 12) || 12;
    const existingLine = lines.find((line) => Math.abs(line.baseline - y) < Math.max(4, height * 0.45));

    if (existingLine) {
      existingLine.items.push({ x, y, width, height, text });
    } else {
      lines.push({
        baseline: y,
        items: [{ x, y, width, height, text }],
      });
    }
  }

  return lines
    .sort((a, b) => b.baseline - a.baseline)
    .map((line, index) => {
      const orderedItems = [...line.items].sort((a, b) => a.x - b.x);
      const text = normalizeText(orderedItems.map((item) => item.text).join(" "));
      const minX = Math.min(...orderedItems.map((item) => item.x));
      const maxX = Math.max(...orderedItems.map((item) => item.x + item.width));
      const maxHeight = Math.max(...orderedItems.map((item) => item.height));
      const top = clamp(pageHeight - line.baseline - maxHeight * 0.9, 0, pageHeight - maxHeight);
      const width = clamp(maxX - minX + 8, 30, pageWidth * 0.9);
      const fontSize = clamp(Math.round(maxHeight * 0.95), 10, 28);

      return {
        id: `detected-${pageNumber}-${index}`,
        pageNumber,
        text,
        xRatio: minX / pageWidth,
        yRatio: top / pageHeight,
        widthRatio: width / pageWidth,
        heightRatio: Math.max(maxHeight / pageHeight, 0.018),
        fontSize,
      } satisfies DetectedBlock;
    })
    .filter((block) => block.text);
}

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }

  return pdfJsPromise;
}

async function renderThumbnail(page: PdfJsPage, pageWidth: number) {
  const scale = Math.min(0.35, 128 / Math.max(pageWidth, 1));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("The browser could not prepare a page thumbnail.");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;

  return canvas.toDataURL("image/png");
}

export default function EditPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocumentRef = useRef<LoadedPdfDocument | null>(null);
  const renderTokenRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [activePageNumber, setActivePageNumber] = useState(1);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processedPages, setProcessedPages] = useState(0);
  const [previewMetrics, setPreviewMetrics] = useState<PreviewMetrics | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("edited-pdf.pdf");
  const [outputSize, setOutputSize] = useState<number | null>(null);

  const totalDetectedBlocks = pages.reduce((sum, page) => sum + page.blocks.length, 0);
  const currentPage = pages.find((page) => page.pageNumber === activePageNumber) ?? null;
  const currentPageOverlays = overlays.filter((overlay) => overlay.pageNumber === activePageNumber);
  const selectedOverlay =
    selectedOverlayId !== null
      ? overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null
      : null;

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  useEffect(() => {
    return () => {
      const activeDocument = pdfDocumentRef.current;

      if (activeDocument) {
        void activeDocument.destroy();
        pdfDocumentRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentPage || !canvasRef.current || !pdfDocumentRef.current) {
      return;
    }

    async function renderCurrentPage() {
      const nextToken = renderTokenRef.current + 1;

      renderTokenRef.current = nextToken;
      setPreviewMetrics(null);
      setIsRendering(true);

      try {
        const page = await pdfDocumentRef.current?.getPage(activePageNumber);

        if (!page || renderTokenRef.current !== nextToken) {
          return;
        }

        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        const canvas = canvasRef.current;

        if (!canvas) {
          return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("The browser could not prepare the preview canvas.");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise;

        if (renderTokenRef.current !== nextToken) {
          return;
        }

        setPreviewMetrics({
          renderWidth: viewport.width,
          renderHeight: viewport.height,
        });

        page.cleanup?.();
      } catch {
        setError("The PDF preview could not be rendered. Please try another file.");
      } finally {
        if (renderTokenRef.current === nextToken) {
          setIsRendering(false);
        }
      }
    }

    void renderCurrentPage();
  }, [activePageNumber, currentPage]);

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

    const currentDocument = pdfDocumentRef.current;

    if (currentDocument) {
      await currentDocument.destroy();
      pdfDocumentRef.current = null;
    }

    setIsLoading(true);
    setProcessedPages(0);
    setError(null);
    resetDownload();

    try {
      const pdfjs = await loadPdfJs();
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(await nextFile.arrayBuffer()),
      });
      const pdf = (await loadingTask.promise) as unknown as LoadedPdfDocument;
      const nextPages: PageRecord[] = [];

      pdfDocumentRef.current = pdf;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();
        const blocks = buildDetectedBlocks(
          textContent.items as TextContentItem[],
          pageNumber,
          viewport.width,
          viewport.height,
        );
        const thumbnailUrl = await renderThumbnail(page, viewport.width);

        nextPages.push({
          pageNumber,
          pdfWidth: viewport.width,
          pdfHeight: viewport.height,
          thumbnailUrl,
          blocks,
        });

        page.cleanup?.();
        setProcessedPages(pageNumber);
      }

      setFile(nextFile);
      setPages(nextPages);
      setOverlays([]);
      setSelectedOverlayId(null);
      setActivePageNumber(1);
      setToolMode("select");
      setDownloadName(`${sanitizeBaseName(nextFile.name)}-edited.pdf`);
    } catch {
      setFile(null);
      setPages([]);
      setOverlays([]);
      setSelectedOverlayId(null);
      setActivePageNumber(1);
      setError("This PDF could not be opened. Please try another unlocked PDF.");
    } finally {
      setIsLoading(false);
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

  function updateOverlay(
    overlayId: string,
    updater: (overlay: OverlayItem) => OverlayItem,
  ) {
    setOverlays((currentOverlays) =>
      currentOverlays.map((overlay) => (overlay.id === overlayId ? updater(overlay) : overlay)),
    );
    resetDownload();
  }

  function createOverlayFromBlock(block: DetectedBlock) {
    const existingOverlay = overlays.find((overlay) => overlay.sourceBlockId === block.id);

    if (existingOverlay) {
      setSelectedOverlayId(existingOverlay.id);
      return;
    }

    const nextOverlay: OverlayItem = {
      id: crypto.randomUUID(),
      pageNumber: block.pageNumber,
      sourceBlockId: block.id,
      text: block.text,
      xRatio: block.xRatio,
      yRatio: block.yRatio,
      widthRatio: clamp(block.widthRatio + 0.015, 0.08, 0.8),
      fontSize: block.fontSize,
      color: "slate",
      coverOriginal: true,
      kind: "detected",
    };

    setOverlays((currentOverlays) => [...currentOverlays, nextOverlay]);
    setSelectedOverlayId(nextOverlay.id);
    setToolMode("select");
    resetDownload();
  }

  function addTextBoxAtPosition(clientX: number, clientY: number) {
    const previewBounds = previewRef.current?.getBoundingClientRect();

    if (!previewBounds) {
      return;
    }

    const nextOverlay: OverlayItem = {
      id: crypto.randomUUID(),
      pageNumber: activePageNumber,
      text: "New text",
      xRatio: clamp((clientX - previewBounds.left) / previewBounds.width, 0.02, 0.82),
      yRatio: clamp((clientY - previewBounds.top) / previewBounds.height, 0.02, 0.9),
      widthRatio: 0.26,
      fontSize: 18,
      color: "navy",
      coverOriginal: false,
      kind: "new",
    };

    setOverlays((currentOverlays) => [...currentOverlays, nextOverlay]);
    setSelectedOverlayId(nextOverlay.id);
    setToolMode("select");
    resetDownload();
  }

  function handlePreviewClick(event: ReactPointerEvent<HTMLDivElement>) {
    if (toolMode === "add-text") {
      addTextBoxAtPosition(event.clientX, event.clientY);
      return;
    }

    if (selectedOverlayId) {
      setSelectedOverlayId(null);
    }
  }

  function positionOverlay(overlayId: string, clientX: number, clientY: number, dragState?: DragState) {
    const previewBounds = previewRef.current?.getBoundingClientRect();
    const overlay = overlays.find((item) => item.id === overlayId);

    if (!previewBounds || !overlay) {
      return;
    }

    const nextXRatio = clamp(
      (clientX - previewBounds.left) / previewBounds.width - (dragState?.offsetXRatio ?? 0),
      0.01,
      0.98 - overlay.widthRatio,
    );
    const nextYRatio = clamp(
      (clientY - previewBounds.top) / previewBounds.height - (dragState?.offsetYRatio ?? 0),
      0.01,
      0.96,
    );

    updateOverlay(overlayId, (currentOverlay) => ({
      ...currentOverlay,
      xRatio: nextXRatio,
      yRatio: nextYRatio,
    }));
  }

  function handleOverlayPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    overlay: OverlayItem,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const previewBounds = previewRef.current?.getBoundingClientRect();

    if (!previewBounds) {
      return;
    }

    setSelectedOverlayId(overlay.id);
    dragStateRef.current = {
      overlayId: overlay.id,
      pointerId: event.pointerId,
      offsetXRatio:
        (event.clientX - previewBounds.left) / previewBounds.width - overlay.xRatio,
      offsetYRatio:
        (event.clientY - previewBounds.top) / previewBounds.height - overlay.yRatio,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleOverlayPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    positionOverlay(dragState.overlayId, event.clientX, event.clientY, dragState);
  }

  function handleOverlayPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function removeSelectedOverlay() {
    if (!selectedOverlayId) {
      return;
    }

    setOverlays((currentOverlays) =>
      currentOverlays.filter((overlay) => overlay.id !== selectedOverlayId),
    );
    setSelectedOverlayId(null);
    resetDownload();
  }

  function resetCurrentPageEdits() {
    setOverlays((currentOverlays) =>
      currentOverlays.filter((overlay) => overlay.pageNumber !== activePageNumber),
    );

    if (selectedOverlay?.pageNumber === activePageNumber) {
      setSelectedOverlayId(null);
    }

    resetDownload();
  }

  async function handleExport() {
    if (!file) {
      setError("Upload a PDF before exporting the edited version.");
      return;
    }

    if (!overlays.length) {
      setError("Select a detected line or add a text box before exporting the edited PDF.");
      return;
    }

    setIsExporting(true);
    setError(null);
    resetDownload();

    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      for (const overlay of overlays) {
        const page = pdf.getPage(overlay.pageNumber - 1);
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const x = overlay.xRatio * pageWidth;
        const topY = overlay.yRatio * pageHeight;
        const boxWidth = clamp(overlay.widthRatio * pageWidth, 48, pageWidth * 0.95);
        const fontSize = overlay.fontSize;
        const lineHeight = fontSize * 1.24;
        const paddingX = fontSize * 0.32;
        const paddingY = fontSize * 0.26;
        const wrappedLines = buildWrappedParagraphs(
          overlay.text,
          Math.max(boxWidth - paddingX * 2, 32),
          (line) => font.widthOfTextAtSize(line || " ", fontSize),
        );
        const contentHeight = Math.max(wrappedLines.length * lineHeight, fontSize);
        const boxHeight = contentHeight + paddingY * 2;
        const boxBottom = pageHeight - topY - boxHeight;

        if (overlay.coverOriginal) {
          page.drawRectangle({
            x,
            y: boxBottom,
            width: boxWidth,
            height: boxHeight,
            color: rgb(1, 1, 1),
          });
        }

        wrappedLines.forEach((line, index) => {
          page.drawText(line || " ", {
            x: x + paddingX,
            y: pageHeight - topY - fontSize - paddingY * 0.15 - index * lineHeight,
            size: fontSize,
            font,
            color: pdfColorMap[overlay.color],
          });
        });
      }

      const pdfBytes = Uint8Array.from(await pdf.save());
      const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });
      const nextDownloadUrl = URL.createObjectURL(blob);

      setDownloadUrl(nextDownloadUrl);
      setOutputSize(blob.size);
    } catch {
      setError("The edited PDF could not be exported. Please try again with another file.");
    } finally {
      setIsExporting(false);
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
            Upload a PDF to edit visually
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Detect text lines on each page, place edited overlays on top, hide
            original text visually, and export a revised PDF directly from your browser.
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

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4 sm:p-5">
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Current file
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {file ? file.name : "No PDF selected"}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pages
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {pages.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Detected lines
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {totalDetectedBlocks}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Edited items
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {overlays.length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Preparing visual editor for page {processedPages + 1}...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[14rem_minmax(0,1fr)_22rem]">
        <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Pages
              </h3>
              <p className="mt-1 text-sm text-slate-600">Select a page preview.</p>
            </div>
            <Eye className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>

          <div className="mt-4 space-y-3">
            {pages.length ? (
              pages.map((page) => (
                <button
                  type="button"
                  key={page.pageNumber}
                  onClick={() => setActivePageNumber(page.pageNumber)}
                  className={`block w-full rounded-[1.25rem] border p-3 text-left transition ${
                    activePageNumber === page.pageNumber
                      ? "border-sky-300 bg-sky-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image
                      src={page.thumbnailUrl}
                      alt={`Preview of page ${page.pageNumber}`}
                      width={112}
                      height={Math.max(112, Math.round((page.pdfHeight / page.pdfWidth) * 112))}
                      unoptimized
                      className="h-auto w-full"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Page {page.pageNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {page.blocks.length} detected lines
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                Upload a PDF to generate page thumbnails.
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                Visual PDF editor
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Click a detected text line to create an editable overlay, or add a new text box and place it on the page.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setToolMode("select")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  toolMode === "select"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <MousePointer2 className="h-4 w-4" aria-hidden="true" />
                Select text
              </button>
              <button
                type="button"
                onClick={() => setToolMode("add-text")}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  toolMode === "add-text"
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add text box
              </button>
              <button
                type="button"
                onClick={resetCurrentPageEdits}
                disabled={!currentPageOverlays.length}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reset page edits
              </button>
            </div>
          </div>

          {currentPage ? (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span>Page {currentPage.pageNumber}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{currentPage.blocks.length} detected lines</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{currentPageOverlays.length} overlay edits</span>
              </div>

              <div
                ref={previewRef}
                onClick={handlePreviewClick}
                className={`relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 shadow-inner ${
                  toolMode === "add-text" ? "cursor-crosshair" : "cursor-default"
                }`}
                style={{
                  aspectRatio: `${previewMetrics?.renderWidth ?? currentPage.pdfWidth * PREVIEW_SCALE} / ${previewMetrics?.renderHeight ?? currentPage.pdfHeight * PREVIEW_SCALE}`,
                }}
              >
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

                {currentPage.blocks.map((block) => (
                  <button
                    type="button"
                    key={block.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      createOverlayFromBlock(block);
                    }}
                    className="absolute rounded-sm border border-transparent transition hover:border-sky-300/80 hover:bg-sky-100/25"
                    style={{
                      left: `${block.xRatio * 100}%`,
                      top: `${block.yRatio * 100}%`,
                      width: `${block.widthRatio * 100}%`,
                      minHeight: `${Math.max(block.heightRatio * 100, 2)}%`,
                    }}
                    aria-label={`Edit detected text: ${block.text}`}
                  />
                ))}

                {currentPageOverlays.map((overlay) => (
                  <button
                    type="button"
                    key={overlay.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedOverlayId(overlay.id);
                    }}
                    onPointerDown={(event) => handleOverlayPointerDown(event, overlay)}
                    onPointerMove={handleOverlayPointerMove}
                    onPointerUp={handleOverlayPointerUp}
                    onPointerCancel={handleOverlayPointerUp}
                    className={`absolute rounded-lg px-3 py-2 text-left shadow-lg outline-none transition ${
                      selectedOverlayId === overlay.id
                        ? "ring-2 ring-sky-400"
                        : "ring-1 ring-slate-200/70"
                    }`}
                    style={{
                      left: `${overlay.xRatio * 100}%`,
                      top: `${overlay.yRatio * 100}%`,
                      width: `${overlay.widthRatio * 100}%`,
                      color: previewColorMap[overlay.color],
                      backgroundColor: overlay.coverOriginal
                        ? "rgba(255, 255, 255, 0.96)"
                        : "rgba(255, 255, 255, 0.55)",
                      fontSize: `${overlay.fontSize}px`,
                    }}
                  >
                    <span className="whitespace-pre-wrap break-words leading-[1.2]">
                      {overlay.text}
                    </span>
                  </button>
                ))}

                {isRendering ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Rendering page
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-900">
                Click a highlighted line to create an editable overlay. The export covers the original line with a white box and draws the updated text on top.
              </div>
            </div>
          ) : (
            <div className="mt-5 flex min-h-80 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div className="max-w-md">
                <Type className="mx-auto h-7 w-7 text-slate-400" aria-hidden="true" />
                <p className="mt-4 text-base font-semibold text-slate-950">
                  Upload a PDF to open the visual editor
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Once the document is loaded, page thumbnails and detected text hotspots will appear here.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                  Edited items
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Overlays on the current page appear here for quick selection.
                </p>
              </div>
              <Layers3 className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </div>

            <div className="mt-5 space-y-3">
              {currentPageOverlays.length ? (
                currentPageOverlays.map((overlay, index) => (
                  <button
                    type="button"
                    key={overlay.id}
                    onClick={() => setSelectedOverlayId(overlay.id)}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedOverlayId === overlay.id
                        ? "border-sky-300 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {overlay.kind === "detected" ? `Edited line ${index + 1}` : `Text box ${index + 1}`}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                      {overlay.text}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No overlay edits on this page yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Selected item
            </h3>

            {selectedOverlay ? (
              <div className="mt-5 space-y-5">
                <div>
                  <label htmlFor="overlay-text" className="text-sm font-medium text-slate-700">
                    Text content
                  </label>
                  <textarea
                    id="overlay-text"
                    rows={6}
                    value={selectedOverlay.text}
                    onChange={(event) =>
                      updateOverlay(selectedOverlay.id, (overlay) => ({
                        ...overlay,
                        text: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label htmlFor="overlay-font-size" className="text-sm font-medium text-slate-700">
                    Font size
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      id="overlay-font-size"
                      type="range"
                      min={10}
                      max={34}
                      value={selectedOverlay.fontSize}
                      onChange={(event) =>
                        updateOverlay(selectedOverlay.id, (overlay) => ({
                          ...overlay,
                          fontSize: Number(event.target.value),
                        }))
                      }
                      className="w-full accent-slate-950"
                    />
                    <span className="w-12 text-right text-sm font-semibold text-slate-950">
                      {selectedOverlay.fontSize}px
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Text color</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {colorOptions.map((option) => (
                      <button
                        type="button"
                        key={option.key}
                        onClick={() =>
                          updateOverlay(selectedOverlay.id, (overlay) => ({
                            ...overlay,
                            color: option.key,
                          }))
                        }
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                          selectedOverlay.color === option.key
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: previewColorMap[option.key] }}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedOverlay.coverOriginal}
                    onChange={(event) =>
                      updateOverlay(selectedOverlay.id, (overlay) => ({
                        ...overlay,
                        coverOriginal: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-sky-200"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">
                      Hide original text visually
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      Adds a white cover box behind this overlay before the new text is drawn.
                    </span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={removeSelectedOverlay}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove selected item
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                Select a detected line or an edited overlay to change its text and appearance.
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Save changes
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Export the current visual edits into a new PDF file.
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={handleExport}
                disabled={!file || !overlays.length || isExporting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isExporting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                {isExporting ? "Saving PDF" : "Save changes"}
              </button>

              {downloadUrl ? (
                <a
                  href={downloadUrl}
                  download={downloadName}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Download edited PDF
                </a>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Source size
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {file ? formatFileSize(file.size) : "0 B"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Output size
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {outputSize ? formatFileSize(outputSize) : "Not exported yet"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
