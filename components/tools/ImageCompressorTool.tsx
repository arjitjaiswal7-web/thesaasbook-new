"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";

type CompressionPreset = "balanced" | "strong" | "maximum";
type OutputFormat = "auto" | "jpeg" | "webp";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type CompressedItem = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
};

type PresetConfig = {
  quality: number;
  maxDimension: number;
  label: string;
  description: string;
};

const presetConfig: Record<CompressionPreset, PresetConfig> = {
  balanced: {
    quality: 0.84,
    maxDimension: 2400,
    label: "Balanced",
    description: "Best mix of sharp quality and smaller size.",
  },
  strong: {
    quality: 0.74,
    maxDimension: 2000,
    label: "Strong",
    description: "More compression for lighter files.",
  },
  maximum: {
    quality: 0.62,
    maxDimension: 1600,
    label: "Maximum",
    description: "Smallest files with stronger quality reduction.",
  },
};

function bytesToSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function getOutputMimeType(file: File, format: OutputFormat) {
  if (format === "jpeg") {
    return "image/jpeg";
  }

  if (format === "webp") {
    return "image/webp";
  }

  if (file.type === "image/png" || file.type === "image/webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  return "jpg";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function baseName(value: string) {
  return value.replace(/\.[^./]+$/, "") || "compressed-image";
}

async function loadImageDimensions(file: File): Promise<{ width: number; height: number; image: CanvasImageSource }> {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        width: bitmap.width,
        height: bitmap.height,
        image: bitmap,
      };
    } catch {
      // Fall back to HTMLImageElement if createImageBitmap fails.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();

      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to load image file."));
      element.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      image,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  return blob;
}

async function compressImageFile(
  file: File,
  outputFormat: OutputFormat,
  quality: number,
  maxDimension: number,
): Promise<CompressedItem> {
  const decoded = await loadImageDimensions(file);
  const longestSide = Math.max(decoded.width, decoded.height);
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  const targetMimeType = getOutputMimeType(file, outputFormat);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: targetMimeType !== "image/jpeg",
    colorSpace: "srgb",
  });

  if (!context) {
    throw new Error("Could not create a drawing context for compression.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(decoded.image, 0, 0, width, height);

  if (decoded.image instanceof ImageBitmap) {
    decoded.image.close();
  }

  let blob = await canvasToBlob(canvas, targetMimeType, quality);
  let mimeType = targetMimeType;

  if (!blob && targetMimeType === "image/webp") {
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    mimeType = "image/jpeg";
  }

  if (!blob) {
    throw new Error("Image compression failed for one of the files.");
  }

  const extension = extensionFromMimeType(mimeType);
  const outputName = `${baseName(file.name)}-compressed.${extension}`;
  const resultUrl = URL.createObjectURL(blob);

  return {
    id: `${file.name}-${file.lastModified}`,
    name: outputName,
    blob,
    url: resultUrl,
    mimeType,
    width,
    height,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

export default function ImageCompressorTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [results, setResults] = useState<CompressedItem[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>("balanced");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [quality, setQuality] = useState(84);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentPreset = presetConfig[preset];
  const qualityValue = Math.min(0.95, Math.max(0.5, quality / 100));

  const totals = useMemo(() => {
    const original = results.reduce((sum, item) => sum + item.originalSize, 0);
    const compressed = results.reduce((sum, item) => sum + item.compressedSize, 0);

    const reduction =
      original > 0 ? Math.max(0, ((original - compressed) / original) * 100) : 0;

    return { original, compressed, reduction };
  }, [results]);

  useEffect(() => {
    return () => {
      uploads.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      results.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [uploads, results]);

  const updateUploads = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const next: UploadItem[] = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (!next.length) {
      return;
    }

    setUploads((current) => {
      const currentIds = new Set(current.map((item) => item.id));
      const deduped = next.filter((item) => !currentIds.has(item.id));
      return [...current, ...deduped];
    });

    setError(null);
  };

  const removeUpload = (id: string) => {
    setUploads((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });

    setResults((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.url);
      }
      return current.filter((entry) => entry.id !== id);
    });
  };

  const clearAll = () => {
    uploads.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    results.forEach((item) => URL.revokeObjectURL(item.url));
    setUploads([]);
    setResults([]);
    setError(null);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleCompress = async () => {
    if (!uploads.length || isCompressing) {
      return;
    }

    setIsCompressing(true);
    setProgress(0);
    setError(null);

    setResults((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });

    try {
      const nextResults: CompressedItem[] = [];

      for (const [index, item] of uploads.entries()) {
        const compressed = await compressImageFile(
          item.file,
          outputFormat,
          qualityValue,
          currentPreset.maxDimension,
        );

        nextResults.push(compressed);
        setProgress(Math.round(((index + 1) / uploads.length) * 100));
      }

      setResults(nextResults);
    } catch (compressionError) {
      setError(
        compressionError instanceof Error
          ? compressionError.message
          : "Image compression failed. Please try again.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => updateUploads(event.target.files)}
      />

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Preset
            <select
              value={preset}
              onChange={(event) => setPreset(event.target.value as CompressionPreset)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              {Object.entries(presetConfig).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Output format
            <select
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="auto">Auto (recommended)</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Quality ({quality}%)
            <input
              type="range"
              min={50}
              max={95}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-3 w-full accent-slate-900"
            />
          </label>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          {currentPreset.description} Max output side: {currentPreset.maxDimension}px.
        </p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          updateUploads(event.dataTransfer.files);
        }}
        className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-950">Upload images to compress</p>
        <p className="mt-2 text-sm text-slate-600">JPG, PNG, and WebP supported.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Select images
        </button>
      </div>

      {uploads.length ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {uploads.length} image{uploads.length > 1 ? "s" : ""} ready
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
              <button
                type="button"
                onClick={handleCompress}
                disabled={isCompressing}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCompressing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImageIcon className="h-4 w-4" aria-hidden="true" />}
                {isCompressing ? "Compressing..." : "Compress images"}
              </button>
            </div>
          </div>

          {isCompressing ? (
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{progress}% complete</p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {uploads.map((item) => {
              const result = results.find((entry) => entry.id === item.id);
              const reduction = result
                ? Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize) * 100)
                : null;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    {/* Preview uses blob/object URLs generated at runtime. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={result?.url ?? item.previewUrl}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 p-4">
                    <p className="truncate text-sm font-semibold text-slate-900" title={item.file.name}>
                      {item.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Original: {bytesToSize(item.file.size)}
                    </p>

                    {result ? (
                      <>
                        <p className="text-xs text-slate-500">
                          Compressed: {bytesToSize(result.compressedSize)}
                        </p>
                        <p className="text-xs font-semibold text-emerald-700">
                          Saved {reduction?.toFixed(1)}%
                        </p>
                        <button
                          type="button"
                          onClick={() => downloadBlob(result.blob, result.name)}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Download
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">Waiting for compression</p>
                    )}

                    <button
                      type="button"
                      onClick={() => removeUpload(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-700"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {results.length ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
          <p className="text-sm font-semibold text-emerald-900">Compression summary</p>
          <p className="mt-2 text-sm text-emerald-800">
            {bytesToSize(totals.original)} to {bytesToSize(totals.compressed)} ({totals.reduction.toFixed(1)}% saved)
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
