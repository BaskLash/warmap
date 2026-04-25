import { listBlogs } from "@/lib/blogs";

// Dynamic XML sitemap. Reads from lib/blogs.ts so the file updates itself
// every time a post is added — no manual maintenance.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface Entry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export async function GET(): Promise<Response> {
  const base = getBaseUrl();
  const today = new Date().toISOString().slice(0, 10);
  const posts = listBlogs();

  const entries: Entry[] = [
    { loc: `${base}/`, lastmod: today, changefreq: "hourly", priority: 1.0 },
    {
      loc: `${base}/blog`,
      lastmod: posts[0]?.date ?? today,
      changefreq: "weekly",
      priority: 0.8,
    },
    ...posts.map<Entry>((p) => ({
      loc: `${base}/blog/${p.slug}`,
      lastmod: p.date,
      changefreq: "monthly",
      priority: 0.7,
    })),
  ];

  const xmlEntries = entries
    .map((e) => {
      const parts = [`<loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`<lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
      if (e.priority != null) parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n    ${parts.join("\n    ")}\n  </url>`;
    })
    .join("\n");

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${xmlEntries}\n` +
    `</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
}
