import { NextResponse } from "next/server";

import {
  runBrokenLinkScan,
  type BrokenLinkScanProgress,
  type BrokenLinkScanResponse,
} from "@/lib/broken-link-checker";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

const activeScansByIp = new Map<string, number>();

type ScanRequest = {
  url?: string;
};

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function encodeLine(payload: unknown) {
  return `${JSON.stringify(payload)}\n`;
}

export async function POST(request: Request) {
  const clientKey = getClientKey(request);

  if (activeScansByIp.has(clientKey)) {
    return errorResponse("Only one scan at a time is allowed per IP. Please wait for the current scan to finish.", 429);
  }

  let payload: ScanRequest;

  try {
    payload = (await request.json()) as ScanRequest;
  } catch {
    return errorResponse("Invalid request body.");
  }

  const targetUrl = payload.url?.trim();

  if (!targetUrl) {
    return errorResponse("Enter a website URL to scan.");
  }

  const wantsStream = request.headers.get("x-stream") === "1";
  activeScansByIp.set(clientKey, Date.now());

  if (!wantsStream) {
    try {
      const result = await runBrokenLinkScan(targetUrl);
      return NextResponse.json(result);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "The scan could not be completed.",
        400,
      );
    } finally {
      activeScansByIp.delete(clientKey);
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const push = (chunk: unknown) => controller.enqueue(encoder.encode(encodeLine(chunk)));

      void (async () => {
        try {
          const result = await runBrokenLinkScan(targetUrl, {
            onProgress(progress: BrokenLinkScanProgress) {
              push({ type: "progress", payload: progress });
            },
          });

          push({ type: "complete", payload: result satisfies BrokenLinkScanResponse });
        } catch (error) {
          push({
            type: "error",
            error: error instanceof Error ? error.message : "The scan could not be completed.",
          });
        } finally {
          activeScansByIp.delete(clientKey);
          controller.close();
        }
      })();
    },
    cancel() {
      activeScansByIp.delete(clientKey);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
