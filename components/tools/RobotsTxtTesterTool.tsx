"use client";

import { useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type ResourceCheck = {
  url: string;
  type: string;
  host: string;
  robotsUrl: string;
  allowed: boolean | null;
  matchedRule: string | null;
  note: string | null;
};

type TesterResponse = {
  testedUrl: string;
  userAgent: string;
  targetPath: string;
  source: {
    url: string;
    statusCode: number | null;
    statusText: string;
    mode: "live" | "custom";
    fetched: boolean;
  };
  allowed: boolean | null;
  matchedRule: string | null;
  matchedLine: number | null;
  selectedGroups: string[][];
  sitemaps: string[];
  warnings: string[];
  rawRobotsTxt: string;
  resources: ResourceCheck[];
};

const userAgents = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Google-InspectionTool",
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "PerplexityBot",
  "Applebot",
  "AhrefsBot",
  "SemrushBot",
  "facebookexternalhit",
  "*",
];

export default function RobotsTxtTesterTool() {
  const [url, setUrl] = useState("");
  const [userAgent, setUserAgent] = useState("Googlebot");
  const [checkResources, setCheckResources] = useState(true);
  const [useCustomRules, setUseCustomRules] = useState(false);
  const [customRobotsTxt, setCustomRobotsTxt] = useState("User-agent: *\nAllow: /\n");
  const [result, setResult] = useState<TesterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/seo/robots-txt-tester", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url,
          userAgent,
          checkResources,
          customRobotsTxt: useCustomRules ? customRobotsTxt : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The robots.txt test failed.");
      }

      setResult(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The robots.txt test failed.",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_18rem_18rem]">
            <label className="block text-sm font-medium text-slate-700">
              URL to test
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Enter a URL to test, e.g. https://example.com/path"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              User-agent
              <select
                value={userAgent}
                onChange={(event) => setUserAgent(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900"
              >
                {userAgents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col justify-end gap-3 sm:flex-row lg:flex-col lg:gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checkResources}
                  onChange={(event) => setCheckResources(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Check page resources
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={useCustomRules}
                  onChange={(event) => setUseCustomRules(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Live editor
              </label>
            </div>
          </div>

          {useCustomRules ? (
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Custom robots.txt rules
              <textarea
                value={customRobotsTxt}
                onChange={(event) => setCustomRobotsTxt(event.target.value)}
                rows={8}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
              />
            </label>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Test live robots.txt rules or paste a draft robots.txt file to see whether a specific bot can crawl a URL and its resources.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              {loading ? "Testing..." : "Test robots.txt"}
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${result.allowed === false ? "bg-rose-50 text-rose-700" : result.allowed === true ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {result.allowed === false ? <XCircle className="h-5 w-5" aria-hidden="true" /> : result.allowed === true ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : <ShieldAlert className="h-5 w-5" aria-hidden="true" />}
              </span>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Crawl result</h3>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {result.allowed === true ? "Allowed" : result.allowed === false ? "Blocked" : "Unavailable"}
              </p>
              <p className="mt-2 text-sm text-slate-600">{result.targetPath}</p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">User-agent</h3>
              <p className="mt-2 text-xl font-semibold text-slate-950">{result.userAgent}</p>
              <p className="mt-2 text-sm text-slate-600">
                {result.selectedGroups.length ? `${result.selectedGroups.length} matching group${result.selectedGroups.length > 1 ? "s" : ""}` : "No explicit group matched"}
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Matched rule</h3>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {result.matchedRule ?? "No matching allow/disallow rule"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {result.matchedLine ? `Line ${result.matchedLine}` : "Default allow"}
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Search className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Robots source</h3>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {result.source.mode === "custom" ? "Live editor" : result.source.statusCode ?? "N/A"}
              </p>
              <p className="mt-2 text-sm text-slate-600">{result.source.statusText}</p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,22rem)]">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Robots.txt details</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Tested URL:</span> {result.testedUrl}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Robots URL:</span> {result.source.url}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Matched groups:</span>{" "}
                  {result.selectedGroups.length
                    ? result.selectedGroups.map((group) => group.join(", ")).join(" | ")
                    : "No matching group"}
                </p>
              </div>

              {result.warnings.length ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold text-amber-900">Parser warnings</p>
                  <ul className="mt-2 space-y-1">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-950">View robots.txt content</summary>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  {result.rawRobotsTxt || "No robots.txt content found."}
                </pre>
              </details>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Sitemaps</h2>
              {result.sitemaps.length ? (
                <div className="mt-4 space-y-3">
                  {result.sitemaps.map((sitemap) => (
                    <a
                      key={sitemap}
                      href={sitemap}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
                    >
                      {sitemap}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">No sitemap lines were found in the tested robots.txt content.</p>
              )}
            </section>
          </div>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">Resource checks</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {result.resources.length
                    ? "Linked page resources checked against their robots.txt rules."
                    : "Resource checks were not requested or no supported resources were found."}
                </p>
              </div>
            </div>

            {result.resources.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">Resource</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Host</th>
                      <th className="px-3 py-3 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {result.resources.map((resource) => (
                      <tr key={resource.url}>
                        <td className="px-3 py-3 align-top text-slate-700">
                          <div className="max-w-[28rem] break-words font-medium text-slate-900">{resource.url}</div>
                          <div className="mt-1 text-xs text-slate-500">{resource.robotsUrl}</div>
                        </td>
                        <td className="px-3 py-3 align-top text-slate-600">{resource.type}</td>
                        <td className="px-3 py-3 align-top text-slate-600">{resource.host}</td>
                        <td className="px-3 py-3 align-top text-slate-600">
                          <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${resource.allowed === true ? "bg-emerald-50 text-emerald-700" : resource.allowed === false ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                            {resource.allowed === true ? "Allowed" : resource.allowed === false ? "Blocked" : "Skipped / unknown"}
                          </div>
                          {resource.matchedRule ? <p className="mt-2 text-xs text-slate-500">{resource.matchedRule}</p> : null}
                          {resource.note ? <p className="mt-2 text-xs text-slate-500">{resource.note}</p> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
