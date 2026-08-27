import Link from "next/link";
import { ArrowRight } from "lucide-react";

import FAQSection, { type FAQItem } from "@/app/components/FAQSection";
import { toolIconMap } from "@/components/ToolCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedTools from "@/components/RelatedTools";
import type { LiveTool } from "@/lib/tools";

type ToolPageTemplateProps = {
  tool: LiveTool;
  relatedTools: LiveTool[];
  faqs: FAQItem[];
  overviewDescription?: string;
  workspace?: React.ReactNode;
  workspaceTitle?: string;
  workspaceDescription?: string;
  toolGroupLabel?: string;
  toolGroupHref?: string;
  relatedToolsTitle?: string;
  detailsSection?: React.ReactNode;
  showHowToSteps?: boolean;
};

export default function ToolPageTemplate({
  tool,
  relatedTools,
  faqs,
  overviewDescription,
  workspace,
  workspaceTitle,
  workspaceDescription,
  toolGroupLabel = "PDF Tools",
  toolGroupHref = "/tools/pdf-tools",
  relatedToolsTitle,
  detailsSection,
  showHowToSteps = true,
}: ToolPageTemplateProps) {
  const Icon = toolIconMap[tool.icon];

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: toolGroupLabel, href: toolGroupHref },
          { label: tool.name },
        ]}
      />

      <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {tool.categoryLabel}
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {tool.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {tool.description}
          </p>
        </div>

        <aside className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
            Tool Overview
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {overviewDescription ??
              `Use the ${tool.name} page to complete this workflow quickly with a clean browser-based workspace.`}
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href={toolGroupHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
            >
              {`Browse all ${toolGroupLabel.toLowerCase()}`}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-sky-700"
              >
                Back to all tools
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {workspaceTitle ?? "Tool Workspace"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {workspaceDescription ??
            `Use the ${tool.name} workspace below to process files directly in your browser.`}
        </p>
        {workspace ? (
          <div className="mt-6 min-w-0">{workspace}</div>
        ) : (
          <div className="mt-6 flex min-h-72 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
            <div className="max-w-xl">
              <p className="text-lg font-semibold text-slate-950">
                {tool.name} workspace
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The interactive workspace for {tool.name} will run in this area.
              </p>
            </div>
          </div>
        )}
      </section>

      {showHowToSteps ? (
        <section className="tool-guide mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            How to Use This Tool
          </h2>
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="space-y-4">
              {tool.howToSteps.map((step, index) => (
                <div key={step} className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/40">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {detailsSection ? <div className="mt-10">{detailsSection}</div> : null}

      <RelatedTools
        tools={relatedTools}
        title={relatedToolsTitle ?? `Related ${toolGroupLabel}`}
      />

      <FAQSection
        items={faqs}
        className="mt-12"
      />
    </main>
  );
}
