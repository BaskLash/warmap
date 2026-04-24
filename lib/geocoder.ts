import type { Confidence, GeoLocation } from "./types";
import { dbGetGeo, dbPutGeo } from "./db";
import { lookupByName, lookupCountry } from "./gazetteer";
import type { ExtractedLocation, LocationType } from "./llm-extractor";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_MIN_INTERVAL_MS = 1100; // Nominatim usage policy: max 1 req/sec
const NOMINATIM_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE = 5_000;

interface NominatimCacheEntry {
  coords: { lat: number; lng: number; displayName: string } | null;
  ts: number;
}

interface NominatimSearchItem {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  type?: string;
  category?: string;
  class?: string;
}

const geocodeCache = new Map<string, NominatimCacheEntry>();
let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatimAt = 0;

function cacheGet(key: string): NominatimCacheEntry | null {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }
  return entry;
}

function cachePut(key: string, value: NominatimCacheEntry) {
  geocodeCache.set(key, value);
  if (geocodeCache.size > MAX_CACHE) {
    const first = geocodeCache.keys().next().value;
    if (first !== undefined) geocodeCache.delete(first);
  }
}

// Nominatim results are not always trustworthy for ambiguous short names.
// We reject results whose importance is too low for free-text queries.
function isNominatimHitAcceptable(item: NominatimSearchItem): boolean {
  if (item.importance != null && item.importance < 0.25) return false;
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false; // garbage 0,0
  return true;
}

