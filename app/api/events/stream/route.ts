import { ensureFetcherStarted } from "@/lib/fetcher";
import { eventStore } from "@/lib/event-store";
import type { StreamMessage, WarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEARTBEAT_MS = 25_000;

function format(msg: StreamMessage): string {
  return `data: ${JSON.stringify(msg)}\n\n`;
}

export async function GET() {
  void ensureFetcherStarted();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (msg: StreamMessage) => {
        try {
          controller.enqueue(encoder.encode(format(msg)));
        } catch {
          cleanup();
        }
      };

      send({
        type: "init",
        events: eventStore.list(),
        ts: Date.now(),
      });

      unsubscribe = eventStore.subscribe((event: WarEvent) => {
        send({ type: "event", event, ts: Date.now() });
      });

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
