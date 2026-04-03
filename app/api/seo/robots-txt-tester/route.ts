import { load } from "cheerio";
import { NextResponse } from "next/server";

import {
  evaluateRobots,
  parseRobotsTxt,
  pathWithQuery,
  type ParsedRobotsTxt,
  type RobotsEvaluation,
} from "@/lib/robots-txt";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RobotsSource = {
  url: string;
  statusCode: number | null;
  statusText: string;
  mode: "live" | "custom";
  fetched: boolean;
};

type ResourceCheck = {
  url: string;
  type: string;
  host: string;
  robotsUrl: string;
  allowed: boolean | null;
  matchedRule: string | null;
  note: string | null;
};

type RobotsResponse = {
  testedUrl: string;
  userAgent: string;
  targetPath: string;
  source: RobotsSource;
  allowed: boolean | null;
  matchedRule: string | null;
  matchedLine: number | null;
  selectedGroups: string[][];
  sitemaps: string[];
  warnings: string[];
  rawRobotsTxt: string;
  resources: ResourceCheck[];
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isFetchableUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

async function fetchText(url: string, userAgent?: string) {
  const response = await fetch(url, {
    headers: userAgent ? { "user-agent": userAgent } : undefined,
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  return {
    response,
    text: await response.text(),
  };
}

function extractResourceUrls(html: string, pageUrl: string) {
  const $ = load(html);
  const resources = new Map<string, { type: string; host: string; robotsUrl: string }>();

  const addResource = (candidate: string | undefined, type: string) => {
    if (!candidate) {
      return;
    }

    try {
      const resolved = new URL(candidate, pageUrl);

      if (!["http:", "https:"].includes(resolved.protocol)) {
        return;
      }

      const value = resolved.toString();

      if (!resources.has(value)) {
        resources.set(value, {
          type,
          host: resolved.host,
          robotsUrl: new URL("/robots.txt", resolved.origin).toString(),
        });
      }
    } catch {
      // Ignore malformed resource URLs.
    }
  };

  $("link[href]").each((_, element) => {
    const rel = ($(element).attr("rel") || "").toLowerCase();

    if (rel.includes("stylesheet") || rel.includes("preload") || rel.includes("icon")) {
      addResource($(element).attr("href"), "link");
    }
  });

  $("script[src]").each((_, element) => addResource($(element).attr("src"), "script"));
  $("img[src]").each((_, element) => addResource($(element).attr("src"), "image"));
  $("source[src]").each((_, element) => addResource($(element).attr("src"), "source"));
  $("video[poster]").each((_, element) => addResource($(element).attr("poster"), "poster"));

  $("img[srcset], source[srcset]").each((_, element) => {
    const srcset = $(element).attr("srcset") || "";
    srcset
      .split(",")
      .map((entry) => entry.trim().split(/\s+/)[0])
      .filter(Boolean)
      .forEach((entry) => addResource(entry, "srcset"));
  });

  return Array.from(resources.entries()).slice(0, 40).map(([url, details]) => ({
    url,
    ...details,
  }));
}

async function getRobotsForOrigin(origin: string, userAgent: string, cache: Map<string, { parsed: ParsedRobotsTxt | null; source: RobotsSource }>) {
  if (cache.has(origin)) {
    return cache.get(origin)!;
  }

  const robotsUrl = new URL("/robots.txt", origin).toString();

  try {
    const { response, text } = await fetchText(robotsUrl, userAgent);

    if (response.status === 404 || response.status === 410) {
      const result = {
        parsed: parseRobotsTxt(""),
        source: {
          url: robotsUrl,
          statusCode: response.status,
          statusText: "No robots.txt file found",
          mode: "live" as const,
          fetched: true,
        },
      };
      cache.set(origin, result);
      return result;
    }

    if (!response.ok) {
      const result = {
        parsed: null,
        source: {
          url: robotsUrl,
          statusCode: response.status,
          statusText: response.statusText || "Could not fetch robots.txt",
          mode: "live" as const,
          fetched: true,
        },
      };
      cache.set(origin, result);
      return result;
    }

    const result = {
      parsed: parseRobotsTxt(text),
      source: {
        url: robotsUrl,
        statusCode: response.status,
        statusText: response.statusText || "OK",
        mode: "live" as const,
        fetched: true,
      },
    };
    cache.set(origin, result);
    return result;
  } catch {
    const result = {
      parsed: null,
      source: {
        url: robotsUrl,
        statusCode: null,
        statusText: "Request failed or timed out",
        mode: "live" as const,
        fetched: false,
      },
    };
    cache.set(origin, result);
    return result;
  }
}

async function collectResourceChecks(
  targetUrl: URL,
  userAgent: string,
  checkResources: boolean,
  customRobotsTxt: string | undefined,
) {
  if (!checkResources) {
    return [] satisfies ResourceCheck[];
  }

  try {
    const { text } = await fetchText(targetUrl.toString(), userAgent);
    const resources = extractResourceUrls(text, targetUrl.toString());
    const robotsCache = new Map<string, { parsed: ParsedRobotsTxt | null; source: RobotsSource }>();
    const customParsed = customRobotsTxt?.trim() ? parseRobotsTxt(customRobotsTxt) : null;

    return Promise.all(
      resources.map(async (resource) => {
        if (customParsed && new URL(resource.url).origin !== targetUrl.origin) {
          return {
            ...resource,
            allowed: null,
            matchedRule: null,
            note: "External host skipped while testing custom robots.txt rules.",
          } satisfies ResourceCheck;
        }

        const robots = customParsed
          ? {
              parsed: customParsed,
              source: {
                url: new URL("/robots.txt", targetUrl.origin).toString(),
                statusCode: 200,
                statusText: "Custom rules",
                mode: "custom" as const,
                fetched: true,
              },
            }
          : await getRobotsForOrigin(new URL(resource.url).origin, userAgent, robotsCache);

        if (!robots.parsed) {
          return {
            ...resource,
            allowed: null,
            matchedRule: null,
            note: robots.source.statusText,
          } satisfies ResourceCheck;
        }

        const evaluation = evaluateRobots(
          robots.parsed,
          pathWithQuery(new URL(resource.url)),
          userAgent,
        );

        return {
          ...resource,
          allowed: evaluation.allowed,
          matchedRule: evaluation.matchedRule ? evaluation.matchedRule.raw : null,
          note: null,
        } satisfies ResourceCheck;
      }),
    );
  } catch {
    return [
      {
        url: targetUrl.toString(),
        type: "page",
        host: targetUrl.host,
        robotsUrl: new URL("/robots.txt", targetUrl.origin).toString(),
        allowed: null,
        matchedRule: null,
        note: "Could not fetch the page HTML to inspect linked resources.",
      },
    ] satisfies ResourceCheck[];
  }
}

export async function POST(request: Request) {
  let body: {
    url?: string;
    userAgent?: string;
    customRobotsTxt?: string;
    checkResources?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.");
  }

  if (!body.url?.trim()) {
    return jsonError("Enter a URL to test.");
  }

  if (!isFetchableUrl(body.url.trim())) {
    return jsonError("Please enter a full URL including http:// or https://.");
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(body.url.trim());
  } catch {
    return jsonError("Please enter a valid URL.");
  }

  const userAgent = body.userAgent?.trim() || "Googlebot";
  const targetPath = pathWithQuery(targetUrl);
  const usingCustomRules = Boolean(body.customRobotsTxt?.trim());

  let parsed: ParsedRobotsTxt | null = null;
  let evaluation: RobotsEvaluation | null = null;
  let source: RobotsSource;

  if (usingCustomRules) {
    parsed = parseRobotsTxt(body.customRobotsTxt!.trim());
    evaluation = evaluateRobots(parsed, targetPath, userAgent);
    source = {
      url: new URL("/robots.txt", targetUrl.origin).toString(),
      statusCode: 200,
      statusText: "Using custom robots.txt rules",
      mode: "custom",
      fetched: true,
    };
  } else {
    const liveRobots = await getRobotsForOrigin(targetUrl.origin, userAgent, new Map());
    parsed = liveRobots.parsed;
    source = liveRobots.source;

    if (parsed) {
      evaluation = evaluateRobots(parsed, targetPath, userAgent);
    }
  }

  const resources = await collectResourceChecks(
    targetUrl,
    userAgent,
    Boolean(body.checkResources),
    body.customRobotsTxt,
  );

  const response: RobotsResponse = {
    testedUrl: targetUrl.toString(),
    userAgent,
    targetPath,
    source,
    allowed: evaluation?.allowed ?? null,
    matchedRule: evaluation?.matchedRule?.raw ?? null,
    matchedLine: evaluation?.matchedRule?.line ?? null,
    selectedGroups: evaluation?.selectedGroups.map((group) => group.userAgents) ?? [],
    sitemaps: parsed?.sitemaps ?? [],
    warnings: parsed?.warnings ?? [],
    rawRobotsTxt: parsed?.raw ?? "",
    resources,
  };

  return NextResponse.json(response);
}
