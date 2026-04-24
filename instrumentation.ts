// Runs once per Next.js server process, before the first request is served.
// Order matters: init DB → hydrate events from DB → start fetcher. That way the
// first SSE `init` frame carries every event we've ever seen, instantly,
// without any LLM calls.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { initDb, getDbStats } = await import("./lib/db");
  const { eventStore } = await import("./lib/event-store");
  const { ensureFetcherStarted } = await import("./lib/fetcher");
  const { hasOpenAIKey } = await import("./lib/llm-extractor");

  initDb();
  eventStore.hydrate();
  const stats = getDbStats();

  console.log(
    `[warmap] boot :: llm=${hasOpenAIKey() ? "on" : "off"} model=${process.env.OPENAI_MODEL ?? "gpt-4o-mini"} concurrency=${process.env.WARMAP_EXTRACTOR_CONCURRENCY ?? 4}`,
  );
  console.log(
    `[warmap] cache :: events=${stats.events} llm=${stats.llm} geocode=${stats.geocode} (hydrated=${eventStore.size()})`,
  );

  void ensureFetcherStarted();
}
