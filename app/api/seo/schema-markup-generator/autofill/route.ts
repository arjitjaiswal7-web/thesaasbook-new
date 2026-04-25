import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

import {
  createDefaultSchemaState,
  type SchemaFieldValues,
  type SchemaType,
} from "@/lib/schema-markup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const REQUEST_TIMEOUT_MS = 7000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type AutofillResponse = {
  sourceUrl: string;
  fields: SchemaFieldValues;
  warnings: string[];
  mode: "existing-schema" | "metadata";
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeCandidateUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return null;
  }

  if (!parsedUrl.hostname || !parsedUrl.hostname.includes(".")) {
    return null;
  }

  parsedUrl.hash = "";

  return parsedUrl;
}

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map((part) => Number(part));

  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized === "0.0.0.0"
  );
}

async function assertPublicUrl(url: URL) {
  if (isBlockedHostname(url.hostname)) {
    throw new Error("Local or private hosts are not allowed.");
  }

  const ipVersion = isIP(url.hostname);

  if (
    (ipVersion === 4 && isPrivateIpv4(url.hostname)) ||
    (ipVersion === 6 && isPrivateIpv6(url.hostname))
  ) {
    throw new Error("Private network addresses are not allowed.");
  }

  if (ipVersion !== 0) {
    return;
  }

  const records = await lookup(url.hostname, { all: true });

  if (!records.length) {
    throw new Error("The target URL could not be resolved.");
  }

  for (const record of records) {
    if (
      (record.family === 4 && isPrivateIpv4(record.address)) ||
      (record.family === 6 && isPrivateIpv6(record.address))
    ) {
      throw new Error("The target URL resolves to a private network address.");
    }
  }
}

function toAbsoluteUrl(candidate: string | undefined, baseUrl: string) {
  const value = candidate?.trim();

  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function getMetaContent($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).attr("content")?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp)
    ? ""
    : new Date(timestamp).toISOString().slice(0, 10);
}

function flattenJsonLd(value: unknown, bucket: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      flattenJsonLd(entry, bucket);
    }

    return bucket;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (record["@type"]) {
      bucket.push(record);
    }

    if (record["@graph"]) {
      flattenJsonLd(record["@graph"], bucket);
    }
  }

  return bucket;
}

function parseJsonLdBlocks($: cheerio.CheerioAPI) {
  const bucket: Record<string, unknown>[] = [];

  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).html()?.trim();

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      flattenJsonLd(parsed, bucket);
    } catch {
      // Ignore invalid JSON-LD blocks so one bad script does not kill autofill.
    }
  });

  return bucket;
}

function getTypeNames(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).toLowerCase());
  }

  if (typeof value === "string") {
    return [value.toLowerCase()];
  }

  return [];
}

function matchesSchemaType(candidate: Record<string, unknown>, schemaType: SchemaType) {
  const typeNames = getTypeNames(candidate["@type"]);

  switch (schemaType) {
    case "article":
      return typeNames.some((type) =>
        ["article", "blogposting", "newsarticle", "analysisnewsarticle"].includes(type),
      );
    case "faq-page":
      return typeNames.includes("faqpage");
    case "organization":
      return typeNames.some((type) => ["organization", "corporation", "brand"].includes(type));
    case "website":
      return typeNames.includes("website");
    case "product":
      return typeNames.includes("product");
    case "local-business":
      return typeNames.some(
        (type) =>
          type === "localbusiness" ||
          [
            "store",
            "restaurant",
            "school",
            "medicalbusiness",
            "realestateagent",
            "travelagency",
            "automotivebusiness",
          ].includes(type),
      );
    case "breadcrumb-list":
      return typeNames.includes("breadcrumblist");
  }
}

function findSchemaNode(
  nodes: Record<string, unknown>[],
  schemaType: SchemaType,
) {
  return nodes.find((node) => matchesSchemaType(node, schemaType)) ?? null;
}

function pickString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return pickString(value[0]);
  }

  return "";
}

function pickEntityName(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return pickEntityName(value[0]);
  }

  if (value && typeof value === "object") {
    return pickString((value as Record<string, unknown>).name);
  }

  return "";
}

function pickEntityUrl(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return pickEntityUrl(value[0]);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return pickString(record.url ?? record["@id"]);
  }

  return "";
}

function pickImageUrl(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return pickImageUrl(value[0]);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return pickString(record.url ?? record.contentUrl ?? record["@id"]);
  }

  return "";
}

