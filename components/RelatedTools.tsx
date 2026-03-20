import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { toolIconMap } from "@/components/ToolCard";
import type { LiveTool } from "@/lib/tools";

type RelatedToolsProps = {
  tools: LiveTool[];
};

export default function RelatedTools({ tools }: RelatedToolsProps) {
  if (!tools.length) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
        Related PDF Tools
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {tools.map((tool) => {
          const Icon = toolIconMap[tool.icon];

          return (
            <Link
              key={tool.slug}
              href={tool.href}
              className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">
                {tool.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {tool.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition group-hover:text-sky-700">
                Open tool
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