async function callNominatim(
  query: string,
  country?: string,
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    "accept-language": "en",
    addressdetails: "0",
  });
  if (country) params.set("countrycodes", countryNameToCode(country) ?? "");

  const url = `${NOMINATIM_URL}?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "warmap/1.0 (real-time conflict monitor; contact: olivier.luethy@gmx.net)",
        "Accept-Language": "en",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as NominatimSearchItem[];
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0];
    if (!isNominatimHitAcceptable(hit)) return null;
    return {
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      displayName: hit.display_name,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Serialize Nominatim requests + enforce 1 req/sec throttle.
// Three-tier cache:
//   1. In-process LRU (hot path, microseconds)
//   2. SQLite (persists across `npm run dev` restarts)
//   3. Nominatim (last resort, rate-limited)
async function throttledNominatim(
  query: string,
  country?: string,
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const key = `${query}|${country ?? ""}`.toLowerCase();
  const mem = cacheGet(key);
  if (mem) return mem.coords;

  const persisted = dbGetGeo(key);
  if (persisted) {
    const coords =
      persisted.lat != null && persisted.lng != null
        ? {
            lat: persisted.lat,
            lng: persisted.lng,
            displayName: persisted.displayName ?? "",
          }
        : null;
    cachePut(key, { coords, ts: Date.now() });
    return coords;
  }

  const p = nominatimQueue.then(async () => {
    const wait = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const coords = await callNominatim(query, country);
    lastNominatimAt = Date.now();
    cachePut(key, { coords, ts: Date.now() });
    try {
      dbPutGeo(key, coords);
    } catch (err) {
      console.warn(`[warmap:geo] db write failed: ${(err as Error).message}`);
    }
    return coords;
  });
  nominatimQueue = p.catch(() => undefined);
  return p;
}

const TYPE_CONFIDENCE: Record<LocationType, Confidence> = {
  city: "high",
  base: "high",
  strategic_waterway: "high",
  region: "medium",
  sea: "medium",
  country: "low",
  other: "medium",
};

const TYPE_WEIGHT: Record<LocationType, number> = {
  city: 4,
  base: 4,
  strategic_waterway: 3.8,
  region: 2.5,
  sea: 2.2,
  country: 1,
  other: 1.5,
};

export interface GeocodeOptions {
  /** When true, don't hit Nominatim (gazetteer-only). Useful for tests/offline. */
  gazetteerOnly?: boolean;
}

/**
 * Resolve a single extracted location to coordinates.
 *
 * Priority:
 *   1. Custom gazetteer (instant; covers Strait of Hormuz, Bab el-Mandeb, etc.)
 *   2. Nominatim (rate-limited, cached)
 *   3. Country-level fallback via gazetteer
 *   4. null
 */
export async function geocodeOne(
  loc: ExtractedLocation,
  opts: GeocodeOptions = {},
): Promise<GeoLocation | null> {
  if (!loc.name) return null;

  // 1. Gazetteer by name.
  const gaz = lookupByName(loc.name);
  if (gaz) return gaz;

  // 1b. Gazetteer by name with country appended (helps with ambiguous city names).
  if (loc.country) {
    const combined = lookupByName(`${loc.name} ${loc.country}`);
    if (combined) return combined;
  }

  // 2. Nominatim (unless disabled).
  if (!opts.gazetteerOnly) {
    const query =
      loc.country && !loc.name.toLowerCase().includes(loc.country.toLowerCase())
        ? `${loc.name}, ${loc.country}`
        : loc.name;
    const hit = await throttledNominatim(query, loc.country);
    if (hit) {
      return {
        name: loc.name,
        country: loc.country || "",
        lat: hit.lat,
        lng: hit.lng,
        confidence: TYPE_CONFIDENCE[loc.type],
      };
    }
  }

  // 3. Country-level fallback from gazetteer.
  if (loc.country) {
    const country = lookupCountry(loc.country);
    if (country) {
      return { ...country, confidence: "low" };
    }
  }

  return null;
}

/**
 * Resolve a list of extracted locations, then rank and pick the best one.
 * "Best" = highest (LLM confidence × type specificity).
 */
export async function resolveBestLocation(
  locations: ExtractedLocation[],
  opts: GeocodeOptions = {},
): Promise<GeoLocation | null> {
  if (!locations || locations.length === 0) return null;

  // Sort by LLM confidence × type weight so we try the best candidates first
  // and short-circuit on a confident gazetteer hit.
  const ranked = [...locations].sort(
    (a, b) => b.confidence * TYPE_WEIGHT[b.type] - a.confidence * TYPE_WEIGHT[a.type],
  );

  for (const loc of ranked) {
    const resolved = await geocodeOne(loc, opts);
    if (resolved) return resolved;
  }
  return null;
}

// Minimal English-name → ISO-3166 alpha-2 map for biasing Nominatim queries
// to the right country. Missing entries fall back to unbiased search.
function countryNameToCode(country: string): string | null {
  const key = country.toLowerCase().trim();
  const map: Record<string, string> = {
    ukraine: "ua",
    russia: "ru",
    belarus: "by",
    moldova: "md",
    israel: "il",
    palestine: "ps",
    lebanon: "lb",
    syria: "sy",
    iraq: "iq",
    iran: "ir",
    yemen: "ye",
    egypt: "eg",
    sudan: "sd",
    somalia: "so",
    ethiopia: "et",
    eritrea: "er",
    mali: "ml",
    "burkina faso": "bf",
    niger: "ne",
    nigeria: "ng",
    chad: "td",
    drc: "cd",
    congo: "cd",
    "democratic republic of the congo": "cd",
    rwanda: "rw",
    burundi: "bi",
    myanmar: "mm",
    burma: "mm",
    afghanistan: "af",
    pakistan: "pk",
    india: "in",
    taiwan: "tw",
    "north korea": "kp",
    "south korea": "kr",
    haiti: "ht",
    venezuela: "ve",
    guyana: "gy",
    mexico: "mx",
    armenia: "am",
    azerbaijan: "az",
    georgia: "ge",
    turkey: "tr",
    "saudi arabia": "sa",
    uae: "ae",
    "united arab emirates": "ae",
    qatar: "qa",
    bahrain: "bh",
    kuwait: "kw",
    oman: "om",
    jordan: "jo",
    libya: "ly",
    tunisia: "tn",
    algeria: "dz",
    morocco: "ma",
    cyprus: "cy",
    greece: "gr",
  };
  return map[key] ?? null;
}
