"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Image as ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";

type OutputFormat = "original" | "jpeg" | "png" | "webp";
type ResizePresetKey = "custom" | "thumbnail" | "blog" | "instagram" | "story" | "hd";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type ResizedItem = {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  resizedSize: number;
};

type DecodedImage = {
  width: number;
  height: number;
  image: CanvasImageSource;
};

type ResizePreset = {
  label: string;
  width: number;
  height: number;
  description: string;
};

const resizePresets: Record<Exclude<ResizePresetKey, "custom">, ResizePreset> = {
  thumbnail: {
    label: "Thumbnail",
    width: 400,
    height: 400,
    description: "Small square previews for listings and cards.",
  },
  blog: {
    label: "Blog",
    width: 1200,
    height: 630,
    description: "Open Graph and blog feature image size.",
  },
  instagram: {
    label: "Instagram Square",
    width: 1080,
    height: 1080,
    description: "Square posts for social content.",
  },
  story: {
    label: "Story",
    width: 1080,
    height: 1920,
    description: "Vertical story and reels cover format.",
  },
  hd: {
    label: "HD",
    width: 1920,
    height: 1080,
    description: "Wide hero banners and presentation assets.",
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

function baseName(value: string) {
  return value.replace(/\.[^./]+$/, "") || "resized-image";
}

function getMimeType(file: File, format: OutputFormat) {
  if (format === "jpeg") {
    return "image/jpeg";
  }

  if (format === "png") {
    return "image/png";
  }

  if (format === "webp") {
    return "image/webp";
  }

  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return file.type;
  }

  return "image/jpeg";
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
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
      // Fallback to HTMLImageElement.
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
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

async function resizeImageFile(
  file: File,
  widthInput: number,
  heightInput: number,
  keepAspectRatio: boolean,
  outputFormat: OutputFormat,
  quality: number,
): Promise<ResizedItem> {
  const decoded = await loadImage(file);

  let targetWidth = Math.max(1, widthInput || decoded.width);
  let targetHeight = Math.max(1, heightInput || decoded.height);

  if (keepAspectRatio) {
    const widthScale = widthInput ? widthInput / decoded.width : Number.POSITIVE_INFINITY;
    const heightScale = heightInput ? heightInput / decoded.height : Number.POSITIVE_INFINITY;
    const scale = Math.min(widthScale, heightScale);

    if (Number.isFinite(scale)) {
      targetWidth = Math.max(1, Math.round(decoded.width * scale));
      targetHeight = Math.max(1, Math.round(decoded.height * scale));
    } else if (widthInput) {
      targetWidth = widthInput;
      targetHeight = Math.max(1, Math.round((decoded.height / decoded.width) * widthInput));
    } else if (heightInput) {
      targetHeight = heightInput;
      targetWidth = Math.max(1, Math.round((decoded.width / decoded.height) * heightInput));
    }
  }

  const mimeType = getMimeType(file, outputFormat);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d", {
    alpha: mimeType !== "image/jpeg",
    colorSpace: "srgb",
  });

  if (!context) {
    throw new Error("Could not create a drawing context for resizing.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(decoded.image, 0, 0, targetWidth, targetHeight);

  if (decoded.image instanceof ImageBitmap) {
    decoded.image.close();
  }

  let blob = await canvasToBlob(canvas, mimeType, quality);
  let finalMimeType = mimeType;

  if (!blob && mimeType === "image/webp") {
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
    finalMimeType = "image/jpeg";
  }

  if (!blob) {
    throw new Error("Image resizing failed for one of the files.");
  }

  const extension = extensionFromMimeType(finalMimeType);
  const resultUrl = URL.createObjectURL(blob);

  return {
    id: `${file.name}-${file.lastModified}`,
    name: `${baseName(file.name)}-${targetWidth}x${targetHeight}.${extension}`,
    blob,
    url: resultUrl,
    mimeType: finalMimeType,
    width: targetWidth,
    height: targetHeight,
    originalSize: file.size,
    resizedSize: blob.size,
  };
}

export default function ImageResizerTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [results, setResults] = useState<ResizedItem[]>([]);
  const [preset, setPreset] = useState<ResizePresetKey>("custom");
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1200);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [quality, setQuality] = useState(90);
  const [isResizing, setIsResizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      uploads.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      results.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [uploads, results]);

  const summary = useMemo(() => {
    const original = results.reduce((sum, item) => sum + item.originalSize, 0);
    const resized = results.reduce((sum, item) => sum + item.resizedSize, 0);
    const delta = original > 0 ? ((resized - original) / original) * 100 : 0;

    return { original, resized, delta };
  }, [results]);

  const activePresetDescription =
    preset === "custom" ? "Set your own exact width and height." : resizePresets[preset].description;

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
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });

    setResults((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((item) => item.id !== id);
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

  const handlePresetChange = (value: ResizePresetKey) => {
    setPreset(value);

    if (value !== "custom") {
      setWidth(resizePresets[value].width);
      setHeight(resizePresets[value].height);
    }
  };

  const handleResize = async () => {
    if (!uploads.length || isResizing || width <= 0 || height <= 0) {
      return;
    }

    setIsResizing(true);
    setProgress(0);
    setError(null);

    setResults((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return [];
    });

    try {
      const nextResults: ResizedItem[] = [];

      for (const [index, item] of uploads.entries()) {
        const resized = await resizeImageFile(
          item.file,
          width,
          height,
          keepAspectRatio,
          outputFormat,
          quality / 100,
        );

        nextResults.push(resized);
        setProgress(Math.round(((index + 1) / uploads.length) * 100));
      }

      setResults(nextResults);
    } catch (resizeError) {
      setError(
        resizeError instanceof Error
          ? resizeError.message
          : "Image resizing failed. Please try again.",
      );
    } finally {
      setIsResizing(false);
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
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="block text-sm font-medium text-slate-700">
            Preset
            <select
              value={preset}
              onChange={(event) => handlePresetChange(event.target.value as ResizePresetKey)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="custom">Custom</option>
              {Object.entries(resizePresets).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Width (px)
            <input
              type="number"
              min={1}
              value={width}
              onChange={(event) => {
                setPreset("custom");
                setWidth(Number(event.target.value) || 1);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Height (px)
            <input
              type="number"
              min={1}
              value={height}
              onChange={(event) => {
                setPreset("custom");
                setHeight(Number(event.target.value) || 1);
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Output format
            <select
              value={outputFormat}
              onChange={(event) => setOutputFormat(event.target.value as OutputFormat)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="original">Original format</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={keepAspectRatio}
              onChange={(event) => setKeepAspectRatio(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-sky-200"
            />
            Keep aspect ratio
          </label>

          <label className="block text-sm font-medium text-slate-700 lg:min-w-72">
            Quality ({quality}%)
            <input
              type="range"
              min={60}
              max={100}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="mt-2 w-full accent-slate-900"
            />
          </label>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">{activePresetDescription}</p>
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
        <p className="mt-4 text-base font-semibold text-slate-950">Upload images to resize</p>
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
                onClick={handleResize}
                disabled={isResizing}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResizing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImageIcon className="h-4 w-4" aria-hidden="true" />}
                {isResizing ? "Resizing..." : "Resize images"}
              </button>
            </div>
          </div>

          {isResizing ? (
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
                          Resized: {result.width} x {result.height}
                        </p>
                        <p className="text-xs text-slate-500">
                          Output: {bytesToSize(result.resizedSize)}
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
                      <p className="text-xs text-slate-500">Waiting for resize</p>
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
        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50/60 p-4 sm:p-5">
          <p className="text-sm font-semibold text-sky-900">Resize summary</p>
          <p className="mt-2 text-sm text-sky-800">
            {bytesToSize(summary.original)} to {bytesToSize(summary.resized)} ({summary.delta >= 0 ? "+" : ""}{summary.delta.toFixed(1)}% size change)
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
