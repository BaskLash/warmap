import type { EventType } from "./types";

export type LocationType =
  | "city"
  | "region"
  | "country"
  | "strategic_waterway"
  | "sea"
  | "base"
  | "other";

export interface ExtractedLocation {
  name: string;
  type: LocationType;
  country: string;
  confidence: number;
}

export interface LlmExtractionResult {
  isWar: boolean;
  eventType: EventType;
  severity: number;
  brief: string;
  locations: ExtractedLocation[];
}

const EVENT_TYPES: EventType[] = [
  "airstrike",
  "missile",
  "drone",
  "shelling",
  "ground",
  "naval",
  "casualties",
  "diplomacy",
  "cyber",
  "humanitarian",
  "other",
];

const LOCATION_TYPES: LocationType[] = [
  "city",
  "region",
  "country",
  "strategic_waterway",
  "sea",
  "base",
  "other",
];

const SYSTEM_PROMPT = `You are an expert conflict analyst extracting structured data from news headlines and summaries.

FIELDS:
- isWar: true if the article describes armed conflict, military action (airstrike, missile, drone, artillery, ground ops, naval action), attack, siege, hostage/militant activity, ceasefire/truce, occupation, escalation, or imminent-war risk. false for sports, entertainment, finance, weather, unrelated politics, celebrity, or historical commemorations with no current incident.
- eventType: most specific matching category.
- severity: 0-10 intensity score. 0 = none, 1-3 = low-intensity/diplomatic, 4-6 = kinetic incident, 7-10 = mass-casualty or major offensive.
- brief: one-sentence neutral summary (<= 180 chars), no markup.
- locations: EVERY concrete geographic reference explicitly mentioned in the text. Include cities, regions, countries, strategic waterways (Strait of Hormuz, Bab el-Mandeb, Suez Canal, Taiwan Strait, Bosphorus, Strait of Gibraltar, Malacca Strait, Kerch Strait), seas/gulfs (Red Sea, Black Sea, Persian Gulf, Gulf of Oman, Gulf of Aden, Mediterranean, South China Sea), military bases and strategic sites (Ain al-Asad, Al-Tanf, Incirlik, Natanz, Fordow).

LOCATION RULES:
- Include the MOST SPECIFIC location named. If the article says "Tehran", return "Tehran" (city), not "Iran" (country). Include both if both are mentioned.
- Do NOT invent locations that are not explicitly named in the title or summary.
- Use the canonical English name ("Kyiv" not "Kiev"; "Bab el-Mandeb" not "Bab al-Mandab"), but preserve the spelling if the text uses a variant.
- country field: country the location belongs to. For seas and international straits use "International waters".
- type: classify precisely. Waterways like straits = "strategic_waterway"; seas/gulfs = "sea"; named military bases and nuclear/weapon sites = "base".
- confidence: 0-1. How sure you are this location is genuinely the subject of the event (not just a passing mention). A dateline or explicit incident location = 0.9-1.0. A passing contextual reference = 0.3-0.5.

Return an empty locations array only when NO concrete geographic reference exists in the text.`;

// Strict JSON schema for structured outputs.
const JSON_SCHEMA = {
  name: "war_event_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      isWar: { type: "boolean" },
      eventType: { type: "string", enum: EVENT_TYPES },
      severity: { type: "integer", minimum: 0, maximum: 10 },
      brief: { type: "string" },
      locations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: LOCATION_TYPES },
            country: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["name", "type", "country", "confidence"],
        },
      },
    },
    required: ["isWar", "eventType", "severity", "brief", "locations"],
  },
};

const cache = new Map<string, LlmExtractionResult>();
const MAX_CACHE = 2000;

interface LlmStats {
  calls: number;
  cacheHits: number;
  errors: number;
  totalLatencyMs: number;
}
const stats: LlmStats = { calls: 0, cacheHits: 0, errors: 0, totalLatencyMs: 0 };

function cachePut(key: string, value: LlmExtractionResult) {
  cache.set(key, value);
  if (cache.size > MAX_CACHE) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getLlmStats(): LlmStats & { cacheSize: number; avgLatencyMs: number } {
  return {
    ...stats,
    cacheSize: cache.size,
    avgLatencyMs: stats.calls > 0 ? Math.round(stats.totalLatencyMs / stats.calls) : 0,
  };
}

export async function extractWithLlm(
  id: string,
  title: string,
  summary: string,
): Promise<LlmExtractionResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const cached = cache.get(id);
  if (cached) {
    stats.cacheHits++;
    return cached;
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const t0 = Date.now();
  const userContent = `Title: ${title}\n\nSummary: ${summary.slice(0, 1200)}`;

  const body = {
    model,
    temperature: 0.1,
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      stats.errors++;
      const errText = await res.text().catch(() => "");
      console.warn(
        `[warmap:llm] ${res.status} ${res.statusText} :: ${errText.slice(0, 200)}`,
      );
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      stats.errors++;
      return null;
    }

    stats.calls++;
    stats.totalLatencyMs += Date.now() - t0;

    const parsed = JSON.parse(content) as LlmExtractionResult;

    // Defensive normalization — the schema is strict but clip bad values just in case.
    parsed.severity = Math.max(0, Math.min(10, Math.round(parsed.severity)));
    parsed.locations = (parsed.locations ?? [])
      .filter((l) => l && typeof l.name === "string" && l.name.trim().length > 0)
      .map((l) => ({
        name: l.name.trim(),
        type: (LOCATION_TYPES as readonly string[]).includes(l.type)
          ? l.type
          : "other",
        country: (l.country ?? "").trim(),
        confidence: Math.max(0, Math.min(1, l.confidence ?? 0.5)),
      }));

    cachePut(id, parsed);
    return parsed;
  } catch (err) {
    stats.errors++;
    const name = (err as Error).name;
    if (name !== "AbortError") {
      console.warn(`[warmap:llm] error: ${(err as Error).message}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
