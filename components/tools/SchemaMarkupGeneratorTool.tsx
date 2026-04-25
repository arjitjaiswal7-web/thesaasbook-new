"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import {
  buildRichResultsTestUrl,
  createAllSchemaStates,
  createDefaultSchemaState,
  formatSchemaJsonLd,
  getPrimarySchemaUrl,
  getSchemaFields,
  getSchemaTypeOption,
  schemaTypeOptions,
  type SchemaFieldDefinition,
  type SchemaFieldValues,
  type SchemaStates,
  type SchemaType,
  validateSchema,
} from "@/lib/schema-markup";

type AutofillResult = {
  sourceUrl: string;
  fields: SchemaFieldValues;
  warnings: string[];
  mode: "existing-schema" | "metadata";
};

type AutofillState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  warnings: string[];
  sourceUrl?: string;
};

function mergeSuggestedFields(
  current: SchemaFieldValues,
  next: SchemaFieldValues,
) {
  const merged = { ...current };

  for (const [key, value] of Object.entries(next)) {
    if (value.trim()) {
      merged[key] = value;
    }
  }

  return merged;
}

function downloadJsonLd(content: string, schemaType: SchemaType) {
  const blob = new Blob([content], { type: "application/ld+json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${schemaType}.schema.jsonld`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function FieldShell({
  field,
  children,
}: {
  field: SchemaFieldDefinition;
  children: ReactNode;
}) {
  return (
    <label
      className={`block ${field.fullWidth ? "md:col-span-2" : ""}`}
    >
      <span className="text-sm font-medium text-slate-700">{field.label}</span>
      {field.help ? (
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {field.help}
        </span>
      ) : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function StatusList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "red" | "amber";
}) {
  if (!items.length) {
    return null;
  }

  const toneClasses =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${toneClasses}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function SchemaMarkupGeneratorTool() {
  const [schemaType, setSchemaType] = useState<SchemaType>("article");
  const [schemaStates, setSchemaStates] = useState<SchemaStates>(() =>
    createAllSchemaStates(),
  );
  const [autofillUrl, setAutofillUrl] = useState("");
  const [autofillState, setAutofillState] = useState<AutofillState>({
    status: "idle",
    message: "",
    warnings: [],
  });
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const currentFields = schemaStates[schemaType];
  const currentSchemaOption = getSchemaTypeOption(schemaType);
  const fieldDefinitions = getSchemaFields(schemaType);

  const previewJson = useMemo(
    () => formatSchemaJsonLd(schemaType, currentFields),
    [schemaType, currentFields],
  );

  const validation = useMemo(
    () => validateSchema(schemaType, currentFields),
    [schemaType, currentFields],
  );

  const testUrl = buildRichResultsTestUrl(
    getPrimarySchemaUrl(schemaType, currentFields) ||
      autofillState.sourceUrl ||
      autofillUrl,
  );

  function updateCurrentField(key: string, value: string) {
    setSchemaStates((previous) => ({
      ...previous,
      [schemaType]: {
        ...previous[schemaType],
        [key]: value,
      },
    }));
  }

  async function handleAutofill() {
    const candidateUrl = autofillUrl.trim();

    if (!candidateUrl) {
      setAutofillState({
        status: "error",
        message: "Add a page URL first so we can pull suggested schema fields.",
        warnings: [],
      });
      return;
    }

    setAutofillState({
      status: "loading",
      message: "Fetching page metadata and existing structured data…",
      warnings: [],
    });

    try {
      const response = await fetch("/api/seo/schema-markup-generator/autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: candidateUrl, schemaType }),
      });

      const payload = (await response.json()) as AutofillResult & { error?: string };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Autofill could not load suggestions.");
      }

      setSchemaStates((previous) => ({
        ...previous,
        [schemaType]: mergeSuggestedFields(previous[schemaType], payload.fields),
      }));

      setAutofillUrl(payload.sourceUrl);
      setAutofillState({
        status: "success",
        message:
          payload.mode === "existing-schema"
            ? "Existing structured data was found and merged into the form."
            : "Suggested fields were pulled from page metadata.",
        warnings: payload.warnings,
        sourceUrl: payload.sourceUrl,
      });
    } catch (error) {
      setAutofillState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Autofill could not load suggestions from that URL.",
        warnings: [],
      });
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(previewJson);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  function handleResetCurrentSchema() {
    setSchemaStates((previous) => ({
      ...previous,
      [schemaType]: createDefaultSchemaState(schemaType),
    }));
    setCopyState("idle");
    setAutofillState({
      status: "idle",
      message: "",
      warnings: [],
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
      <div className="space-y-6 min-w-0">
        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Schema type</span>
              <select
                value={schemaType}
                onChange={(event) => setSchemaType(event.target.value as SchemaType)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {schemaTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {currentSchemaOption?.description}
              </p>
            </label>

            <div>
              <span className="text-sm font-medium text-slate-700">Auto-fill from URL</span>
              <div className="mt-2 space-y-3">
                <input
                  type="url"
                  value={autofillUrl}
                  onChange={(event) => {
                    setAutofillUrl(event.target.value);
                    setAutofillState((previous) =>
                      previous.status === "idle"
                        ? previous
                        : {
                            status: "idle",
                            message: "",
                            warnings: [],
                          },
                    );
                  }}
                  placeholder="Enter a page URL, e.g. https://example.com/blog/post"
                  className="h-12 min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="button"
                  onClick={handleAutofill}
                  disabled={autofillState.status === "loading"}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto sm:min-w-[11rem]"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {autofillState.status === "loading" ? "Auto-filling…" : "Auto-fill schema"}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                We’ll pull high-confidence fields from page metadata and existing JSON-LD when it is available.
              </p>
            </div>
          </div>

          {autofillState.status !== "idle" ? (
            <div
              className={`mt-5 rounded-2xl border px-4 py-4 text-sm leading-6 ${
                autofillState.status === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : autofillState.status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <p className="font-medium">{autofillState.message}</p>
              {autofillState.sourceUrl ? (
                <p className="mt-2 break-all text-xs text-slate-500">
                  Source URL: {autofillState.sourceUrl}
                </p>
              ) : null}
              {autofillState.warnings.length ? (
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {autofillState.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Schema fields
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fill the required fields first, then tighten the preview with recommended details.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetCurrentSchema}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Reset current schema
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {fieldDefinitions.map((field) => (
              <FieldShell key={field.key} field={field}>
                {field.type === "textarea" ? (
                  <textarea
                    value={currentFields[field.key] ?? ""}
                    onChange={(event) => updateCurrentField(field.key, event.target.value)}
                    rows={field.rows ?? 4}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={currentFields[field.key] ?? ""}
                    onChange={(event) => updateCurrentField(field.key, event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  >
                    {(field.options ?? []).map((option) => (
                      <option key={option.value || option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={currentFields[field.key] ?? ""}
                    onChange={(event) => updateCurrentField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  />
                )}
              </FieldShell>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-6 min-w-0">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {currentSchemaOption?.richResultsEligible ? "Rich result friendly" : "General schema"}
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                Live JSON-LD preview
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The preview updates as you edit. Copy it directly into your page head or CMS schema field.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "error"
                    ? "Copy failed"
                    : "Copy JSON-LD"}
              </button>
              <button
                type="button"
                onClick={() => downloadJsonLd(previewJson, schemaType)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download .jsonld
              </button>
              <a
                href={testUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Rich Results Test
              </a>
            </div>
          </div>

          <pre className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-sm leading-6 text-slate-100">
            <code>{previewJson}</code>
          </pre>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                Validation checker
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review required fields, recommended improvements, and common formatting issues before you publish.
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                validation.isValid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {validation.isValid ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {validation.isValid ? "Ready to publish" : "Needs attention"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Required fields complete
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {validation.requiredComplete}/{validation.requiredTotal}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Recommended fields complete
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {validation.recommendedComplete}/{validation.recommendedTotal}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <StatusList
              title="Required fixes"
              items={validation.errors}
              tone="red"
            />
            <StatusList
              title="Helpful improvements"
              items={validation.warnings}
              tone="amber"
            />
            {!validation.errors.length && !validation.warnings.length ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-700">
                This schema draft covers the required fields and does not have any obvious formatting issues.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
