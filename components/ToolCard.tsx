import Link from "next/link";

import {
  ArrowUpRight,
  Combine,
  FileImage,
  FilePen,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Minimize2,
  Presentation,
  Split,
  type LucideIcon,
} from "lucide-react";

import type { Tool, ToolIconKey } from "@/lib/tools";

export const toolIconMap: Record<ToolIconKey, LucideIcon> = {
  combine: Combine,
  split: Split,
  filePen: FilePen,
  minimize: Minimize2,
  fileImage: FileImage,
  fileText: FileText,
  fileType: FileType,
  image: ImageIcon,
  fileSpreadsheet: FileSpreadsheet,
  presentation: Presentation,
};

type ToolCardProps = {
  tool: Tool;
};

export default function ToolCard({ tool }: ToolCardProps) {
  const Icon = toolIconMap[tool.icon];

  if (tool.status === "coming-soon") {
    return (
      <article
        className="rounded-[1.75rem] border border-slate-200 bg-slate-100/80 p-6 opacity-75 shadow-sm shadow-slate-200/40"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            {tool.badge}
          </span>
        </div>

        <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-800">
          {tool.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {tool.description}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400">
          Available soon
        </span>
      </article>
    );
  }

  return (
    <article className="group h-full rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70">
      <Link
        href={tool.href}
        prefetch={false}
        className="block h-full rounded-[1.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 transition group-hover:bg-slate-900">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {tool.categoryLabel}
          </span>
        </div>

        <h3 className="mt-6 break-words text-xl font-semibold tracking-tight text-slate-950">
          {tool.name}
        </h3>
        <p className="mt-3 break-words text-sm leading-6 text-slate-600">
          {tool.description}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition group-hover:text-sky-700">
          Open tool
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}
