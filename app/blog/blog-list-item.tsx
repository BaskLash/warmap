"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import type { BlogPost } from "@/lib/blogs";

interface Props {
  post: BlogPost;
}

export default function BlogListItem({ post }: Props) {
  return (
    <li className="group">
      <Link
        href={`/blog/${post.slug}`}
        onClick={() => trackEvent("blog_click", { blog_slug: post.slug })}
        className="block py-8 transition-colors"
      >
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <span className="text-zinc-400">{post.category}</span>
          <span>·</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{post.readTime} min read</span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 group-hover:text-white">
          {post.title}
        </h2>
        <p className="mt-3 text-zinc-400 leading-relaxed">{post.description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-300 group-hover:text-white">
          Read essay
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </Link>
    </li>
  );
}
