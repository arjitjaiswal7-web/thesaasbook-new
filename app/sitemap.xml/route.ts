import { buildSitemapIndexXml, getSitemapIndexEntries } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getSitemapIndexEntries();

  return new Response(buildSitemapIndexXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
