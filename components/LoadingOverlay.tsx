"use client";

import type { ConnectionState } from "./useEvents";
import type { PipelineStatus } from "@/lib/types";

interface Props {
  connection: ConnectionState;
  status: PipelineStatus | null;
  eventCount: number;
}

export default function LoadingOverlay({ connection, status, eventCount }: Props) {
  const firstCycleDone = status?.firstCycleCompleted ?? false;
  const show = eventCount === 0 && !firstCycleDone;
  if (!show) return null;

  const sources = status?.sources ?? 10;
  const llm = status?.llmEnabled;
  const error = status?.lastError;

  const phase =
    connection === "offline"
      ? "Reconnecting to feed…"
      : connection === "connecting"
        ? "Establishing connection…"
        : llm === true
          ? `Scanning ${sources} sources · AI geolocation active`
          : `Scanning ${sources} sources for conflict events…`;

  return (
    <div className="pointer-events-none absolute inset-0 z-[700] flex items-center justify-center">
      <div className="pointer-events-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-white/10 bg-zinc-950/85 px-7 py-6 text-center backdrop-blur-xl shadow-2xl shadow-black/60">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-red-500/20" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-red-400 border-r-red-400/60" />
          <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Warmap
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-50">{phase}</div>
          <div className="mt-2 text-xs text-zinc-400">
            Fetching RSS, classifying, geocoding. First events usually appear within a few seconds.
          </div>
          {error && (
            <div className="mt-2 text-[11px] text-amber-400/90">
              Last warning: {error.slice(0, 140)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
