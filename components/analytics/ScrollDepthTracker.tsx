"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 100] as const;

// Mounts once at the root. On every route change:
//   1. Resets the "fired" set so each new page can hit the thresholds again.
//   2. Looks for an element marked `[data-scroll-root]` — blog pages use this
//      because <body> has overflow-hidden globally, so window.scroll never
//      moves. If found, listen to that element's scroll event. Otherwise fall
//      back to window (the map page is non-scrollable, which is fine).
//   3. Throttles via requestAnimationFrame.
//
// The early-out for short pages (`scrollable < 50`) prevents false 100%
// readings on the fullscreen map.
export default function ScrollDepthTracker() {
  const pathname = usePathname();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    fired.current = new Set();

    let ticking = false;
    let detach: (() => void) | null = null;

    // Wait one frame so client-rendered routes have a chance to mount their
    // [data-scroll-root] container before we attach listeners.
    const raf = window.requestAnimationFrame(() => {
      const target =
        (document.querySelector("[data-scroll-root]") as HTMLElement | null) ??
        null;

      const measure = () => {
        ticking = false;

        let scrollTop = 0;
        let viewport = 0;
        let total = 0;

        if (target) {
          scrollTop = target.scrollTop;
          viewport = target.clientHeight;
          total = target.scrollHeight;
        } else {
          const doc = document.documentElement;
          scrollTop = window.scrollY || doc.scrollTop || 0;
          viewport = window.innerHeight || doc.clientHeight || 0;
          total = doc.scrollHeight || 0;
        }

        const scrollable = Math.max(0, total - viewport);
        if (scrollable < 50) return;

        const percent = Math.min(
          100,
          Math.round((scrollTop / scrollable) * 100),
        );

        for (const t of THRESHOLDS) {
          if (percent >= t && !fired.current.has(t)) {
            fired.current.add(t);
            trackEvent("scroll_depth", { percent: t });
          }
        }
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(measure);
      };

      const source: HTMLElement | Window = target ?? window;
      source.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      measure();

      detach = () => {
        source.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    });

    return () => {
      window.cancelAnimationFrame(raf);
      if (detach) detach();
    };
  }, [pathname]);

  return null;
}
