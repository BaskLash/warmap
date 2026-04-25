// Typed gtag helpers. All analytics call sites go through this module so we
// have one place to add new event names, future provider switches, or
// per-environment muting.
//
// SSR-safe: every helper short-circuits when window or window.gtag is missing,
// so server components and prerender passes won't blow up.

export type GtagEventName =
  | "page_view"
  | "scroll_depth"
  | "blog_click"
  | "request_access_click"
  | "start_now_click";

export interface GtagEventParams {
  [key: string]: string | number | boolean | undefined | null;
}

type GtagFn = (
  command: "config" | "event" | "set" | "consent" | "js",
  targetId: string,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export function isAnalyticsReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function trackEvent(
  name: GtagEventName,
  params?: GtagEventParams,
): void {
  if (!isAnalyticsReady()) return;
  try {
    window.gtag!("event", name, params ?? {});
  } catch {
    // Never let analytics errors surface to the user.
  }
}

export function trackPageview(path: string, title?: string): void {
  if (!isAnalyticsReady()) return;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return;
  try {
    // App Router doesn't trigger gtag's automatic pageview on client
    // navigation, so we update the property and fire an explicit page_view.
    window.gtag!("config", gaId, { page_path: path, page_title: title });
    window.gtag!("event", "page_view", { page_path: path, page_title: title });
  } catch {
    // ignore
  }
}
