import { buildSitemapXml, getToolsSitemapEntries } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getToolsSitemapEntries();

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
