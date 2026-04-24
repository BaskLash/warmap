"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StreamMessage, WarEvent } from "@/lib/types";

export type ConnectionState = "connecting" | "live" | "polling" | "offline";

interface UseEventsResult {
  events: WarEvent[];
  connection: ConnectionState;
  lastUpdate: number | null;
  latestId: string | null;
}

const MAX_CLIENT_EVENTS = 500;

function mergeEvents(current: WarEvent[], incoming: WarEvent[]): WarEvent[] {
  const map = new Map(current.map((e) => [e.id, e]));
  for (const e of incoming) map.set(e.id, e);
  return Array.from(map.values())
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, MAX_CLIENT_EVENTS);
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<WarEvent[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [latestId, setLatestId] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshPoll = useCallback(async () => {
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { events: WarEvent[] };
      setEvents((prev) => mergeEvents(prev, json.events));
      setLastUpdate(Date.now());
      setConnection("polling");
    } catch {
      setConnection("offline");
    }
  }, []);

  useEffect(() => {
    let closed = false;

    const openStream = () => {
      if (closed) return;
      try {
        const es = new EventSource("/api/events/stream");
        sourceRef.current = es;

        es.onopen = () => {
          setConnection("live");
        };

        es.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data) as StreamMessage;
            if (msg.type === "init" && msg.events) {
              setEvents((prev) => mergeEvents(prev, msg.events!));
              setLastUpdate(msg.ts);
            } else if (msg.type === "event" && msg.event) {
              const incoming = msg.event;
              setEvents((prev) => mergeEvents(prev, [incoming]));
              setLatestId(incoming.id);
              setLastUpdate(msg.ts);
            } else if (msg.type === "heartbeat") {
              setLastUpdate(msg.ts);
            }
          } catch {
            // malformed payload — ignore
          }
        };

        es.onerror = () => {
          setConnection("connecting");
          es.close();
          sourceRef.current = null;
          if (closed) return;
          // Fall back to polling and retry SSE after a delay
          if (!pollRef.current) {
            void refreshPoll();
            pollRef.current = setInterval(refreshPoll, 30_000);
          }
          setTimeout(() => {
            if (closed) return;
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            openStream();
          }, 8_000);
        };
      } catch {
        setConnection("offline");
      }
    };

    openStream();

    return () => {
      closed = true;
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [refreshPoll]);

  return { events, connection, lastUpdate, latestId };
}
