import type { FeedItem } from "./types";

const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));

const stripTags = (s: string): string => {
  // 1) Unwrap CDATA so inner markup is visible.
  // 2) Decode entities so entity-encoded tags (e.g. "&lt;p&gt;") become real tags.
  // 3) Strip all tags.
  // 4) Decode entities again for any entity-encoded text like "&amp;".
  // 5) Collapse whitespace.
  let out = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  out = decodeEntities(out);
  out = out.replace(/<[^>]*>/g, " ");
  out = decodeEntities(out);
  out = out.replace(/\s+/g, " ").trim();
  return out;
};

const extractCdataOrText = (block: string, tag: string): string | null => {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  return stripTags(m[1]);
};

const hashId = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

export interface ParsedFeed {
  sourceTitle: string;
  items: FeedItem[];
}

export function parseFeed(xml: string, sourceName: string): ParsedFeed {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const items: FeedItem[] = [];

  const channelTitle =
    extractCdataOrText(xml.slice(0, 4000), "title") ?? sourceName;

  const itemTag = isAtom ? "entry" : "item";
  const itemRe = new RegExp(`<${itemTag}[\\s>][\\s\\S]*?<\\/${itemTag}>`, "gi");
  const blocks = xml.match(itemRe) ?? [];

  for (const block of blocks) {
    const title = extractCdataOrText(block, "title") ?? "";

    let link = "";
    if (isAtom) {
      const lm =
        block.match(/<link[^>]*rel=["']?alternate["']?[^>]*href=["']([^"']+)["']/i) ??
        block.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = lm ? lm[1] : "";
    } else {
      link = extractCdataOrText(block, "link") ?? "";
    }

    const pubDate =
      extractCdataOrText(block, "pubDate") ??
      extractCdataOrText(block, "published") ??
      extractCdataOrText(block, "updated") ??
      extractCdataOrText(block, "dc:date") ??
      new Date().toISOString();

    const summary =
      extractCdataOrText(block, "description") ??
      extractCdataOrText(block, "summary") ??
      extractCdataOrText(block, "content:encoded") ??
      extractCdataOrText(block, "content") ??
      "";

    const guid = extractCdataOrText(block, "guid") ?? extractCdataOrText(block, "id") ?? link ?? title;

    if (!title && !summary) continue;

    const publishedAt = (() => {
      const d = new Date(pubDate);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    })();

    items.push({
      id: hashId(`${sourceName}|${guid}`),
      title,
      link,
      source: sourceName,
      publishedAt,
      summary: summary.slice(0, 600),
    });
  }

  return { sourceTitle: channelTitle, items };
}
