"use client";

import Link from "next/link";
import {
  RequestAccessButton,
  StartNowButton,
} from "@/components/analytics/TrackedButton";

// CTA box at the bottom of every blog post. The two buttons fire the
// `request_access_click` and `start_now_click` events the spec calls out by
// name; both still work as plain anchors via onClick navigation so they're
// crawlable and keyboard-accessible.
export default function BlogCta() {
  return (
    <aside className="mt-16 rounded-2xl border border-white/10 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-xl shadow-2xl shadow-black/40">
      <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        Stop reading
      </div>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
        The version you ship beats the version you imagine.
      </h2>
      <p className="mt-3 text-zinc-400 leading-relaxed">
        You don't need another article. You need a deadline. Pick one of the
        below — whichever moves first wins.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <StartNowButton
          className="inline-flex items-center justify-center rounded-full bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white transition"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Start now →
        </StartNowButton>
        <RequestAccessButton
          className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-white/10 transition"
          onClick={() => {
            window.location.href = "mailto:olivier.luethy@gmx.net?subject=Request%20access";
          }}
        >
          Request access
        </RequestAccessButton>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 transition"
        >
          Read another essay
        </Link>
      </div>
    </aside>
  );
}
