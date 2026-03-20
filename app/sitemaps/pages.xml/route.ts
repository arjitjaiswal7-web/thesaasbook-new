import { buildSitemapXml, getPagesSitemapEntries } from "@/lib/sitemaps";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getPagesSitemapEntries();

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
