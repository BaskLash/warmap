import { classify } from "./classifier";
import { findLocation } from "./gazetteer";
import { resolveBestLocation } from "./geocoder";
import { extractWithLlm, hasOpenAIKey } from "./llm-extractor";
import type { EventType, FeedItem, WarEvent } from "./types";

/**
 * Pipeline (for each RSS item):
 *
 *   1. Cheap keyword classifier  → drop obvious non-war articles
 *   2. If OPENAI_API_KEY set:
 *        a. Ask the LLM to re-classify and extract ALL explicit locations
 *           (cities, regions, countries, straits, seas, bases)
 *        b. Resolve each extracted location via custom gazetteer → Nominatim
 *           → country-level fallback, and pick the best one
 *      Else:
 *        Use the legacy gazetteer text-scan as the location resolver
 *   3. Build a WarEvent and hand it to the store
 *
 * Steps 2a–2b are the additive stage the user asked for; step 1 is the existing
 * cheap pre-filter preserved for cost / latency.
 */
export async function extractEvent(item: FeedItem): Promise<WarEvent | null> {
  const text = `${item.title}. ${item.summary}`;
  const keywordResult = classify(text);
  if (!keywordResult.isWar) return null;

  let eventType: EventType = keywordResult.eventType;
  let severity = keywordResult.severity;
  let keywords = keywordResult.keywords;
  let summaryText = item.summary;

  // Try the LLM-powered path.
  if (hasOpenAIKey()) {
    const llm = await extractWithLlm(item.id, item.title, item.summary);
    if (llm) {
      if (!llm.isWar) return null; // LLM overrules the cheap classifier on negatives
      eventType = llm.eventType;
      severity = Math.max(severity, llm.severity);
      if (llm.brief) summaryText = llm.brief;
      if (llm.locations.length > 0) {
        const resolved = await resolveBestLocation(llm.locations);
        if (resolved) {
          return buildEvent(item, {
            eventType,
            severity,
            keywords,
            location: resolved,
            summary: summaryText,
          });
        }
      }
      // Fall through to legacy resolver if the LLM returned locations we
      // couldn't geocode (or returned none at all).
    }
  }

  const legacy = findLocation(item.title, item.summary);
  if (!legacy) return null;

  return buildEvent(item, {
    eventType,
    severity,
    keywords,
    location: legacy,
    summary: summaryText,
  });
}

function buildEvent(
  item: FeedItem,
  parts: {
    eventType: EventType;
    severity: number;
    keywords: string[];
    location: WarEvent["location"];
    summary: string;
  },
): WarEvent {
  return {
    id: item.id,
    title: item.title,
    summary: parts.summary,
    source: item.source,
    sourceUrl: item.link,
    publishedAt: item.publishedAt,
    receivedAt: new Date().toISOString(),
    location: parts.location,
    eventType: parts.eventType,
    severity: parts.severity,
    keywords: parts.keywords,
  };
}