function pickOfferValue(value: unknown, key: string) {
  if (Array.isArray(value)) {
    return pickOfferValue(value[0], key);
  }

  if (value && typeof value === "object") {
    return pickString((value as Record<string, unknown>)[key]);
  }

  return "";
}

function getPageMetadata($: cheerio.CheerioAPI, url: URL) {
  const title =
    getMetaContent($, ["meta[property='og:title']", "meta[name='twitter:title']"]) ||
    $("h1").first().text().trim() ||
    $("title").text().trim();

  const description =
    getMetaContent($, [
      "meta[name='description']",
      "meta[property='og:description']",
      "meta[name='twitter:description']",
    ]) || "";

  const canonical =
    toAbsoluteUrl($("link[rel='canonical']").attr("href"), url.toString()) ||
    url.toString();

  const image = toAbsoluteUrl(
    getMetaContent($, [
      "meta[property='og:image']",
      "meta[name='twitter:image']",
      "meta[itemprop='image']",
    ]),
    url.toString(),
  );

  const icon = toAbsoluteUrl(
    $("link[rel='apple-touch-icon']").attr("href") ||
      $("link[rel='icon']").attr("href") ||
      $("link[rel='shortcut icon']").attr("href"),
    url.toString(),
  );

  return {
    canonical,
    origin: url.origin,
    title,
    description,
    image,
    icon,
    siteName:
      getMetaContent($, ["meta[property='og:site_name']"]) || url.hostname.replace(/^www\./, ""),
    author:
      getMetaContent($, ["meta[name='author']", "meta[property='article:author']"]) || "",
    publishedDate:
      normalizeDate(
        getMetaContent($, [
          "meta[property='article:published_time']",
          "meta[name='date']",
          "meta[itemprop='datePublished']",
        ]),
      ) || "",
    modifiedDate:
      normalizeDate(
        getMetaContent($, [
          "meta[property='article:modified_time']",
          "meta[itemprop='dateModified']",
        ]),
      ) || "",
    section: getMetaContent($, ["meta[property='article:section']"]),
    price: getMetaContent($, ["meta[property='product:price:amount']"]),
    currency: getMetaContent($, ["meta[property='product:price:currency']"]),
    availability: getMetaContent($, ["meta[property='product:availability']"]),
  };
}

