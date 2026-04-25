import type { Metadata } from "next";
import Link from "next/link";
import { listBlogs } from "@/lib/blogs";
import BlogListItem from "./blog-list-item";

export const metadata: Metadata = {
  title: "Essays — Warmap",
  description:
    "Short essays on building, learning, and shipping. No fluff, no curriculum.",
  openGraph: {
    title: "Essays — Warmap",
    description:
      "Short essays on building, learning, and shipping. No fluff, no curriculum.",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = listBlogs();

  return (
    // data-scroll-root opts this scroll container into the global
    // ScrollDepthTracker. Required because <body> is overflow-hidden.
    <div
      data-scroll-root
      className="h-screen w-screen overflow-y-auto warmap-scroll bg-black"
    >
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300 transition"
          >
            ← Back to map
          </Link>
          <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            Essays
          </h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Short pieces on building, learning, and the difference between
            motion and progress.
          </p>
        </header>

        <ul className="divide-y divide-white/5">
          {posts.map((post) => (
            <BlogListItem key={post.slug} post={post} />
          ))}
        </ul>
      </main>
    </div>
  );
}
