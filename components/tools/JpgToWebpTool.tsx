"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileImage, Loader2, Trash2, UploadCloud } from "lucide-react";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type ConvertedItem = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
};

type DecodedImage = {
  width: number;
  height: number;
  image: CanvasImageSource;
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

function baseName(value: string) {
  return value.replace(/\.[^./]+$/, "") || "converted-image";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function loadImage(file: File): Promise<DecodedImage> {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        width: bitmap.width,
        height: bitmap.height,
        image: bitmap,
      };
    } catch {
      // Fall back to HTMLImageElement decoding.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to load JPG file."));
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

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
}

async function convertJpgToWebp(file: File, quality: number): Promise<ConvertedItem> {
  const decoded = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = decoded.width;
  canvas.height = decoded.height;

  const context = canvas.getContext("2d", {
    alpha: false,
    colorSpace: "srgb",
  });

  if (!context) {
    throw new Error("Could not create a drawing context for conversion.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);

  if (decoded.image instanceof ImageBitmap) {
    decoded.image.close();
  }

  const blob = await canvasToBlob(canvas, quality);

  if (!blob) {
    throw new Error("JPG to WebP conversion failed for one of the files.");
  }

  const resultUrl = URL.createObjectURL(blob);

  return {
    id: `${file.name}-${file.lastModified}`,
    name: `${baseName(file.name)}.webp`,
    blob,
    url: resultUrl,
    width: decoded.width,
    height: decoded.height,
    originalSize: file.size,
    convertedSize: blob.size,
  };
}

export default function JpgToWebpTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [results, setResults] = useState<ConvertedItem[]>([]);
  const [quality, setQuality] = useState(86);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const original = results.reduce((sum, item) => sum + item.originalSize, 0);
    const converted = results.reduce((sum, item) => sum + item.convertedSize, 0);
    const reduction = original > 0 ? ((original - converted) / original) * 100 : 0;

    return { original, converted, reduction };
  }, [results]);

  const qualityNote =
    quality >= 92
      ? "High quality keeps more visual detail, but output files may be larger."
      : quality >= 82
        ? "Balanced quality is the best fit for most websites and product images."
        : "Lower quality produces smaller WebP files for faster delivery and lighter pages.";

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
      .filter(
        (file) =>
          file.type === "image/jpeg" ||
          file.type === "image/jpg" ||
          /\.(jpe?g)$/i.test(file.name),
      )
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
    setProgress(0);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleConvert = async () => {
    if (!uploads.length || isConverting) {
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setError(null);

    setResults((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });

    try {
      const nextResults: ConvertedItem[] = [];

      for (const [index, item] of uploads.entries()) {
        const converted = await convertJpgToWebp(item.file, quality / 100);
        nextResults.push(converted);
        setProgress(Math.round(((index + 1) / uploads.length) * 100));
      }

      setResults(nextResults);
    } catch (conversionError) {
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "JPG to WebP conversion failed. Please try again.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg"
        multiple
        className="hidden"
        onChange={(event) => updateUploads(event.target.files)}
      />

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="block text-sm font-medium text-slate-700">
            WebP quality ({quality}%)
            <input
              type="range"
              min={60}
              max={100}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-3 w-full accent-slate-900"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 lg:min-w-96 lg:self-end">
            {qualityNote}
          </div>
        </div>
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
        <p className="mt-4 text-base font-semibold text-slate-950">Upload JPG images to convert</p>
        <p className="mt-2 text-sm text-slate-600">Batch conversion supported. WebP is ideal for faster websites and lighter media libraries.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Select JPG files
        </button>
      </div>

      {uploads.length ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              {uploads.length} JPG file{uploads.length > 1 ? "s" : ""} ready
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
                onClick={handleConvert}
                disabled={isConverting}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConverting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileImage className="h-4 w-4" aria-hidden="true" />}
                {isConverting ? "Converting..." : "Convert to WebP"}
              </button>
            </div>
          </div>

          {isConverting ? (
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
                ? ((result.originalSize - result.convertedSize) / result.originalSize) * 100
                : null;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <div className="aspect-[4/3] bg-slate-100">
                    {/* Preview uses runtime blob/object URLs. */}
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
                    <p className="text-xs text-slate-500">Original: {bytesToSize(item.file.size)}</p>

                    {result ? (
                      <>
                        <p className="text-xs text-slate-500">
                          WebP: {result.width} x {result.height}
                        </p>
                        <p className="text-xs text-slate-500">Output: {bytesToSize(result.convertedSize)}</p>
                        <p className="text-xs font-semibold text-emerald-700">
                          {reduction && reduction > 0 ? `Saved ${reduction.toFixed(1)}%` : "Conversion ready"}
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
                      <p className="text-xs text-slate-500">Waiting for conversion</p>
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
          <p className="text-sm font-semibold text-emerald-900">Conversion summary</p>
          <p className="mt-2 text-sm text-emerald-800">
            {bytesToSize(summary.original)} to {bytesToSize(summary.converted)} ({summary.reduction >= 0 ? summary.reduction.toFixed(1) : "0.0"}% average reduction)
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