function buildFaqText(node: Record<string, unknown> | null) {
  if (!node) {
    return "";
  }

  const questions = Array.isArray(node.mainEntity) ? node.mainEntity : [];

  return questions
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return "";
      }

      const record = entry as Record<string, unknown>;
      const question = pickString(record.name);
      const answer =
        typeof record.acceptedAnswer === "object" && record.acceptedAnswer
          ? pickString((record.acceptedAnswer as Record<string, unknown>).text)
          : "";

      return question && answer ? `${question}\n${answer}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildBreadcrumbText(
  node: Record<string, unknown> | null,
  $: cheerio.CheerioAPI,
  sourceUrl: string,
) {
  const fromSchema = Array.isArray(node?.itemListElement)
    ? node.itemListElement
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return "";
          }

          const record = entry as Record<string, unknown>;
          const name = pickString(record.name);
          const item = toAbsoluteUrl(pickString(record.item), sourceUrl);

          return name && item ? `${name} | ${item}` : "";
        })
        .filter(Boolean)
    : [];

  if (fromSchema.length) {
    return fromSchema.join("\n");
  }

  const fromDom = $(
    "nav[aria-label*='breadcrumb' i] a, .breadcrumb a, [class*='breadcrumb'] a",
  )
    .map((_, element) => {
      const name = $(element).text().trim();
      const href = toAbsoluteUrl($(element).attr("href"), sourceUrl);
      return name && href ? `${name} | ${href}` : "";
    })
    .get()
    .filter(Boolean);

  return fromDom.join("\n");
}

function buildAutofillPayload(
  schemaType: SchemaType,
  sourceUrl: URL,
  $: cheerio.CheerioAPI,
  jsonLdNodes: Record<string, unknown>[],
): AutofillResponse {
  const metadata = getPageMetadata($, sourceUrl);
  const matchedNode = findSchemaNode(jsonLdNodes, schemaType);
  const fields = createDefaultSchemaState(schemaType);
  const warnings: string[] = [];

  if (schemaType === "article") {
    fields.url =
      toAbsoluteUrl(pickString(matchedNode?.url) || pickString(matchedNode?.mainEntityOfPage), sourceUrl.toString()) ||
      metadata.canonical;
    fields.headline = pickString(matchedNode?.headline) || metadata.title;
    fields.description = pickString(matchedNode?.description) || metadata.description;
    fields.image =
      toAbsoluteUrl(pickImageUrl(matchedNode?.image), sourceUrl.toString()) || metadata.image;
    fields.authorName = pickEntityName(matchedNode?.author) || metadata.author;
    fields.authorUrl =
      toAbsoluteUrl(pickEntityUrl(matchedNode?.author), sourceUrl.toString()) || "";
    fields.publisherName = pickEntityName(matchedNode?.publisher) || metadata.siteName;
    fields.publisherUrl =
      toAbsoluteUrl(pickEntityUrl(matchedNode?.publisher), sourceUrl.toString()) ||
      metadata.origin;
    fields.publisherLogo =
      toAbsoluteUrl(
        pickImageUrl(
          matchedNode && typeof matchedNode.publisher === "object"
            ? (matchedNode.publisher as Record<string, unknown>).logo
            : undefined,
        ),
        sourceUrl.toString(),
      ) || metadata.icon;
    fields.publishedDate = normalizeDate(pickString(matchedNode?.datePublished)) || metadata.publishedDate;
    fields.modifiedDate = normalizeDate(pickString(matchedNode?.dateModified)) || metadata.modifiedDate;
    fields.section = pickString(matchedNode?.articleSection) || metadata.section;
  }

  if (schemaType === "faq-page") {
    fields.pageUrl = metadata.canonical;
    fields.questions = buildFaqText(matchedNode);
    if (!fields.questions) {
      warnings.push(
        "No FAQ schema was found on that page, so you may need to add the question and answer pairs manually.",
      );
    }
  }

  if (schemaType === "organization") {
    fields.name = pickString(matchedNode?.name) || metadata.siteName;
    fields.url =
      toAbsoluteUrl(pickString(matchedNode?.url), sourceUrl.toString()) || metadata.origin;
    fields.logo =
      toAbsoluteUrl(pickImageUrl(matchedNode?.logo), sourceUrl.toString()) || metadata.icon;
    fields.description = pickString(matchedNode?.description) || metadata.description;
    fields.sameAs = Array.isArray(matchedNode?.sameAs)
      ? (matchedNode.sameAs as unknown[]).map((entry) => pickString(entry)).filter(Boolean).join("\n")
      : "";
    fields.contactEmail = pickString(matchedNode?.email).replace(/^mailto:/i, "");
  }

  if (schemaType === "website") {
    fields.name = pickString(matchedNode?.name) || metadata.siteName;
    fields.siteUrl =
      toAbsoluteUrl(pickString(matchedNode?.url), sourceUrl.toString()) || metadata.origin;
    fields.description = pickString(matchedNode?.description) || metadata.description;
    fields.publisher = pickEntityName(matchedNode?.publisher) || metadata.siteName;
    const potentialAction = matchedNode?.potentialAction;
    if (potentialAction && typeof potentialAction === "object") {
      const target = pickString((potentialAction as Record<string, unknown>).target);
      const queryInput = pickString((potentialAction as Record<string, unknown>)["query-input"]);
      fields.searchUrl = target;
      fields.searchQueryInput = queryInput.replace(/^required name=/i, "") || fields.searchQueryInput;
    }
  }

  if (schemaType === "product") {
    fields.name = pickString(matchedNode?.name) || metadata.title;
    fields.url =
      toAbsoluteUrl(pickString(matchedNode?.url), sourceUrl.toString()) || metadata.canonical;
    fields.description = pickString(matchedNode?.description) || metadata.description;
    fields.image =
      toAbsoluteUrl(pickImageUrl(matchedNode?.image), sourceUrl.toString()) || metadata.image;
    fields.brand = pickEntityName(matchedNode?.brand) || metadata.siteName;
    fields.sku = pickString(matchedNode?.sku);
    fields.price = pickOfferValue(matchedNode?.offers, "price") || metadata.price;
    fields.currency =
      pickOfferValue(matchedNode?.offers, "priceCurrency") || metadata.currency || fields.currency;
    fields.availability =
      pickOfferValue(matchedNode?.offers, "availability")
        .replace(/^https?:\/\/schema\.org\//i, "") ||
      metadata.availability.replace(/^https?:\/\/schema\.org\//i, "") ||
      fields.availability;
  }

  if (schemaType === "local-business") {
    const address =
      matchedNode && typeof matchedNode.address === "object"
        ? (matchedNode.address as Record<string, unknown>)
        : null;

    fields.name = pickString(matchedNode?.name) || metadata.siteName;
    fields.url =
      toAbsoluteUrl(pickString(matchedNode?.url), sourceUrl.toString()) || metadata.origin;
    fields.description = pickString(matchedNode?.description) || metadata.description;
    fields.image =
      toAbsoluteUrl(pickImageUrl(matchedNode?.image), sourceUrl.toString()) || metadata.image;
    fields.telephone = pickString(matchedNode?.telephone);
    fields.email = pickString(matchedNode?.email).replace(/^mailto:/i, "");
    fields.streetAddress = pickString(address?.streetAddress);
    fields.city = pickString(address?.addressLocality);
    fields.region = pickString(address?.addressRegion);
    fields.postalCode = pickString(address?.postalCode);
    fields.country = pickString(address?.addressCountry);
    fields.openingHours = Array.isArray(matchedNode?.openingHours)
      ? (matchedNode.openingHours as unknown[]).map((entry) => pickString(entry)).filter(Boolean).join(", ")
      : pickString(matchedNode?.openingHours);
    fields.priceRange = pickString(matchedNode?.priceRange);
  }

  if (schemaType === "breadcrumb-list") {
    fields.items = buildBreadcrumbText(matchedNode, $, sourceUrl.toString());
    if (!fields.items) {
      warnings.push(
        "No breadcrumb markup or breadcrumb navigation was found on that page, so you may need to enter the items manually.",
      );
    }
  }

  if (!matchedNode) {
    warnings.push(
      `No matching ${schemaTypeOptionsLabel(schemaType)} schema was found on the page. The generator used page metadata where possible.`,
    );
  }

  return {
    sourceUrl: metadata.canonical,
    fields,
    warnings,
    mode: matchedNode ? "existing-schema" : "metadata",
  };
}

function schemaTypeOptionsLabel(schemaType: SchemaType) {
  switch (schemaType) {
    case "article":
      return "Article";
    case "faq-page":
      return "FAQPage";
    case "organization":
      return "Organization";
    case "website":
      return "WebSite";
    case "product":
      return "Product";
    case "local-business":
      return "LocalBusiness";
    case "breadcrumb-list":
      return "BreadcrumbList";
  }
}

export async function POST(request: Request) {
  let payload: { url?: string; schemaType?: SchemaType };

  try {
    payload = (await request.json()) as { url?: string; schemaType?: SchemaType };
  } catch {
    return jsonError("Request body must be valid JSON.");
  }

  const rawUrl = payload.url?.trim();
  const schemaType = payload.schemaType;

  if (!rawUrl) {
    return jsonError("Please enter a URL to auto-fill schema data.");
  }

  if (!schemaType) {
    return jsonError("Please choose a schema type first.");
  }

  const normalizedUrl = normalizeCandidateUrl(rawUrl);

  if (!normalizedUrl) {
    return jsonError("Please enter a valid public http or https URL.");
  }

  try {
    await assertPublicUrl(normalizedUrl);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "That URL cannot be fetched safely.",
      403,
    );
  }

  try {
    const response = await axios.get<string>(normalizedUrl.toString(), {
      timeout: REQUEST_TIMEOUT_MS,
      responseType: "text",
      maxRedirects: 5,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const html = typeof response.data === "string" ? response.data : "";

    if (!html) {
      return jsonError("The target page did not return readable HTML.", 422);
    }

    const responseUrl = (
      response.request as { res?: { responseUrl?: string } } | undefined
    )?.res?.responseUrl;
    const finalUrl = new URL(responseUrl || normalizedUrl.toString());
    const $ = cheerio.load(html);
    const jsonLdNodes = parseJsonLdBlocks($);
    const autofill = buildAutofillPayload(schemaType, finalUrl, $, jsonLdNodes);

    return NextResponse.json(autofill);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return jsonError("The target page timed out before autofill could complete.", 504);
      }

      return jsonError(
        error.response?.status
          ? `The target page returned ${error.response.status}.`
          : "The target page could not be fetched for autofill.",
        error.response?.status && error.response.status < 600 ? error.response.status : 502,
      );
    }

    return jsonError("Autofill could not extract schema suggestions from that URL.", 500);
  }
}
