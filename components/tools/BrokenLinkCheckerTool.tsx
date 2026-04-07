"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCopy,
  Clock3,
  Download,
  Globe,
  Loader2,
  Lock,
  Search,
} from "lucide-react";

type LinkCategory = "valid" | "redirect" | "blocked" | "timeout" | "broken";

type GroupedLinkResult = {
  url: string;
  status: number | "timeout";
  type: "internal" | "external";
  occurrences: number;
  sources: string[];
  category: LinkCategory;
  responseTime: number | null;
  finalUrl: string | null;
  redirectChain: string[];
  note: string | null;
};

type BrokenLinkScanResponse = {
  url: string;
  totalLinks: number;
  uniqueLinks: number;
  brokenLinks: number;
  blockedLinks: number;
  timeoutLinks: number;
  scannedPages: number;
  discoveredPages: number;
  groupedResults: GroupedLinkResult[];
  maxDepth: number;
  startedAt: string;
  finishedAt: string;
};

type BrokenLinkScanProgress = {
  progress: number;
  phase: string;
  currentUrl: string | null;
  totalLinks: number;
  uniqueLinks: number;
  checkedLinks: number;
  brokenLinks: number;
  blockedLinks: number;
  timeoutLinks: number;
  scannedPages: number;
  discoveredPages: number;
  newResults: GroupedLinkResult[];
};

type StreamEvent =
  | { type: "progress"; payload: BrokenLinkScanProgress }
  | { type: "complete"; payload: BrokenLinkScanResponse }
  | { type: "error"; error: string };

const CATEGORY_META: Record<
  LinkCategory,
  { label: string; badgeClass: string; icon: string }
> = {
  valid: {
    label: "Valid",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: "✅",
  },
  redirect: {
    label: "Redirect",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: "⚠️",
  },
  blocked: {
    label: "Crawler Blocked",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    icon: "🔒",
  },
  timeout: {
    label: "Timeout",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
    icon: "⏱️",
  },
  broken: {
    label: "Broken",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
    icon: "❌",
  },
};

function mergeGroupedResults(
  current: GroupedLinkResult[],
  incoming: GroupedLinkResult[],
) {
  const merged = new Map(current.map((result) => [result.url, result]));

  incoming.forEach((result) => {
    merged.set(result.url, result);
  });

  return Array.from(merged.values());
}

