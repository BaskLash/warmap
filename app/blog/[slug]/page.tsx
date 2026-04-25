import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOGS, getBlog } from "@/lib/blogs";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
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
              <span>{post.readTime}</span>
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

          <MarkdownRenderer source={post.content} />
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
