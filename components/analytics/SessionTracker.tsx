"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { getSessionId, getSessionStart, isFirstSessionVisit } from "@/lib/analytics-session";
import { throttle } from "@/lib/throttle";

// Session lifecycle layer:
//
//   • session_start         — once per tab session, on first mount
//   • session_active_time   — fired on active → idle transition; param: ms
//                             of the active streak that just ended
//   • session_idle_time     — fired on idle → active transition; param: ms
//                             of the idle streak that just ended
//   • session_duration      — fired on visibilitychange:hidden / pagehide;
//                             param: total ms since session_start
//
// "Active" = any pointer / keyboard / scroll / touch input within IDLE_AFTER_MS.
// "Idle"   = no input for IDLE_AFTER_MS continuously.
//
// All four events share the auto-attached session_id from trackEvent so a single
// query in GA can reconstruct an entire session's active/idle pattern.

const IDLE_AFTER_MS = 60_000;
const ACTIVITY_THROTTLE_MS = 250;

export default function SessionTracker() {
  // Refs so callbacks captured by event listeners always see fresh values.
  const lastActiveAt = useRef<number>(Date.now());
  const lastTransitionAt = useRef<number>(Date.now());
  const isIdle = useRef<boolean>(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationFired = useRef<boolean>(false);

  useEffect(() => {
    const firstVisit = isFirstSessionVisit();
    // Touch the helpers so the IDs / start time exist before the first event.
    const sessionId = getSessionId();
    const sessionStart = getSessionStart();

    if (firstVisit) {
      trackEvent("session_start", {
        session_id: sessionId,
        started_at: sessionStart,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });
    }

    const transitionToIdle = () => {
      if (isIdle.current) return;
      const now = Date.now();
      const activeMs = now - lastTransitionAt.current;
      isIdle.current = true;
      lastTransitionAt.current = now;
      trackEvent("session_active_time", { ms: activeMs });
    };

    const transitionToActive = () => {
      if (!isIdle.current) return;
      const now = Date.now();
      const idleMs = now - lastTransitionAt.current;
      isIdle.current = false;
      lastTransitionAt.current = now;
      trackEvent("session_idle_time", { ms: idleMs });
    };

    const armIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(transitionToIdle, IDLE_AFTER_MS);
    };

    const onActivity = throttle(() => {
      lastActiveAt.current = Date.now();
      transitionToActive();
      armIdleTimer();
    }, ACTIVITY_THROTTLE_MS);

    const fireDuration = () => {
      if (durationFired.current) return;
      durationFired.current = true;
      const totalMs = Date.now() - sessionStart;
      // If we end mid-active, also flush the trailing active streak.
      if (!isIdle.current) {
        const activeMs = Date.now() - lastTransitionAt.current;
        trackEvent("session_active_time", { ms: activeMs });
      }
      trackEvent("session_duration", { ms: totalMs });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        fireDuration();
        // Allow re-firing if the tab comes back and goes again — but let GA
        // dedupe on session_id + ts, this is best-effort.
        durationFired.current = false;
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
      "mousemove",
    ];
    for (const e of events) {
      window.addEventListener(e, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", fireDuration);
    window.addEventListener("beforeunload", fireDuration);

    armIdleTimer();

    return () => {
      for (const e of events) window.removeEventListener(e, onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", fireDuration);
      window.removeEventListener("beforeunload", fireDuration);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  return null;
}
