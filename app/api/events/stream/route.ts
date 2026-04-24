import { ensureFetcherStarted, getFetcherStatus } from "@/lib/fetcher";
import { eventStore } from "@/lib/event-store";
import type { PipelineStatus, StreamMessage, WarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_MS = 25_000;
const STATUS_POLL_MS = 2_000;

function format(msg: StreamMessage): string {
  return `data: ${JSON.stringify(msg)}\n\n`;
}

function snapshot(): PipelineStatus {
  const s = getFetcherStatus();
  return {
    firstCycleCompleted: s.firstCycleCompleted,
    cyclesCompleted: s.cyclesCompleted,
    sources: s.sources,
    llmEnabled: s.llmEnabled,
    lastError: s.lastError,
  };
}

export async function GET() {
  void ensureFetcherStarted();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let statusPoller: ReturnType<typeof setInterval> | null = null;
  let lastStatus: string = "";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (msg: StreamMessage) => {
        try {
          controller.enqueue(encoder.encode(format(msg)));
        } catch {
          cleanup();
        }
      };

      const currentStatus = snapshot();
      lastStatus = JSON.stringify(currentStatus);

      send({
        type: "init",
        events: eventStore.list(),
        status: currentStatus,
        ts: Date.now(),
      });

      unsubscribe = eventStore.subscribe((event: WarEvent) => {
        send({ type: "event", event, ts: Date.now() });
      });

      // Lightweight status updates so the UI can move out of its "scanning"
      // state as soon as the first cycle completes or the error state changes.
      statusPoller = setInterval(() => {
        const s = snapshot();
        const key = JSON.stringify(s);
        if (key !== lastStatus) {
          lastStatus = key;
          send({ type: "status", status: s, ts: Date.now() });
        }
      }, STATUS_POLL_MS);

      heartbeat = setInterval(() => {
        send({ type: "heartbeat", ts: Date.now() });
      }, HEARTBEAT_MS);

      function cleanup() {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        if (heartbeat) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        if (statusPoller) {
          clearInterval(statusPoller);
          statusPoller = null;
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
      if (statusPoller) clearInterval(statusPoller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
