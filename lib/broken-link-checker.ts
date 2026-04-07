import { lookup } from "node:dns/promises";
import net from "node:net";

import axios, { type AxiosRequestConfig } from "axios";
import { load } from "cheerio";
import pLimit from "p-limit";
import isURL from "validator/lib/isURL";

const REQUEST_TIMEOUT_MS = 7_000;
const PAGE_CONCURRENCY = 5;
const LINK_CONCURRENCY = 10;
const BATCH_DELAY_MS = 100;
const MAX_DEPTH = 4;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const BLOCKED_STATUSES = new Set([401, 403, 429, 451, 999]);
const RESTRICTIVE_EXTERNAL_HOST_PATTERNS = [
  /(^|\.)facebook\.com$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)linkedin\.com$/i,
  /(^|\.)tiktok\.com$/i,
  /(^|\.)x\.com$/i,
  /(^|\.)twitter\.com$/i,
];

type LinkCategory = "valid" | "redirect" | "blocked" | "timeout" | "broken";

type LinkType = "internal" | "external";

export type GroupedLinkResult = {
  url: string;
  status: number | "timeout";
  type: LinkType;
  occurrences: number;
  sources: string[];
  category: LinkCategory;
  responseTime: number | null;
  finalUrl: string | null;
  redirectChain: string[];
  note: string | null;
};

export type BrokenLinkScanResponse = {
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

export type BrokenLinkScanProgress = {
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

type PageQueueItem = {
  url: string;
  key: string;
  depth: number;
};

type LinkAggregate = {
  url: string;
  type: LinkType;
  occurrences: number;
  sources: Set<string>;
};

type RequestProbe = {
  finalUrl: string | null;
  redirectChain: string[];
  responseTime: number | null;
  note: string | null;
  timedOut: boolean;
  firstRedirectStatus: number | null;
  finalStatus: number | null;
};

type ScanOptions = {
  onProgress?: (progress: BrokenLinkScanProgress) => void | Promise<void>;
};

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getComparableHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function buildRequestUrl(url: URL) {
  const normalized = new URL(url.toString());
  normalized.hash = "";
  normalized.protocol = normalized.protocol.toLowerCase();
  normalized.hostname = normalized.hostname.toLowerCase();

  if (
    (normalized.protocol === "https:" && normalized.port === "443") ||
    (normalized.protocol === "http:" && normalized.port === "80")
  ) {
    normalized.port = "";
  }

  normalized.pathname = (normalized.pathname || "/").replace(/\/{2,}/g, "/");

  return normalized.toString();
}

function buildComparisonKey(url: URL) {
  const protocol = url.protocol.toLowerCase();
  const hostname = url.hostname.toLowerCase();
  const port =
    url.port &&
    !(
      (protocol === "https:" && url.port === "443") ||
      (protocol === "http:" && url.port === "80")
    )
      ? `:${url.port}`
      : "";

  let pathname = (url.pathname || "/").replace(/\/{2,}/g, "/");

  if (pathname !== "/") {
    pathname = pathname.replace(/\/+$/, "");
  }

  if (pathname === "/") {
    pathname = "";
  }

  return `${protocol}//${hostname}${port}${pathname}`;
}

function normalizeUrlString(value: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return buildRequestUrl(url);
  } catch {
    return null;
  }
}

function normalizeComparableUrl(value: string) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return buildComparisonKey(url);
  } catch {
    return null;
  }
}

function normalizeInputUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  if (
    !isURL(candidate, {
      protocols: ["http", "https"],
      require_protocol: true,
      require_valid_protocol: true,
      allow_query_components: true,
      allow_fragments: true,
    })
  ) {
    return null;
  }

  return normalizeUrlString(candidate);
}

