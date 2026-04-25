import type { MetadataRoute } from "next";

// Served at /robots.txt by Next.js. Submit `https://your-domain/robots.txt`
// in Google Search Console; the sitemap line below points crawlers at the
// dynamic sitemap which already lists every blog post.
//
// Disallow rules:
//   /api/        — internal RSS/SSE endpoints, no crawl value
//   /sitemap.xml — referenced explicitly via the `sitemap` field, no need to
//                  list it twice; we only block accidental rule-based crawls
//                  (search engines still fetch sitemap-as-resource fine).

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

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
