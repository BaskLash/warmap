// Tiny, deterministic markdown parser. Intentionally narrow scope — we only
// support the constructs the blog content uses, and we always escape HTML
// before applying inline transforms so user-authored content can never inject
// raw markup.
//
// Block grammar:
//   ##  heading            → h2
//   ### subheading         → h3
//   - or *  list item      → ul > li
//   blank line             → paragraph break
//   anything else          → paragraph
//
// Inline grammar (applied to escaped text, in this order):
//   **bold**
//   *italic*
//   [text](https?://url)

export type MarkdownBlock =
  | { type: "h2"; html: string }
  | { type: "h3"; html: string }
  | { type: "p"; html: string }
  | { type: "ul"; items: string[] };

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => escapeMap[c]);
}

function isSafeUrl(url: string): boolean {
  return /^(https?:|mailto:|\/)/i.test(url);
}

// Apply inline formatting to a single line of already-escaped text.
function applyInline(escaped: string): string {
  let s = escaped;

  // Bold first so the italic regex doesn't munch the inner asterisks.
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");

  // Italic — single * pair, not preceded/followed by another *.
  s = s.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");

  // Links — escape both halves through the original escapeHtml since the
  // input was already escaped, but we still need to validate the URL.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, url: string) => {
    const decoded = url
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (!isSafeUrl(decoded)) return text;
    const target = decoded.startsWith("http") ? ' target="_blank" rel="noreferrer noopener"' : "";
    return `<a href="${escapeHtml(decoded)}"${target} class="warmap-md-link">${text}</a>`;
  });

  return s;
}

// Convert raw inline text (unescaped) to inline HTML.
export function renderInline(raw: string): string {
  return applyInline(escapeHtml(raw));
}

export function parseMarkdown(md: string): MarkdownBlock[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const joined = paragraphBuffer.join(" ");
    blocks.push({ type: "p", html: renderInline(joined) });
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push({ type: "ul", items: listBuffer.map(renderInline) });
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", html: renderInline(line.slice(3).trim()) });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", html: renderInline(line.slice(4).trim()) });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}
