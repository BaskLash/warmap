import { parseMarkdown, type MarkdownBlock } from "@/lib/markdown";

interface Props {
  source: string;
}

// Server component. The parser produces sanitized inline HTML strings; we
// inject them via dangerouslySetInnerHTML so bold / italic / links render
// without React unwrapping them as text. Block elements stay as real React
// nodes so Tailwind classes apply cleanly.
export default function MarkdownRenderer({ source }: Props) {
  const blocks = parseMarkdown(source);

  return (
    <div className="space-y-6 leading-[1.75] text-zinc-300">
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

function renderBlock(block: MarkdownBlock, key: number) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={key}
          className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-zinc-50"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "h3":
      return (
        <h3
          key={key}
          className="mt-8 mb-3 text-lg font-semibold tracking-tight text-zinc-100"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "p":
      return (
        <p
          key={key}
          className="text-zinc-300"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "ul":
      return (
        <ul
          key={key}
          className="my-2 ml-5 list-disc space-y-2 marker:text-zinc-500"
        >
          {block.items.map((html, j) => (
            <li
              key={j}
              className="pl-1 text-zinc-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))}
        </ul>
      );
  }
}
