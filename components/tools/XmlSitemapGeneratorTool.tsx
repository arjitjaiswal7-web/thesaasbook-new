"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCopy,
  Download,
  FileUp,
  Minus,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";

type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type SitemapEntry = {
  id: string;
  url: string;
  lastModified: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
  source: "manual" | "file";
};

type EntrySeed = {
  url: string;
  lastModified?: string;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
  source: "manual" | "file";
};

const changeFrequencyOptions: SitemapChangeFrequency[] = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
];

const priorityOptions = Array.from({ length: 11 }, (_, index) =>
  Number((1 - index * 0.1).toFixed(1)),
);

type DefaultEntryValues = {
  lastModified: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
};

type MergeSummary = {
  nextEntries: SitemapEntry[];
  added: number;
  duplicates: number;
  invalid: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  try {
    const url = new URL(candidate);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeLastModified(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const timestamp = Date.parse(trimmed);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function normalizeChangeFrequency(value?: string) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return changeFrequencyOptions.includes(normalized as SitemapChangeFrequency)
    ? (normalized as SitemapChangeFrequency)
    : undefined;
}

function normalizePriority(value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return Math.min(1, Math.max(0, Number(parsed.toFixed(1))));
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): EntrySeed[] {
  const rows = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(splitCsvLine);

  if (!rows.length) {
    return [];
  }

  const headerRow = rows[0].map((cell) => cell.toLowerCase());
  const hasHeader = headerRow.some((cell) =>
    ["url", "loc", "lastmod", "lastmodified", "changefreq", "changefrequency", "priority"].includes(cell),
  );

  const bodyRows = hasHeader ? rows.slice(1) : rows;
  const findColumn = (candidates: string[]) =>
    headerRow.findIndex((cell) => candidates.includes(cell));

  const urlIndex = hasHeader ? findColumn(["url", "loc"]) : 0;
  const lastModifiedIndex = hasHeader ? findColumn(["lastmod", "lastmodified"]) : -1;
  const changeFrequencyIndex = hasHeader ? findColumn(["changefreq", "changefrequency"]) : -1;
  const priorityIndex = hasHeader ? findColumn(["priority"]) : -1;

  return bodyRows
    .map((row) => ({
      url: row[urlIndex] || row[0] || "",
      lastModified: lastModifiedIndex >= 0 ? row[lastModifiedIndex] : undefined,
      changeFrequency: normalizeChangeFrequency(
        changeFrequencyIndex >= 0 ? row[changeFrequencyIndex] : undefined,
      ),
      priority: normalizePriority(priorityIndex >= 0 ? row[priorityIndex] : undefined),
      source: "file" as const,
    }))
    .filter((entry) => entry.url.trim() !== "");
}

function parseJson(content: string): EntrySeed[] {
  const parsed = JSON.parse(content) as unknown;

  const extract = (value: unknown): EntrySeed | null => {
    if (typeof value === "string") {
      return {
        url: value,
        source: "file",
      };
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const url = typeof record.url === "string"
        ? record.url
        : typeof record.loc === "string"
          ? record.loc
          : "";

      if (!url) {
        return null;
      }

      return {
        url,
        lastModified:
          typeof record.lastmod === "string"
            ? record.lastmod
            : typeof record.lastModified === "string"
              ? record.lastModified
              : undefined,
        changeFrequency: normalizeChangeFrequency(
          typeof record.changefreq === "string"
            ? record.changefreq
            : typeof record.changeFrequency === "string"
              ? record.changeFrequency
              : undefined,
        ),
        priority: normalizePriority(
          typeof record.priority === "number" || typeof record.priority === "string"
            ? record.priority
            : undefined,
        ),
        source: "file",
      };
    }

    return null;
  };

  const items = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { urls?: unknown[] }).urls)
      ? (parsed as { urls: unknown[] }).urls
      : [];

  return items.map(extract).filter((entry): entry is EntrySeed => Boolean(entry));
}

