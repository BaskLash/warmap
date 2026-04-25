import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOGS, getBlog } from "@/lib/blogs";
import BlogCta from "./BlogCta";

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return BLOGS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlog(slug);

  if (!post) return { title: "Essay not found — Warmap" };

  const url = `/blog/${post.slug}`;

  return {
    title: `${post.title} — Warmap`,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: post.author }],
    keywords: [post.category, "essay", "mindset", "execution"],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

/* ---------------- MARKDOWN RENDERER ---------------- */

function renderMarkdown(content: string) {
  const lines = content.trimStart().split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="flex flex-col gap-2 pl-5 list-disc">
          {listItems}
        </ul>,
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        `<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-zinc-200 hover:text-white">$1</a>`,
      );

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed === "---") {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-8 border-white/10" />);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="mt-10 mb-4 text-xl font-semibold text-zinc-100">
          {trimmed.replace("## ", "")}
        </h2>,
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="mt-6 mb-3 text-lg font-medium text-zinc-200">
          {trimmed.replace("### ", "")}
        </h3>,
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      const item = trimmed.replace(/^[-*] /, "");
      listItems.push(
        <li key={`li-${i}`}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
        </li>,
      );
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed text-zinc-300">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        </p>,
      );
    }
  });

  flushList();
  return elements;
}

/* ---------------- PAGE ---------------- */

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getBlog(slug);

  if (!post) notFound();

  return (
    <div
      data-scroll-root
      className="h-screen w-screen overflow-y-auto warmap-scroll bg-black"
    >
      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition"
        >
          ← All essays
        </Link>

        <article className="mt-8">
          <header className="mb-12">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span className="text-zinc-400">{post.category}</span>
              <span>·</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span>·</span>
              <span>{post.readTime} min read</span>
            </div>

            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50 leading-tight">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
              {post.description}
            </p>

            <p className="mt-6 text-sm text-zinc-500">
              By <span className="text-zinc-300">{post.author}</span>
            </p>
          </header>

          <div className="space-y-4">
            {renderMarkdown(post.content)}
          </div>
        </article>

        <BlogCta />

        <footer className="mt-12 border-t border-white/5 pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition"
          >
            ← More essays
          </Link>
        </footer>
      </main>
    </div>
  );
}