// Runs once per Next.js server process, before the first request is served.
// We use it to kick off the RSS fetcher immediately instead of waiting for
// the first user to hit /api/events.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureFetcherStarted } = await import("./lib/fetcher");
  const { hasOpenAIKey } = await import("./lib/llm-extractor");

  console.log(
    `[warmap] boot :: llm=${hasOpenAIKey() ? "on" : "off"} model=${process.env.OPENAI_MODEL ?? "gpt-4o-mini"} concurrency=${process.env.WARMAP_EXTRACTOR_CONCURRENCY ?? 4}`,
  );

  // Don't await — let the first fetch cycle run in the background while the
  // server becomes ready. The store starts empty; SSE will stream events out
  // as they resolve, and the frontend shows a loading state until they arrive.
  void ensureFetcherStarted();
}