function buildCsv(results: GroupedLinkResult[]) {
  const header = [
    "URL",
    "Status",
    "Category",
    "Type",
    "Occurrences",
    "Source Pages",
    "Response Time (ms)",
    "Final URL",
    "Redirect Chain",
    "Note",
  ];

  const rows = results.map((result) => [
    result.url,
    result.status,
    result.category,
    result.type,
    result.occurrences,
    result.sources.join(" | "),
    result.responseTime ?? "",
    result.finalUrl ?? "",
    result.redirectChain.join(" -> "),
    result.note ?? "",
  ]);

  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

  return [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BrokenLinkCheckerTool() {
  const [url, setUrl] = useState("");
  const [groupedResults, setGroupedResults] = useState<GroupedLinkResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("Ready to scan");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [issueLinks, setIssueLinks] = useState(0);
  const [uniqueLinks, setUniqueLinks] = useState(0);
  const [checkedLinks, setCheckedLinks] = useState(0);
  const [brokenLinks, setBrokenLinks] = useState(0);
  const [blockedLinks, setBlockedLinks] = useState(0);
  const [timeoutLinks, setTimeoutLinks] = useState(0);
  const [scannedPages, setScannedPages] = useState(0);
  const [discoveredPages, setDiscoveredPages] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "broken" | "blocked" | "timeout">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredResults = useMemo(() => {
    if (activeFilter === "all") {
      return groupedResults;
    }

    return groupedResults.filter((result) => result.category === activeFilter);
  }, [activeFilter, groupedResults]);

  const handleScan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCopied(false);
    setGroupedResults([]);
    setProgress(0);
    setPhase("Starting scan");
    setCurrentUrl(null);
    setIssueLinks(0);
    setUniqueLinks(0);
    setCheckedLinks(0);
    setBrokenLinks(0);
    setBlockedLinks(0);
    setTimeoutLinks(0);
    setScannedPages(0);
    setDiscoveredPages(0);
    setStartedAt(new Date().toISOString());
    setFinishedAt(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-stream": "1",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "The scan could not be started.");
      }

      if (!response.body) {
        throw new Error("No scan stream was returned.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const eventPayload = JSON.parse(line) as StreamEvent;

          if (eventPayload.type === "progress") {
            setProgress(eventPayload.payload.progress);
            setPhase(eventPayload.payload.phase);
            setCurrentUrl(eventPayload.payload.currentUrl);
            setIssueLinks(eventPayload.payload.totalLinks);
            setUniqueLinks(eventPayload.payload.uniqueLinks);
            setCheckedLinks(eventPayload.payload.checkedLinks);
            setBrokenLinks(eventPayload.payload.brokenLinks);
            setBlockedLinks(eventPayload.payload.blockedLinks);
            setTimeoutLinks(eventPayload.payload.timeoutLinks);
            setScannedPages(eventPayload.payload.scannedPages);
            setDiscoveredPages(eventPayload.payload.discoveredPages);

            if (eventPayload.payload.newResults.length) {
              setGroupedResults((current) =>
                mergeGroupedResults(current, eventPayload.payload.newResults),
              );
            }
          }

          if (eventPayload.type === "complete") {
            setProgress(100);
            setPhase("Scan complete");
            setCurrentUrl(null);
            setGroupedResults(eventPayload.payload.groupedResults);
            setIssueLinks(eventPayload.payload.totalLinks);
            setUniqueLinks(eventPayload.payload.uniqueLinks);
            setCheckedLinks(eventPayload.payload.uniqueLinks);
            setBrokenLinks(eventPayload.payload.brokenLinks);
            setBlockedLinks(eventPayload.payload.blockedLinks);
            setTimeoutLinks(eventPayload.payload.timeoutLinks);
            setScannedPages(eventPayload.payload.scannedPages);
            setDiscoveredPages(eventPayload.payload.discoveredPages);
            setStartedAt(eventPayload.payload.startedAt);
            setFinishedAt(eventPayload.payload.finishedAt);
          }

          if (eventPayload.type === "error") {
            throw new Error(eventPayload.error);
          }
        }
      }
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "The scan could not be completed.");
      setPhase("Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const csv = buildCsv(filteredResults);
    await navigator.clipboard.writeText(csv);
    setCopied(true);
  };

  const handleDownload = () => {
    const csv = buildCsv(filteredResults);
    downloadCsv(csv, "broken-link-report.csv");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleScan} className="space-y-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <label className="block text-sm font-medium text-slate-700">
              Website URL
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Enter a website URL, e.g. https://example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-fit items-center justify-center gap-2 self-end rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "Scanning..." : "Scan Website - 100% Free"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              URL normalization removes trailing slashes, query strings, and duplicate variants.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              HEAD-first checking with GET fallback for blocked or unsupported responses.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              Shows only issue links: broken, blocked, and timeout, with grouped CSV export and no login.
            </div>
          </div>
        </div>
      </form>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Live scan progress</h2>
            <p className="mt-1 text-sm text-slate-600">{phase}</p>
          </div>
          <span className="text-sm font-semibold text-slate-600">{progress}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-950 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-950">Scanned pages:</span> {scannedPages}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-950">Discovered pages:</span> {discoveredPages}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-950">Unique links:</span> {uniqueLinks}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-950">Checked links:</span> {checkedLinks}
          </div>
        </div>
        {currentUrl ? (
          <p className="mt-4 break-all text-sm text-slate-500">Currently checking: {currentUrl}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Broken</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{brokenLinks}</p>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Crawler Blocked</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{blockedLinks}</p>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Timeout</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{timeoutLinks}</p>
        </article>

        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Issue Links</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{issueLinks}</p>
        </article>
      </div>

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Broken link report</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review grouped issue URLs only, filter by status, and export a duplicate-free CSV report.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All links"],
                ["broken", "Broken only"],
                ["blocked", "Crawler blocked only"],
                ["timeout", "Timeout only"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === value
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!filteredResults.length}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
                {copied ? "Copied" : "Copy results"}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!filteredResults.length}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">URL</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Occurrences</th>
                <th className="px-4 py-3 font-semibold">Source Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredResults.length ? (
                filteredResults.map((result) => {
                  const meta = CATEGORY_META[result.category];

                  return (
                    <tr key={result.url} className="align-top">
                      <td className="px-4 py-4">
                        <div className="min-w-[16rem]">
                          <p className="break-all font-medium text-slate-950">{result.url}</p>
                          {result.note ? (
                            <p className="mt-2 text-xs text-slate-500">{result.note}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${meta.badgeClass}`}>
                          <span aria-hidden="true">{meta.icon}</span>
                          {meta.label}
                        </span>
                        <p className="mt-2 text-sm text-slate-600">
                          {result.status === "timeout" ? "Timeout" : result.status}
                        </p>
                        {result.responseTime !== null ? (
                          <p className="mt-1 text-xs text-slate-500">{result.responseTime} ms</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                          {result.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{result.occurrences}</td>
                      <td className="px-4 py-4">
                        <details className="min-w-[14rem] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                            {result.sources.length} {result.sources.length === 1 ? "page" : "pages"}
                          </summary>
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            {result.sources.map((source) => (
                              <li key={source} className="break-all">
                                {source}
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    Start a scan to see grouped broken link results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p>
          {startedAt ? `Started ${new Date(startedAt).toLocaleTimeString()}` : "Not started yet"}
          {finishedAt ? ` · Finished ${new Date(finishedAt).toLocaleTimeString()}` : " · Live results update while the scan runs"}
        </p>
      </div>
    </div>
  );
}