function normalizeDiscoveredUrl(candidate: string, baseUrl: string) {
  try {
    const url = new URL(candidate, baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return normalizeUrlString(url.toString());
  } catch {
    return null;
  }
}

function isPrivateIpAddress(address: string) {
  if (net.isIP(address) === 4) {
    const octets = address.split(".").map((part) => Number.parseInt(part, 10));
    const [first, second] = octets;

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first === 169 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  const normalized = address.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

async function assertPublicHost(targetUrl: URL, hostSafetyCache: Map<string, boolean>) {
  const hostname = targetUrl.hostname.toLowerCase();

  if (hostSafetyCache.has(hostname)) {
    if (!hostSafetyCache.get(hostname)) {
      throw new Error(`Blocked private or local host: ${hostname}`);
    }

    return;
  }

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    hostSafetyCache.set(hostname, false);
    throw new Error(`Blocked private or local host: ${hostname}`);
  }

  if (net.isIP(hostname) && isPrivateIpAddress(hostname)) {
    hostSafetyCache.set(hostname, false);
    throw new Error(`Blocked private or local host: ${hostname}`);
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });

    if (addresses.some((entry) => isPrivateIpAddress(entry.address))) {
      hostSafetyCache.set(hostname, false);
      throw new Error(`Blocked private or local host: ${hostname}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Blocked private")) {
      throw error;
    }
  }

  hostSafetyCache.set(hostname, true);
}

function isLikelyHtmlPage(targetUrl: URL) {
  const pathname = targetUrl.pathname.toLowerCase();

  if (!pathname || pathname.endsWith("/")) {
    return true;
  }

  return !/\.(?:pdf|jpe?g|png|webp|gif|svg|zip|rar|7z|docx?|xlsx?|pptx?|xml|json|txt|csv|mp4|mp3|avi|mov|webm|ico)$/i.test(
    pathname,
  );
}

function isHtmlResponse(contentType: string | undefined) {
  return contentType?.toLowerCase().includes("text/html") ?? false;
}

function getFinalResponseUrl(response: { request?: { res?: { responseUrl?: string } } }, fallbackUrl: string) {
  return response.request?.res?.responseUrl || fallbackUrl;
}

function isRestrictiveExternalHost(value: string | null) {
  if (!value) {
    return false;
  }

  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return RESTRICTIVE_EXTERNAL_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

async function fetchPageHtml(url: string) {
  const response = await axios.get<string>(url, {
    timeout: REQUEST_TIMEOUT_MS,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });

  return {
    status: response.status,
    finalUrl: normalizeUrlString(getFinalResponseUrl(response, url)) ?? url,
    contentType: response.headers["content-type"],
    html: typeof response.data === "string" ? response.data : "",
  };
}

function extractAnchorLinks(html: string, pageUrl: string) {
  const $ = load(html);
  const links: string[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    const normalized = normalizeDiscoveredUrl(href, pageUrl);

    if (!normalized) {
      return;
    }

    links.push(normalized);
  });

  return links;
}

function createRequestConfig(url: string, method: "head" | "get"): AxiosRequestConfig {
  return {
    url,
    method,
    timeout: REQUEST_TIMEOUT_MS,
    maxRedirects: 0,
    validateStatus: () => true,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: method === "head" ? "*/*" : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    responseType: method === "get" ? "stream" : "text",
  };
}

async function performRequest(
  method: "head" | "get",
  url: string,
  hostSafetyCache: Map<string, boolean>,
): Promise<RequestProbe> {
  const started = Date.now();
  const redirectChain: string[] = [];
  let currentUrl = url;
  let firstRedirectStatus: number | null = null;
  const seenRedirectTargets = new Set<string>([currentUrl]);

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await assertPublicHost(new URL(currentUrl), hostSafetyCache);
    } catch (error) {
      return {
        finalUrl: null,
        redirectChain,
        responseTime: Date.now() - started,
        note: error instanceof Error ? error.message : "Blocked private or local host.",
        timedOut: false,
        firstRedirectStatus,
        finalStatus: null,
      };
    }

    try {
      const response = await axios.request(createRequestConfig(currentUrl, method));
      const responseTime = Date.now() - started;
      const responseStatus = response.status;
      const stream = response.data as { destroy?: () => void } | undefined;
      stream?.destroy?.();

      if (
        REDIRECT_STATUSES.has(responseStatus) &&
        typeof response.headers.location === "string" &&
        response.headers.location
      ) {
        if (firstRedirectStatus === null) {
          firstRedirectStatus = responseStatus;
        }

        const nextUrl = normalizeDiscoveredUrl(response.headers.location, currentUrl);

        if (!nextUrl) {
          return {
            finalUrl: normalizeUrlString(currentUrl) ?? currentUrl,
            redirectChain,
            responseTime,
            note: "Redirect location could not be normalized.",
            timedOut: false,
            firstRedirectStatus,
            finalStatus: responseStatus,
          };
        }

        if (seenRedirectTargets.has(nextUrl)) {
          return {
            finalUrl: nextUrl,
            redirectChain,
            responseTime,
            note: "Redirect loop detected.",
            timedOut: false,
            firstRedirectStatus,
            finalStatus: responseStatus,
          };
        }

        redirectChain.push(nextUrl);
        seenRedirectTargets.add(nextUrl);
        currentUrl = nextUrl;
        continue;
      }

      return {
        finalUrl: normalizeUrlString(currentUrl) ?? currentUrl,
        redirectChain,
        responseTime,
        note: null,
        timedOut: false,
        firstRedirectStatus,
        finalStatus: responseStatus,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
        return {
          finalUrl: null,
          redirectChain,
          responseTime: Date.now() - started,
          note: `Request timed out after ${REQUEST_TIMEOUT_MS} ms.`,
          timedOut: true,
          firstRedirectStatus,
          finalStatus: null,
        };
      }

      return {
        finalUrl: null,
        redirectChain,
        responseTime: Date.now() - started,
        note: axios.isAxiosError(error) ? error.message : "Request failed.",
        timedOut: false,
        firstRedirectStatus,
        finalStatus: null,
      };
    }
  }

  return {
    finalUrl: normalizeUrlString(currentUrl) ?? currentUrl,
    redirectChain,
    responseTime: Date.now() - started,
    note: "Too many redirects.",
    timedOut: false,
    firstRedirectStatus,
    finalStatus: firstRedirectStatus ?? 302,
  };
}

function shouldFallbackToGet(probe: RequestProbe) {
  return probe.finalStatus === null || probe.finalStatus >= 400;
}

function getCategory(probe: RequestProbe, type: LinkType): LinkCategory {
  if (probe.timedOut) {
    return "timeout";
  }

  if (probe.finalStatus === null) {
    return "broken";
  }

  if (BLOCKED_STATUSES.has(probe.finalStatus)) {
    return "blocked";
  }

  if (
    type === "external" &&
    probe.finalStatus === 400 &&
    isRestrictiveExternalHost(probe.finalUrl ?? probe.redirectChain.at(-1) ?? null)
  ) {
    return "blocked";
  }

  if (probe.finalStatus === 404 || probe.finalStatus === 410 || probe.finalStatus >= 500) {
    return "broken";
  }

  if (probe.firstRedirectStatus !== null || probe.redirectChain.length > 0) {
    return "redirect";
  }

  if (probe.finalStatus >= 200 && probe.finalStatus < 300) {
    return "valid";
  }

  if (probe.finalStatus >= 300 && probe.finalStatus < 400) {
    return "redirect";
  }

  return "broken";
}

function getDisplayStatus(probe: RequestProbe, category: LinkCategory): number | "timeout" {
  if (category === "timeout") {
    return "timeout";
  }

  if (category === "redirect") {
    return probe.firstRedirectStatus ?? probe.finalStatus ?? 302;
  }

  return probe.finalStatus ?? 0;
}

async function checkLink(
  aggregate: LinkAggregate,
  hostSafetyCache: Map<string, boolean>,
): Promise<GroupedLinkResult> {
  const headProbe = await performRequest("head", aggregate.url, hostSafetyCache);
  const probe = shouldFallbackToGet(headProbe)
    ? await performRequest("get", aggregate.url, hostSafetyCache)
    : headProbe;
  const category = getCategory(probe, aggregate.type);

  return {
    url: aggregate.url,
    status: getDisplayStatus(probe, category),
    type: aggregate.type,
    occurrences: aggregate.occurrences,
    sources: Array.from(aggregate.sources).sort(),
    category,
    responseTime: probe.responseTime,
    finalUrl: probe.finalUrl,
    redirectChain: probe.redirectChain,
    note: probe.note,
  };
}

function sortResults(left: GroupedLinkResult, right: GroupedLinkResult) {
  const categoryRank: Record<LinkCategory, number> = {
    broken: 0,
    timeout: 1,
    blocked: 2,
    redirect: 3,
    valid: 4,
  };

  if (categoryRank[left.category] !== categoryRank[right.category]) {
    return categoryRank[left.category] - categoryRank[right.category];
  }

  if (left.type !== right.type) {
    return left.type === "internal" ? -1 : 1;
  }

  if (left.occurrences !== right.occurrences) {
    return right.occurrences - left.occurrences;
  }

  return left.url.localeCompare(right.url);
}

async function emitProgress(options: ScanOptions, progress: BrokenLinkScanProgress) {
  await options.onProgress?.(progress);
}

function isIssueCategory(category: LinkCategory) {
  return category === "broken" || category === "blocked" || category === "timeout";
}

export async function runBrokenLinkScan(
  inputUrl: string,
  options: ScanOptions = {},
): Promise<BrokenLinkScanResponse> {
  const normalizedUrl = normalizeInputUrl(inputUrl);

  if (!normalizedUrl) {
    throw new Error("Enter a valid website URL to scan.");
  }

  const rootUrl = new URL(normalizedUrl);
  const rootOrigin = normalizeUrlString(rootUrl.origin) ?? rootUrl.origin;
  const rootComparableHost = getComparableHostname(rootUrl.hostname);
  const hostSafetyCache = new Map<string, boolean>();
  const startedAt = new Date().toISOString();
  const rootPageKey = normalizeComparableUrl(normalizedUrl) ?? normalizedUrl;

  await assertPublicHost(rootUrl, hostSafetyCache);

  const seenPages = new Set<string>([rootPageKey]);
  const pageQueue: PageQueueItem[] = [{ url: normalizedUrl, key: rootPageKey, depth: 0 }];
  const linkAggregates = new Map<string, LinkAggregate>();
  const pageLimiter = pLimit(PAGE_CONCURRENCY);
  let scannedPages = 0;
  let discoveredPages = 1;

  await emitProgress(options, {
    progress: 5,
    phase: "Preparing crawl",
    currentUrl: normalizedUrl,
    totalLinks: 0,
    uniqueLinks: 0,
    checkedLinks: 0,
    brokenLinks: 0,
    blockedLinks: 0,
    timeoutLinks: 0,
    scannedPages,
    discoveredPages,
    newResults: [],
  });

  while (pageQueue.length) {
    const batch = pageQueue.splice(0, PAGE_CONCURRENCY);

    await Promise.all(
      batch.map((page) =>
        pageLimiter(async () => {
          try {
            const response = await fetchPageHtml(page.url);
            const finalPageUrl = response.finalUrl;
            const finalPage = new URL(finalPageUrl);
            const normalizedFinalPageUrl = normalizeUrlString(finalPageUrl) ?? page.url;
            const normalizedFinalPageKey = normalizeComparableUrl(finalPageUrl) ?? page.key;

            scannedPages += 1;
            seenPages.add(normalizedFinalPageKey);

            if (response.status >= 400) {
              return;
            }

            if (getComparableHostname(finalPage.hostname) !== rootComparableHost) {
              return;
            }

            if (!isHtmlResponse(response.contentType)) {
              return;
            }

            const anchorLinks = extractAnchorLinks(response.html, finalPageUrl);

            anchorLinks.forEach((linkUrl) => {
              const link = new URL(linkUrl);
              const type: LinkType =
                getComparableHostname(link.hostname) === rootComparableHost ? "internal" : "external";
              const comparisonKey = normalizeComparableUrl(linkUrl) ?? linkUrl;
              const aggregate =
                linkAggregates.get(comparisonKey) ??
                {
                  url: linkUrl,
                  type,
                  occurrences: 0,
                  sources: new Set<string>(),
                };

              aggregate.occurrences += 1;
              aggregate.sources.add(normalizedFinalPageUrl);
              linkAggregates.set(comparisonKey, aggregate);

              if (
                type === "internal" &&
                page.depth < MAX_DEPTH &&
                isLikelyHtmlPage(link) &&
                !seenPages.has(comparisonKey)
              ) {
                seenPages.add(comparisonKey);
                pageQueue.push({ url: linkUrl, key: comparisonKey, depth: page.depth + 1 });
                discoveredPages += 1;
              }
            });
          } catch (error) {
            scannedPages += 1;
            void error;
          }
        }),
      ),
    );

    await emitProgress(options, {
      progress: Math.min(55, Math.round((scannedPages / Math.max(discoveredPages, 1)) * 55)),
      phase: `Crawled ${scannedPages} of ${discoveredPages} discovered pages`,
      currentUrl: batch[batch.length - 1]?.url ?? null,
      totalLinks: 0,
      uniqueLinks: linkAggregates.size,
      checkedLinks: 0,
      brokenLinks: 0,
      blockedLinks: 0,
      timeoutLinks: 0,
      scannedPages,
      discoveredPages,
      newResults: [],
    });

    if (pageQueue.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  const uniqueLinks = Array.from(linkAggregates.values());
  const groupedResults: GroupedLinkResult[] = [];
  let brokenLinks = 0;
  let blockedLinks = 0;
  let timeoutLinks = 0;

  for (let index = 0; index < uniqueLinks.length; index += LINK_CONCURRENCY) {
    const batch = uniqueLinks.slice(index, index + LINK_CONCURRENCY);
    const checkedBatch = await Promise.all(
      batch.map((aggregate) => checkLink(aggregate, hostSafetyCache)),
    );
    const issueBatch = checkedBatch.filter((result) => isIssueCategory(result.category));

    issueBatch.forEach((result) => {
      if (result.category === "broken") {
        brokenLinks += 1;
      } else if (result.category === "blocked") {
        blockedLinks += 1;
      } else if (result.category === "timeout") {
        timeoutLinks += 1;
      }
    });

    groupedResults.push(...issueBatch);

    await emitProgress(options, {
      progress: Math.min(95, 55 + Math.round(((index + batch.length) / Math.max(uniqueLinks.length, 1)) * 40)),
      phase: `Checked ${Math.min(index + batch.length, uniqueLinks.length)} of ${uniqueLinks.length} unique links`,
      currentUrl: batch[batch.length - 1]?.url ?? null,
      totalLinks: groupedResults.length,
      uniqueLinks: uniqueLinks.length,
      checkedLinks: Math.min(index + batch.length, uniqueLinks.length),
      brokenLinks,
      blockedLinks,
      timeoutLinks,
      scannedPages,
      discoveredPages,
      newResults: issueBatch.sort(sortResults),
    });

    if (index + LINK_CONCURRENCY < uniqueLinks.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  const finishedAt = new Date().toISOString();

  return {
    url: rootOrigin,
    totalLinks: groupedResults.length,
    uniqueLinks: uniqueLinks.length,
    brokenLinks,
    blockedLinks,
    timeoutLinks,
    scannedPages,
    discoveredPages,
    groupedResults: groupedResults.sort(sortResults),
    maxDepth: MAX_DEPTH,
    startedAt,
    finishedAt,
  };
}
