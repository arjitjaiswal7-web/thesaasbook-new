"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type PdfToolWorkspaceProps = {
  slug: string;
};

function WorkspaceLoadingState() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
      <div className="max-w-xl">
        <p className="text-lg font-semibold text-slate-950">Loading tool workspace</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Preparing the interactive tool only when this page is opened so the rest of the site stays lighter.
        </p>
      </div>
    </div>
  );
}

const toolWorkspaceBySlug: Record<string, ComponentType> = {
  "merge-pdf": dynamic(() => import("@/components/tools/MergePdfTool"), {
    loading: WorkspaceLoadingState,
  }),
  "split-pdf": dynamic(() => import("@/components/tools/SplitPdfTool"), {
    loading: WorkspaceLoadingState,
  }),
  "compress-pdf": dynamic(() => import("@/components/tools/CompressPdfTool"), {
    loading: WorkspaceLoadingState,
  }),
  "edit-pdf": dynamic(() => import("@/components/tools/EditPdfTool"), {
    loading: WorkspaceLoadingState,
  }),
  "jpg-to-pdf": dynamic(() => import("@/components/tools/JpgToPdfTool"), {
    loading: WorkspaceLoadingState,
  }),
  "pdf-to-jpg": dynamic(() => import("@/components/tools/PdfToJpgTool"), {
    loading: WorkspaceLoadingState,
  }),
  "pdf-to-excel": dynamic(() => import("@/components/tools/PdfToExcelTool"), {
    loading: WorkspaceLoadingState,
  }),
  "pdf-to-powerpoint": dynamic(() => import("@/components/tools/PdfToPowerPointTool"), {
    loading: WorkspaceLoadingState,
  }),
  "pdf-to-word": dynamic(() => import("@/components/tools/PdfToWordTool"), {
    loading: WorkspaceLoadingState,
  }),
  "word-to-pdf": dynamic(() => import("@/components/tools/WordToPdfTool"), {
    loading: WorkspaceLoadingState,
  }),
};

export default function PdfToolWorkspace({ slug }: PdfToolWorkspaceProps) {
  const Workspace = toolWorkspaceBySlug[slug];

  if (!Workspace) {
    return null;
  }

  return <Workspace />;
}
