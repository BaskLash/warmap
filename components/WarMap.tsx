"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { WarEvent } from "@/lib/types";
import { EVENT_LABELS, eventColor, relativeTime } from "./event-style";

interface LocationGroup {
  key: string;
  lat: number;
  lng: number;
  locationName: string;
  country: string;
  events: WarEvent[];
}

function groupByLocation(events: WarEvent[]): LocationGroup[] {
  const by = new Map<string, LocationGroup>();
  for (const e of events) {
    const key = `${e.location.lat.toFixed(3)}|${e.location.lng.toFixed(3)}`;
    const existing = by.get(key);
    if (existing) {
      existing.events.push(e);
    } else {
      by.set(key, {
        key,
        lat: e.location.lat,
        lng: e.location.lng,
        locationName: e.location.name,
        country: e.location.country,
        events: [e],
      });
    }
  }
  for (const g of by.values()) {
    g.events.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }
  return Array.from(by.values());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPopup(group: LocationGroup): string {
  const [primary, ...rest] = group.events;
  const color = eventColor(primary);
  const extraCount = rest.length;
  const countBadge =
    extraCount > 0
      ? `<span style="margin-left:8px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,0.08);font-size:11px;color:#cbd5f5;">+${extraCount} more</span>`
      : "";

  const confBadge =
    primary.location.confidence === "high"
      ? ""
      : `<span style="margin-left:6px;padding:1px 6px;border-radius:4px;background:rgba(245,158,11,0.15);color:#fbbf24;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(primary.location.confidence)}</span>`;

  return `
    <div style="max-width:320px;font-family:var(--font-sans, system-ui);color:#e5e7eb;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="width:8px;height:8px;border-radius:999px;background:${color};box-shadow:0 0 8px ${color};"></span>
        <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">
          ${escapeHtml(EVENT_LABELS[primary.eventType])}
        </span>
        ${confBadge}
        ${countBadge}
      </div>
      <div style="font-size:14px;font-weight:600;line-height:1.35;margin-bottom:6px;color:#f9fafb;">
        ${escapeHtml(primary.title)}
      </div>
      <div style="font-size:12px;line-height:1.45;color:#cbd5e1;margin-bottom:8px;">
        ${escapeHtml(primary.summary.slice(0, 220))}${primary.summary.length > 220 ? "…" : ""}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:#94a3b8;">
        <span>
          <strong style="color:#e2e8f0;">Source:</strong> ${escapeHtml(primary.source)} · ${escapeHtml(relativeTime(primary.publishedAt))}
        </span>
        <a href="${escapeHtml(primary.sourceUrl)}" target="_blank" rel="noreferrer noopener"
          style="color:#60a5fa;text-decoration:none;font-weight:500;">Open →</a>
      </div>
      <div style="margin-top:6px;font-size:11px;color:#64748b;">
        ${escapeHtml(group.locationName)}${group.country ? `, ${escapeHtml(group.country)}` : ""}
      </div>
    </div>
  `;
}

interface Props {
  events: WarEvent[];
  focusedEventId: string | null;
  highlightedId: string | null;
  onMarkerHover?: (eventId: string | null) => void;
}

export default function WarMap({
  events,
  focusedEventId,
  highlightedId,
  onMarkerHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const hoverCbRef = useRef(onMarkerHover);
  hoverCbRef.current = onMarkerHover;

  const groups = useMemo(() => groupByLocation(events), [events]);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: [30, 25],
        zoom: 3,
        minZoom: 2,
        maxZoom: 12,
        worldCopyJump: true,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        },
      ).addTo(map);

      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);

  // Sync markers with grouped events
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const seen = new Set<string>();

    for (const group of groups) {
      seen.add(group.key);
      const existing = markersRef.current.get(group.key);
      const primary = group.events[0];
      const color = eventColor(primary);
      const count = group.events.length;

      const html = `
        <div class="warmap-marker" style="--marker-color:${color};">
          <span class="warmap-marker-pulse"></span>
          <span class="warmap-marker-dot"></span>
          ${count > 1 ? `<span class="warmap-cluster-count" style="position:absolute;top:-10px;right:-12px;padding:1px 5px;border-radius:999px;background:rgba(10,10,10,0.9);color:#fff;font-size:10px;font-weight:600;border:1px solid ${color};">${count}</span>` : ""}
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: "warmap-divicon",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      if (existing) {
        existing.setIcon(icon);
        existing.setPopupContent(buildPopup(group));
      } else {
        const marker = L.marker([group.lat, group.lng], {
          icon,
          riseOnHover: true,
        }).addTo(map);

        marker.bindPopup(buildPopup(group), {
          closeButton: true,
          autoPan: true,
          offset: [0, -4],
          className: "warmap-popup",
        });

        marker.on("mouseover", () => {
          marker.openPopup();
          hoverCbRef.current?.(primary.id);
        });
        marker.on("mouseout", () => {
          hoverCbRef.current?.(null);
        });
        marker.on("click", () => {
          marker.openPopup();
        });

        markersRef.current.set(group.key, marker);
      }
    }

    // Remove markers that no longer have events
    for (const [key, marker] of markersRef.current.entries()) {
      if (!seen.has(key)) {
        marker.remove();
        markersRef.current.delete(key);
      }
    }
  }, [groups]);

  // Fly to focused event
  useEffect(() => {
    if (!focusedEventId) return;
    const map = mapRef.current;
    if (!map) return;
    const event = events.find((e) => e.id === focusedEventId);
    if (!event) return;
    const key = `${event.location.lat.toFixed(3)}|${event.location.lng.toFixed(3)}`;
    const marker = markersRef.current.get(key);
    map.flyTo([event.location.lat, event.location.lng], Math.max(map.getZoom(), 6), {
      duration: 1.1,
    });
    if (marker) {
      setTimeout(() => marker.openPopup(), 700);
    }
  }, [focusedEventId, events]);

  // Subtle highlight for the most recent event arriving via stream
  useEffect(() => {
    if (!highlightedId) return;
    const ev = events.find((e) => e.id === highlightedId);
    if (!ev) return;
    const key = `${ev.location.lat.toFixed(3)}|${ev.location.lng.toFixed(3)}`;
    const marker = markersRef.current.get(key);
    if (!marker) return;
    const el = marker.getElement();
    if (!el) return;
    el.classList.remove("warmap-new");
    // Force reflow so the animation replays
    void (el as HTMLElement).offsetWidth;
    el.classList.add("warmap-new");
  }, [highlightedId, events]);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Live conflict map" />;
}
