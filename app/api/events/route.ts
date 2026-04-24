import { ensureFetcherStarted, getFetcherStatus } from "@/lib/fetcher";
import { eventStore } from "@/lib/event-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Kick off the background fetcher on first hit; don't block the response on it.
  void ensureFetcherStarted();
  const events = eventStore.list();
  return Response.json({
    events,
    status: getFetcherStatus(),
  });
}
