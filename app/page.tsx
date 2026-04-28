"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Legend from "@/components/Legend";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useEvents } from "@/components/useEvents";
import { trackEvent } from "@/lib/analytics";

const WarMap = dynamic(() => import("@/components/WarMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f14] text-zinc-500 text-sm">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const { events, connection, lastUpdate, latestId, status } = useEvents();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const seenNotified = useRef<Set<string>>(new Set());
  const didBootstrap = useRef(false);

  const handleFocus = useCallback((id: string) => {
    setFocusedId(null);
    requestAnimationFrame(() => setFocusedId(id));
  }, []);

  const handleToggleNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (notificationsOn) {
      setNotificationsOn(false);
      trackEvent("click_filter_option", {
        feature: "notifications",
        next_state: "off",
      });
      return;
    }
    if (Notification.permission === "granted") {
      setNotificationsOn(true);
      trackEvent("click_filter_option", {
        feature: "notifications",
        next_state: "on",
        permission: "granted",
      });
      return;
    }
    if (Notification.permission !== "denied") {
      const result = await Notification.requestPermission();
      if (result === "granted") setNotificationsOn(true);
      trackEvent("click_filter_option", {
        feature: "notifications",
        next_state: result === "granted" ? "on" : "off",
        permission: result,
      });
    }
  }, [notificationsOn]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((v) => {
      const next = !v;
      trackEvent("click_sidepanel_item", {
        element: "sidebar_toggle",
        next_state: next ? "open" : "closed",
        viewport: "mobile",
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (events.length > 0 && !didBootstrap.current) {
      didBootstrap.current = true;
      for (const e of events) seenNotified.current.add(e.id);
    }
  }, [events]);

  useEffect(() => {
    if (!notificationsOn || !latestId) return;
    if (seenNotified.current.has(latestId)) return;
    const ev = events.find((e) => e.id === latestId);
    if (!ev) return;
    seenNotified.current.add(ev.id);
    if (ev.severity < 4) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    try {
      new Notification(`${ev.location.name}: ${ev.title.slice(0, 80)}`, {
        body: `${ev.source} · ${new Date(ev.publishedAt).toLocaleString()}`,
        tag: ev.id,
      });
    } catch {
      // some contexts block notifications (e.g. http, iframes) — ignore
    }
  }, [latestId, events, notificationsOn]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <WarMap
        events={events}
        focusedEventId={focusedId}
        highlightedId={latestId}
      />

      <Header
        connection={connection}
        lastUpdate={lastUpdate}
        totalEvents={events.length}
        notificationsOn={notificationsOn}
        onToggleNotifications={handleToggleNotifications}
      />

      <LoadingOverlay
        connection={connection}
        status={status}
        eventCount={events.length}
      />

      <Legend />

      <button
        onClick={handleSidebarToggle}
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? "Close event feed" : "Open event feed"}
        className="pointer-events-auto absolute right-4 top-20 z-[600] flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl shadow-xl shadow-black/40 hover:bg-zinc-900/80 transition md:hidden"
      >
        {sidebarOpen ? "Hide" : "Feed"}
      </button>

      <div
        className={`absolute right-0 top-0 z-[550] h-full w-[360px] max-w-[92vw] transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          events={events}
          latestId={latestId}
          onFocus={(id) => {
            handleFocus(id);
            setSidebarOpen(false);
          }}
        />
      </div>
    </main>
  );
}