function parseXml(content: string): EntrySeed[] {
  const parser = new DOMParser();
  const xml = parser.parseFromString(content, "application/xml");
  const parserError = xml.querySelector("parsererror");

  if (parserError) {
    throw new Error("The XML file could not be parsed.");
  }

  const urlNodes = Array.from(xml.getElementsByTagName("url"));

  return urlNodes.map((node) => ({
    url: node.getElementsByTagName("loc")[0]?.textContent?.trim() || "",
    lastModified: node.getElementsByTagName("lastmod")[0]?.textContent?.trim() || undefined,
    changeFrequency: normalizeChangeFrequency(
      node.getElementsByTagName("changefreq")[0]?.textContent?.trim() || undefined,
    ),
    priority: normalizePriority(
      node.getElementsByTagName("priority")[0]?.textContent?.trim() || undefined,
    ),
    source: "file" as const,
  })).filter((entry) => entry.url);
}

function parseText(content: string): EntrySeed[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({ url, source: "file" as const }));
}

function buildSitemapXml(entries: SitemapEntry[]) {
  const lines = entries
    .map(
      (entry) => `  <url>\n    <loc>${escapeXml(entry.url)}</loc>\n    <lastmod>${entry.lastModified}</lastmod>\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines}\n</urlset>`;
}

function downloadText(content: string, fileName: string) {
  const blob = new Blob([content], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createEntryFromSeed(seed: EntrySeed, defaults: DefaultEntryValues): SitemapEntry {
  const normalizedUrl = normalizeUrl(seed.url);

  if (!normalizedUrl) {
    throw new Error("Invalid URL seed passed into createEntryFromSeed.");
  }

  return {
    id: normalizedUrl,
    url: normalizedUrl,
    lastModified: normalizeLastModified(seed.lastModified) ?? defaults.lastModified,
    changeFrequency: seed.changeFrequency ?? defaults.changeFrequency,
    priority: seed.priority ?? defaults.priority,
    source: seed.source,
  };
}

function mergeImportedSeeds(
  current: SitemapEntry[],
  seeds: EntrySeed[],
  defaults: DefaultEntryValues,
): MergeSummary {
  const nextEntries = [...current];
  const existingUrls = new Set(current.map((entry) => entry.url));
  let added = 0;
  let duplicates = 0;
  let invalid = 0;

  for (const seed of seeds) {
    const normalizedUrl = normalizeUrl(seed.url);

    if (!normalizedUrl) {
      invalid += 1;
      continue;
    }

    if (existingUrls.has(normalizedUrl)) {
      duplicates += 1;
      continue;
    }

    nextEntries.push(createEntryFromSeed({ ...seed, url: normalizedUrl }, defaults));
    existingUrls.add(normalizedUrl);
    added += 1;
  }

  return {
    nextEntries,
    added,
    duplicates,
    invalid,
  };
}

function syncManualEntriesFromText(
  current: SitemapEntry[],
  manualUrls: string,
  defaults: DefaultEntryValues,
) {
  const fileEntries = current.filter((entry) => entry.source === "file");
  const currentManualEntries = new Map(
    current
      .filter((entry) => entry.source === "manual")
      .map((entry) => [entry.url, entry] as const),
  );
  const fileUrls = new Set(fileEntries.map((entry) => entry.url));
  const nextManualUrls = Array.from(
    new Set(
      manualUrls
        .split(/\r?\n/)
        .map((line) => normalizeUrl(line))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const manualEntries = nextManualUrls
    .filter((url) => !fileUrls.has(url))
    .map(
      (url) =>
        currentManualEntries.get(url) ??
        createEntryFromSeed({ url, source: "manual" }, defaults),
    );

  return [...fileEntries, ...manualEntries];
}

export default function XmlSitemapGeneratorTool() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualUrls, setManualUrls] = useState("");
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [defaultLastModified, setDefaultLastModified] = useState("");
  const [defaultChangeFrequency, setDefaultChangeFrequency] = useState<SitemapChangeFrequency>("weekly");
  const [defaultPriority, setDefaultPriority] = useState(0.8);
  const [fileName, setFileName] = useState("sitemap.xml");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const generatedXml = useMemo(
    () => (entries.length ? buildSitemapXml(entries) : ""),
    [entries],
  );

  const counts = useMemo(() => {
    const manualCount = entries.filter((entry) => entry.source === "manual").length;
    const fileCount = entries.length - manualCount;

    return {
      total: entries.length,
      manual: manualCount,
      file: fileCount,
    };
  }, [entries]);

  const activeSelectedIds = useMemo(
    () => selectedEntryIds.filter((id) => entries.some((entry) => entry.id === id)),
    [entries, selectedEntryIds],
  );

  const selectedEntrySet = useMemo(
    () => new Set(activeSelectedIds),
    [activeSelectedIds],
  );

  const allSelected = entries.length > 0 && activeSelectedIds.length === entries.length;
  const someSelected = activeSelectedIds.length > 0 && !allSelected;

  const getEffectiveLastModified = () =>
    defaultLastModified || new Date().toISOString().slice(0, 10);

  const handleManualUrlsChange = (value: string) => {
    setManualUrls(value);
    setEntries((current) => {
      const nextEntries = syncManualEntriesFromText(current, value, {
        lastModified: getEffectiveLastModified(),
        changeFrequency: defaultChangeFrequency,
        priority: defaultPriority,
      });

      setSelectedEntryIds((currentSelectedIds) =>
        currentSelectedIds.filter((id) => nextEntries.some((entry) => entry.id === id)),
      );

      return nextEntries;
    });
    setHasGenerated(false);
    setError(null);
  };

  const handleFileImport = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const seeds: EntrySeed[] = [];
    const failures: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const extension = file.name.split(".").pop()?.toLowerCase();

        if (extension === "csv") {
          seeds.push(...parseCsv(content));
        } else if (extension === "json") {
          seeds.push(...parseJson(content));
        } else if (extension === "xml") {
          seeds.push(...parseXml(content));
        } else {
          seeds.push(...parseText(content));
        }
      } catch (importError) {
        failures.push(
          importError instanceof Error
            ? `${file.name}: ${importError.message}`
            : `${file.name}: Could not be imported.`,
        );
      }
    }

    if (failures.length) {
      setError(failures.join(" "));
    } else {
      setError(null);
    }

    if (seeds.length) {
      const summary = mergeImportedSeeds(entries, seeds, {
        lastModified: getEffectiveLastModified(),
        changeFrequency: defaultChangeFrequency,
        priority: defaultPriority,
      });

      setEntries(summary.nextEntries);
      setStatus(
        [
          summary.added ? `${summary.added} URL${summary.added > 1 ? "s" : ""} added` : null,
          summary.duplicates
            ? `${summary.duplicates} duplicate${summary.duplicates > 1 ? "s" : ""} skipped`
            : null,
          summary.invalid
            ? `${summary.invalid} invalid item${summary.invalid > 1 ? "s" : ""} ignored`
            : null,
        ]
          .filter(Boolean)
          .join(" • ") || "No new URLs were added.",
      );
      setHasGenerated(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateEntry = (id: string, patch: Partial<SitemapEntry>) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const applyDefaultsToAll = () => {
    setEntries((current) =>
      current.map((entry) => ({
        ...entry,
        lastModified: getEffectiveLastModified(),
        changeFrequency: defaultChangeFrequency,
        priority: defaultPriority,
      })),
    );
    setStatus("Applied the default last modified date, change frequency, and priority to all URLs.");
  };

  const applyDefaultsToSelected = () => {
    if (!activeSelectedIds.length) {
      setError("Select at least one URL before applying bulk changes.");
      return;
    }

    setEntries((current) =>
      current.map((entry) =>
        selectedEntrySet.has(entry.id)
          ? {
              ...entry,
              lastModified: getEffectiveLastModified(),
              changeFrequency: defaultChangeFrequency,
              priority: defaultPriority,
            }
          : entry,
      ),
    );
    setStatus(
      `Applied the default last modified date, change frequency, and priority to ${activeSelectedIds.length} selected URL${activeSelectedIds.length > 1 ? "s" : ""}.`,
    );
    setError(null);
  };

  const toggleEntrySelection = (id: string, checked: boolean) => {
    setSelectedEntryIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((entryId) => entryId !== id);
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedEntryIds(checked ? entries.map((entry) => entry.id) : []);
  };

  const clearSelection = () => {
    setSelectedEntryIds([]);
  };

  const removeSelected = () => {
    if (!activeSelectedIds.length) {
      setError("Select at least one URL before removing rows.");
      return;
    }

    const selectedIds = new Set(activeSelectedIds);

    setEntries((current) => current.filter((entry) => !selectedIds.has(entry.id)));
    setSelectedEntryIds([]);
    setStatus(`Removed ${activeSelectedIds.length} selected URL${activeSelectedIds.length > 1 ? "s" : ""}.`);
    setError(null);
    setHasGenerated(false);
  };

  const removeEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setSelectedEntryIds((current) => current.filter((entryId) => entryId !== id));
  };

  const clearAll = () => {
    setEntries([]);
    setSelectedEntryIds([]);
    setManualUrls("");
    setStatus(null);
    setError(null);
    setHasGenerated(false);
  };

  const handleGenerate = () => {
    if (!entries.length) {
      setError("Add at least one valid URL before generating the sitemap.");
      return;
    }

    const invalidCount = entries.filter((entry) => !normalizeUrl(entry.url)).length;

    if (invalidCount) {
      setError(
        `${invalidCount} URL${invalidCount > 1 ? "s are" : " is"} invalid. Fix or remove those rows before generating the sitemap.`,
      );
      return;
    }

    setHasGenerated(true);
    setError(null);
    setStatus(`Generated XML sitemap with ${entries.length} URL${entries.length > 1 ? "s" : ""}.`);
  };

  const handleCopy = async () => {
    if (!generatedXml) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedXml);
      setCopied(true);
      setStatus("Sitemap XML copied to your clipboard.");
    } catch {
      setError("Clipboard access was blocked. You can still download the XML file.");
    }
  };

  const handleDownload = () => {
    if (!generatedXml) {
      return;
    }

    const normalizedFileName = fileName.trim().endsWith(".xml")
      ? fileName.trim()
      : `${fileName.trim() || "sitemap"}.xml`;

    downloadText(generatedXml, normalizedFileName);
    setStatus(`Downloaded ${normalizedFileName}.`);
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.json,.xml,text/plain,text/csv,application/json,application/xml,text/xml"
        multiple
        className="hidden"
        onChange={(event) => void handleFileImport(event.target.files)}
      />

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,22rem)]">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Paste URLs directly
              <textarea
                value={manualUrls}
                onChange={(event) => handleManualUrlsChange(event.target.value)}
                rows={9}
                placeholder={"https://www.example.com/\nhttps://www.example.com/pricing\nhttps://www.example.com/blog/post"}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Add one URL per line. URLs from this box appear in the table automatically, and duplicates are removed for you.
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <FileUp className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">
              Import supported files
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload <span className="font-semibold text-slate-900">TXT</span>, <span className="font-semibold text-slate-900">CSV</span>, <span className="font-semibold text-slate-900">JSON</span>, or an existing <span className="font-semibold text-slate-900">XML sitemap</span>. CSV, JSON, and XML imports can preserve <code>lastmod</code>, <code>changefreq</code>, and <code>priority</code>.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Upload file
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={clearAll}
            disabled={!entries.length && !manualUrls}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear all
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_12rem_12rem]">
          <label className="block text-sm font-medium text-slate-700">
            Default last modified
            <input
              type="date"
              value={defaultLastModified}
              onChange={(event) => setDefaultLastModified(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            />
            <span className="mt-2 block text-xs leading-5 text-slate-500">
              If left blank, the generator uses today&apos;s date when it creates the sitemap.
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Change frequency
            <select
              value={defaultChangeFrequency}
              onChange={(event) =>
                setDefaultChangeFrequency(event.target.value as SitemapChangeFrequency)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              {changeFrequencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Priority
            <select
              value={defaultPriority}
              onChange={(event) => setDefaultPriority(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option.toFixed(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0 text-sm font-medium text-slate-700">
            File name
            <input
              type="text"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={applyDefaultsToSelected}
            disabled={!activeSelectedIds.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Apply defaults to selected
          </button>
          <button
            type="button"
            onClick={applyDefaultsToAll}
            disabled={!entries.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Apply defaults to all
          </button>
          <button
            type="button"
            onClick={removeSelected}
            disabled={!activeSelectedIds.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remove selected
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={!activeSelectedIds.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
            Clear selection
          </button>
        </div>
      </div>

      {status ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {status}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Total URLs</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{counts.total}</p>
          <p className="mt-2 text-sm text-slate-600">All current URLs included in this sitemap draft.</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Manual URLs</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{counts.manual}</p>
          <p className="mt-2 text-sm text-slate-600">Added directly from the text box.</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Imported URLs</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{counts.file}</p>
          <p className="mt-2 text-sm text-slate-600">Loaded from TXT, CSV, JSON, or XML files.</p>
        </article>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Selected URLs</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{activeSelectedIds.length}</p>
          <p className="mt-2 text-sm text-slate-600">Use checkboxes to bulk-update or remove rows together.</p>
        </article>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Sitemap URL entries</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review imported URLs and adjust <code>lastmod</code>, <code>changefreq</code>, and <code>priority</code> before generating the XML file.
            </p>
          </div>
        </div>

        {entries.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="px-3 py-3 font-semibold">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(element) => {
                          if (element) {
                            element.indeterminate = someSelected;
                          }
                        }}
                        onChange={(event) => toggleSelectAll(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                        aria-label="Select all URLs"
                      />
                      <span>Select</span>
                    </label>
                  </th>
                  <th className="px-3 py-3 font-semibold">URL</th>
                  <th className="px-3 py-3 font-semibold">Last modified</th>
                  <th className="px-3 py-3 font-semibold">Changefreq</th>
                  <th className="px-3 py-3 font-semibold">Priority</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={selectedEntrySet.has(entry.id)}
                        onChange={(event) => toggleEntrySelection(entry.id, event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                        aria-label={`Select ${entry.url}`}
                      />
                    </td>
                    <td className="px-3 py-4 align-top">
                      <div className="min-w-[16rem] max-w-full break-all rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 sm:min-w-[20rem]">
                        {entry.url}
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <input
                        type="date"
                        value={entry.lastModified}
                        onChange={(event) => updateEntry(entry.id, { lastModified: event.target.value })}
                        className="min-w-[8.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                      />
                    </td>
                    <td className="px-3 py-4 align-top">
                      <select
                        value={entry.changeFrequency}
                        onChange={(event) =>
                          updateEntry(entry.id, {
                            changeFrequency: event.target.value as SitemapChangeFrequency,
                          })
                        }
                        className="min-w-[8rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                      >
                        {changeFrequencyOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <select
                        value={entry.priority}
                        onChange={(event) => updateEntry(entry.id, { priority: Number(event.target.value) })}
                        className="min-w-[5.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.toFixed(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            Add URLs directly or upload a file to start building your sitemap.
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Generated XML sitemap</h2>
            <p className="mt-1 text-sm text-slate-600">
              Generate the XML output, copy it to your clipboard, or download it directly as a sitemap file.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Generate XML sitemap
            </button>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!entries.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
              {copied ? "Copied" : "Copy XML"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!entries.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download XML
            </button>
          </div>
        </div>

        {hasGenerated && generatedXml ? (
          <textarea
            value={generatedXml}
            readOnly
            rows={18}
            className="mt-5 w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-xs leading-6 text-slate-800"
          />
        ) : (
          <div className="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
            Generate the sitemap to preview the final XML output here.
          </div>
        )}
      </section>
    </div>
  );
}
