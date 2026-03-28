"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Crop, Download, Loader2, Move, RotateCcw, UploadCloud } from "lucide-react";

type OutputFormat = "original" | "jpeg" | "png" | "webp";
type AspectPreset = "free" | "square" | "wide" | "portrait" | "classic";
type DragMode = "move" | "nw" | "ne" | "sw" | "se";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type UploadState = {
  file: File;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
};

type ResultState = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
};

type DragState = {
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  startCrop: CropRect;
};

const MIN_CROP_SIZE = 50;

const aspectRatios: Record<Exclude<AspectPreset, "free">, number> = {
  square: 1,
  wide: 16 / 9,
  portrait: 4 / 5,
  classic: 3 / 2,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Math.round(value);
}

function baseName(value: string) {
  return value.replace(/\.[^./]+$/, "") || "cropped-image";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getMimeType(file: File, outputFormat: OutputFormat) {
  if (outputFormat === "jpeg") {
    return "image/jpeg";
  }

  if (outputFormat === "png") {
    return "image/png";
  }

  if (outputFormat === "webp") {
    return "image/webp";
  }

  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return file.type;
  }

  return "image/png";
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

async function loadImage(file: File) {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        image: bitmap as CanvasImageSource,
      };
    } catch {
      // Fall back to HTMLImageElement.
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
      image: image as CanvasImageSource,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createCenteredCrop(width: number, height: number, preset: AspectPreset): CropRect {
  if (preset === "free") {
    return {
      x: round(width * 0.1),
      y: round(height * 0.1),
      width: round(width * 0.8),
      height: round(height * 0.8),
    };
  }

  const ratio = aspectRatios[preset];
  let cropWidth = round(width * 0.8);
  let cropHeight = round(cropWidth / ratio);

  if (cropHeight > height * 0.8) {
    cropHeight = round(height * 0.8);
    cropWidth = round(cropHeight * ratio);
  }

  return {
    x: round((width - cropWidth) / 2),
    y: round((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}

function adjustCropToAspect(crop: CropRect, image: UploadState, preset: AspectPreset) {
  if (preset === "free") {
    const width = clamp(round(crop.width), MIN_CROP_SIZE, image.naturalWidth);
    const height = clamp(round(crop.height), MIN_CROP_SIZE, image.naturalHeight);

    return {
      x: clamp(round(crop.x), 0, image.naturalWidth - width),
      y: clamp(round(crop.y), 0, image.naturalHeight - height),
      width,
      height,
    };
  }

  const ratio = aspectRatios[preset];
  const minWidth = Math.max(MIN_CROP_SIZE, round(MIN_CROP_SIZE * ratio));
  let width = clamp(round(crop.width), minWidth, image.naturalWidth);
  let height = round(width / ratio);

  if (height > image.naturalHeight) {
    height = image.naturalHeight;
    width = round(height * ratio);
  }

  const x = clamp(round(crop.x), 0, image.naturalWidth - width);
  const y = clamp(round(crop.y), 0, image.naturalHeight - height);

  return { x, y, width, height };
}

function resizeCropFromHandle(
  initialCrop: CropRect,
  handle: Exclude<DragMode, "move">,
  deltaX: number,
  deltaY: number,
  image: UploadState,
  preset: AspectPreset,
) {
  const left = initialCrop.x;
  const top = initialCrop.y;
  const right = initialCrop.x + initialCrop.width;
  const bottom = initialCrop.y + initialCrop.height;

  if (preset === "free") {
    if (handle === "nw") {
      const nextLeft = clamp(round(left + deltaX), 0, right - MIN_CROP_SIZE);
      const nextTop = clamp(round(top + deltaY), 0, bottom - MIN_CROP_SIZE);
      return {
        x: nextLeft,
        y: nextTop,
        width: right - nextLeft,
        height: bottom - nextTop,
      };
    }

    if (handle === "ne") {
      const nextRight = clamp(round(right + deltaX), left + MIN_CROP_SIZE, image.naturalWidth);
      const nextTop = clamp(round(top + deltaY), 0, bottom - MIN_CROP_SIZE);
      return {
        x: left,
        y: nextTop,
        width: nextRight - left,
        height: bottom - nextTop,
      };
    }

    if (handle === "sw") {
      const nextLeft = clamp(round(left + deltaX), 0, right - MIN_CROP_SIZE);
      const nextBottom = clamp(round(bottom + deltaY), top + MIN_CROP_SIZE, image.naturalHeight);
      return {
        x: nextLeft,
        y: top,
        width: right - nextLeft,
        height: nextBottom - top,
      };
    }

    const nextRight = clamp(round(right + deltaX), left + MIN_CROP_SIZE, image.naturalWidth);
    const nextBottom = clamp(round(bottom + deltaY), top + MIN_CROP_SIZE, image.naturalHeight);

    return {
      x: left,
      y: top,
      width: nextRight - left,
      height: nextBottom - top,
    };
  }

  const ratio = aspectRatios[preset];
  const minWidth = Math.max(MIN_CROP_SIZE, round(MIN_CROP_SIZE * ratio));
  const minHeight = Math.max(MIN_CROP_SIZE, round(minWidth / ratio));

  if (handle === "nw") {
    const anchorX = right;
    const anchorY = bottom;
    const cursorX = clamp(round(left + deltaX), 0, anchorX - minWidth);
    const cursorY = clamp(round(top + deltaY), 0, anchorY - minHeight);
    const availableWidth = anchorX - cursorX;
    const availableHeight = anchorY - cursorY;
    const width = clamp(
      Math.min(availableWidth, round(availableHeight * ratio)),
      minWidth,
      anchorX,
    );
    const height = round(width / ratio);

    return {
      x: anchorX - width,
      y: anchorY - height,
      width,
      height,
    };
  }

  if (handle === "ne") {
    const anchorX = left;
    const anchorY = bottom;
    const cursorX = clamp(round(right + deltaX), anchorX + minWidth, image.naturalWidth);
    const cursorY = clamp(round(top + deltaY), 0, anchorY - minHeight);
    const availableWidth = cursorX - anchorX;
    const availableHeight = anchorY - cursorY;
    const width = clamp(
      Math.min(availableWidth, round(availableHeight * ratio)),
      minWidth,
      image.naturalWidth - anchorX,
    );
    const height = round(width / ratio);

    return {
      x: anchorX,
      y: anchorY - height,
      width,
      height,
    };
  }

  if (handle === "sw") {
    const anchorX = right;
    const anchorY = top;
    const cursorX = clamp(round(left + deltaX), 0, anchorX - minWidth);
    const cursorY = clamp(round(bottom + deltaY), anchorY + minHeight, image.naturalHeight);
    const availableWidth = anchorX - cursorX;
    const availableHeight = cursorY - anchorY;
    const width = clamp(
      Math.min(availableWidth, round(availableHeight * ratio)),
      minWidth,
      anchorX,
    );
    const height = round(width / ratio);

    return {
      x: anchorX - width,
      y: anchorY,
      width,
      height,
    };
  }

  const anchorX = left;
  const anchorY = top;
  const cursorX = clamp(round(right + deltaX), anchorX + minWidth, image.naturalWidth);
  const cursorY = clamp(round(bottom + deltaY), anchorY + minHeight, image.naturalHeight);
  const availableWidth = cursorX - anchorX;
  const availableHeight = cursorY - anchorY;
  const width = clamp(
    Math.min(availableWidth, round(availableHeight * ratio)),
    minWidth,
    image.naturalWidth - anchorX,
  );
  const height = round(width / ratio);

  return {
    x: anchorX,
    y: anchorY,
    width,
    height,
  };
}

export default function ImageCropperTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("free");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<ResultState | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scale = useMemo(() => {
    if (!upload || !displaySize.width || !displaySize.height) {
      return { x: 1, y: 1 };
    }

    return {
      x: displaySize.width / upload.naturalWidth,
      y: displaySize.height / upload.naturalHeight,
    };
  }, [displaySize, upload]);

  const clearResult = useCallback(() => {
    setResult((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (upload) {
        URL.revokeObjectURL(upload.previewUrl);
      }

      if (result) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result, upload]);

  useEffect(() => {
    if (!imageRef.current) {
      return;
    }

    const imageElement = imageRef.current;
    const observer = new ResizeObserver(() => {
      setDisplaySize({
        width: imageElement.clientWidth,
        height: imageElement.clientHeight,
      });
    });

    observer.observe(imageElement);

    return () => observer.disconnect();
  }, [upload]);

  const applyCrop = useCallback(
    (nextCrop: CropRect) => {
      if (!upload) {
        return;
      }

      const normalized = adjustCropToAspect(nextCrop, upload, aspectPreset);
      setCrop(normalized);
      clearResult();
    },
    [aspectPreset, clearResult, upload],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState || !upload) {
        return;
      }

      const deltaX = (event.clientX - dragState.startClientX) / scale.x;
      const deltaY = (event.clientY - dragState.startClientY) / scale.y;

      if (dragState.mode === "move") {
        applyCrop({
          ...dragState.startCrop,
          x: dragState.startCrop.x + deltaX,
          y: dragState.startCrop.y + deltaY,
        });
        return;
      }

      applyCrop(
        resizeCropFromHandle(
          dragState.startCrop,
          dragState.mode,
          deltaX,
          deltaY,
          upload,
          aspectPreset,
        ),
      );
    };

    const stopDragging = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [applyCrop, aspectPreset, scale.x, scale.y, upload]);

  const overlayStyle = useMemo(() => {
    if (!crop || !upload) {
      return null;
    }

    return {
      left: crop.x * scale.x,
      top: crop.y * scale.y,
      width: crop.width * scale.x,
      height: crop.height * scale.y,
    };
  }, [crop, scale, upload]);

  const handleUpload = useCallback(
    async (file: File | null) => {
      if (!file || !file.type.startsWith("image/")) {
        return;
      }

      try {
        const decoded = await loadImage(file);
        const previewUrl = URL.createObjectURL(file);

        if (upload) {
          URL.revokeObjectURL(upload.previewUrl);
        }

        clearResult();

        const nextUpload: UploadState = {
          file,
          previewUrl,
          naturalWidth: decoded.width,
          naturalHeight: decoded.height,
        };

        if (decoded.image instanceof ImageBitmap) {
          decoded.image.close();
        }

        setUpload(nextUpload);
        setCrop(createCenteredCrop(decoded.width, decoded.height, aspectPreset));
        setError(null);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Could not open the image file.",
        );
      }
    },
    [aspectPreset, clearResult, upload],
  );

  const clearAll = useCallback(() => {
    if (upload) {
      URL.revokeObjectURL(upload.previewUrl);
    }

    clearResult();
    setUpload(null);
    setCrop(null);
    setError(null);
    setDisplaySize({ width: 0, height: 0 });
    dragStateRef.current = null;

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [clearResult, upload]);

  const handleAspectChange = useCallback(
    (value: AspectPreset) => {
      setAspectPreset(value);

      if (!upload) {
        return;
      }

      applyCrop(currentCropOrDefault(crop, upload, value));
    },
    [applyCrop, crop, upload],
  );

  const updateCrop = useCallback(
    (updates: Partial<CropRect>) => {
      if (!crop) {
        return;
      }

      applyCrop({
        ...crop,
        ...updates,
      });
    },
    [applyCrop, crop],
  );

  const startInteraction = useCallback(
    (mode: DragMode) => (event: ReactPointerEvent<HTMLElement>) => {
      if (!crop) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      dragStateRef.current = {
        mode,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startCrop: crop,
      };
    },
    [crop],
  );

  const handleCrop = async () => {
    if (!upload || !crop) {
      return;
    }

    setIsCropping(true);
    setError(null);
    clearResult();

    try {
      const decoded = await loadImage(upload.file);
      const mimeType = getMimeType(upload.file, outputFormat);
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;

      const context = canvas.getContext("2d", {
        alpha: mimeType !== "image/jpeg",
        colorSpace: "srgb",
      });

      if (!context) {
        throw new Error("Could not create a drawing context for cropping.");
      }

      if (mimeType === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        decoded.image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );

      if (decoded.image instanceof ImageBitmap) {
        decoded.image.close();
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          resolve,
          mimeType,
          mimeType === "image/png" ? undefined : quality / 100,
        );
      });

      if (!blob) {
        throw new Error("Image cropping failed. Please try again.");
      }

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        width: crop.width,
        height: crop.height,
        size: blob.size,
      });
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Image cropping failed. Please try again.",
      );
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="block text-sm font-medium text-slate-700">
            Aspect ratio
            <select
              value={aspectPreset}
              onChange={(event) => handleAspectChange(event.target.value as AspectPreset)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              <option value="free">Free crop</option>
              <option value="square">Square (1:1)</option>
              <option value="wide">Wide (16:9)</option>
              <option value="portrait">Portrait (4:5)</option>
              <option value="classic">Classic (3:2)</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Export format
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

          <label className="block text-sm font-medium text-slate-700 lg:min-w-72">
            Quality ({quality}%)
            <input
              type="range"
              min={60}
              max={100}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              disabled={outputFormat === "png"}
              className="mt-2 w-full accent-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Drag the crop box directly on the image, pull the corner handles to resize,
          and use the controls below only if you need exact pixel tuning.
        </p>
      </div>

      {!upload ? (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleUpload(event.dataTransfer.files?.[0] ?? null);
          }}
          className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-semibold text-slate-950">Upload an image to crop</p>
          <p className="mt-2 text-sm text-slate-600">JPG, PNG, and WebP supported.</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Select image
          </button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Crop preview</p>
                <p className="mt-1 text-xs text-slate-500">
                  Drag inside the crop area to move it. Use the corner handles to resize.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  upload && setCrop(createCenteredCrop(upload.naturalWidth, upload.naturalHeight, aspectPreset))
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset crop
              </button>
            </div>

            <div className="mt-5 flex justify-center rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="relative inline-block max-w-full overflow-hidden rounded-2xl select-none">
                {/* Preview uses a runtime object URL. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={upload.previewUrl}
                  alt={upload.file.name}
                  className="max-h-[34rem] w-auto max-w-full rounded-2xl object-contain"
                  draggable={false}
                />
                {overlayStyle ? (
                  <div
                    role="presentation"
                    onPointerDown={startInteraction("move")}
                    className="absolute cursor-move border-2 border-sky-500 bg-sky-500/15 shadow-[0_0_0_9999px_rgba(15,23,42,0.42)] touch-none"
                    style={overlayStyle}
                  >
                    <div className="pointer-events-none absolute -top-9 left-0 rounded-lg bg-slate-950/90 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
                      {crop ? `${crop.width} x ${crop.height}` : null}
                    </div>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/90">
                      <Move className="h-5 w-5 drop-shadow" aria-hidden="true" />
                    </div>

                    {[
                      { key: "nw", className: "-left-2.5 -top-2.5 cursor-nwse-resize" },
                      { key: "ne", className: "-right-2.5 -top-2.5 cursor-nesw-resize" },
                      { key: "sw", className: "-bottom-2.5 -left-2.5 cursor-nesw-resize" },
                      { key: "se", className: "-bottom-2.5 -right-2.5 cursor-nwse-resize" },
                    ].map((handle) => (
                      <button
                        key={handle.key}
                        type="button"
                        aria-label={`Resize crop ${handle.key}`}
                        onPointerDown={startInteraction(handle.key as Exclude<DragMode, "move">)}
                        className={`absolute h-5 w-5 rounded-full border-2 border-white bg-sky-500 shadow ${handle.className}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {crop && upload ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Horizontal position ({crop.x}px)
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, upload.naturalWidth - crop.width)}
                    value={crop.x}
                    onChange={(event) => updateCrop({ x: Number(event.target.value) })}
                    className="mt-2 w-full accent-slate-900"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Vertical position ({crop.y}px)
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, upload.naturalHeight - crop.height)}
                    value={crop.y}
                    onChange={(event) => updateCrop({ y: Number(event.target.value) })}
                    className="mt-2 w-full accent-slate-900"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Crop width ({crop.width}px)
                  <input
                    type="range"
                    min={MIN_CROP_SIZE}
                    max={upload.naturalWidth - crop.x}
                    value={crop.width}
                    onChange={(event) => updateCrop({ width: Number(event.target.value) })}
                    className="mt-2 w-full accent-slate-900"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Crop height ({crop.height}px)
                  <input
                    type="range"
                    min={MIN_CROP_SIZE}
                    max={upload.naturalHeight - crop.y}
                    value={crop.height}
                    disabled={aspectPreset !== "free"}
                    onChange={(event) => updateCrop({ height: Number(event.target.value) })}
                    className="mt-2 w-full accent-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Source image</p>
                  <p className="mt-1 text-xs text-slate-500">{upload.file.name}</p>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
                >
                  Replace
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Original size: {bytesToSize(upload.file.size)}</p>
                <p>
                  Original dimensions: {upload.naturalWidth} x {upload.naturalHeight}
                </p>
                {crop ? (
                  <p>
                    Crop area: {crop.width} x {crop.height}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleCrop}
                disabled={!crop || isCropping}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCropping ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Crop className="h-4 w-4" aria-hidden="true" />
                )}
                {isCropping ? "Cropping..." : "Crop image"}
              </button>
            </div>

            {result ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">Cropped output</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {/* Preview uses a runtime object URL. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result.url} alt="Cropped preview" className="h-auto w-full object-contain" />
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    Output dimensions: {result.width} x {result.height}
                  </p>
                  <p>Output size: {bytesToSize(result.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      result.blob,
                      `${baseName(upload.file.name)}-cropped.${extensionFromMimeType(getMimeType(upload.file, outputFormat))}`,
                    )
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download cropped image
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function currentCropOrDefault(
  crop: CropRect | null,
  upload: UploadState,
  preset: AspectPreset,
) {
  return crop ?? createCenteredCrop(upload.naturalWidth, upload.naturalHeight, preset);
}
