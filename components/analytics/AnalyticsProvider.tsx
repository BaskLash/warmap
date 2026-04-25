"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackPageview } from "@/lib/analytics";

// Internal piece — must be Suspense-wrapped because useSearchParams forces
// dynamic rendering, and we don't want that constraint to bubble up to the
// root layout.
function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const qs = searchParams?.toString();
    const fullPath = qs ? `${pathname}?${qs}` : pathname;
    if (lastPath.current === fullPath) return;
    lastPath.current = fullPath;
    trackPageview(fullPath, document.title);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}
