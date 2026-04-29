import type { Confidence, GeoLocation } from "./types";
import { dbGetGeo, dbPutGeo } from "./db";
import { lookupByName, lookupCountry } from "./gazetteer";
import type { ExtractedLocation, LocationType } from "./llm-extractor";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_MIN_INTERVAL_MS = 1100; // Nominatim usage policy: max 1 req/sec
const NOMINATIM_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CACHE = 5_000;

// Bumping this prefix invalidates every previously cached geocode result —
// in-memory and SQLite alike. Increment when the accept/reject rules below
// change so stale "wrong" coordinates can't pin themselves to the cache.
const GEOCODER_VERSION = "v2";

// Reject Nominatim hits whose bbox spans more than this many degrees on either
// axis when the LLM said the location was a city or named base. Country-sized
// returns are the dominant misfire mode for ambiguous short names.
const SPECIFIC_TYPE_BBOX_LIMIT_DEG = 3;

interface NominatimCacheEntry {
  coords: NominatimHit | null;
  ts: number;
}

interface NominatimHit {
  lat: number;
  lng: number;
  displayName: string;
  countryCode?: string;
  bboxSpanLatDeg?: number;
  bboxSpanLngDeg?: number;
  importance?: number;
}

interface NominatimSearchItem {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  type?: string;
  category?: string;
  class?: string;
  boundingbox?: [string, string, string, string];
  address?: {
    country_code?: string;
    country?: string;
  };
}

export interface GeocodeContext {
  /** RSS item id, threaded through to logs for prod correlation. */
  itemId?: string;
  /** Logical role: primary marker, vector origin, vector target. */
  source?: "primary" | "vector-origin" | "vector-target";
}

const geocodeCache = new Map<string, NominatimCacheEntry>();
let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatimAt = 0;

function cacheKey(query: string, country?: string): string {
  return `${GEOCODER_VERSION}|${query}|${country ?? ""}`.toLowerCase();
}

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

function logLine(parts: Record<string, string | number | undefined>): string {
  const segments: string[] = [];
  for (const [k, v] of Object.entries(parts)) {
    if (v === undefined || v === "") continue;
    const s = typeof v === "string" && /[\s"]/.test(v) ? `"${v.replace(/"/g, '\\"')}"` : String(v);
    segments.push(`${k}=${s}`);
  }
  return `[warmap:geo] ${segments.join(" ")}`;
}

function isNominatimHitWellFormed(item: NominatimSearchItem): boolean {
  if (item.importance != null && item.importance < 0.25) return false;
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false; // garbage 0,0
  return true;
}

function bboxSpan(bb: [string, string, string, string] | undefined): {
  lat: number;
  lng: number;
} | null {
  if (!bb || bb.length !== 4) return null;
  const south = Number(bb[0]);
  const north = Number(bb[1]);
  const west = Number(bb[2]);
  const east = Number(bb[3]);
  if (![south, north, west, east].every(Number.isFinite)) return null;
  return { lat: Math.abs(north - south), lng: Math.abs(east - west) };
}

async function callNominatim(
  query: string,
  country?: string,
): Promise<NominatimHit | null> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    "accept-language": "en",
    addressdetails: "1",
  });
  if (country) {
    const cc = countryNameToCode(country);
    if (cc) params.set("countrycodes", cc);
  }

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
    if (!isNominatimHitWellFormed(hit)) return null;
    const span = bboxSpan(hit.boundingbox);
    return {
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      displayName: hit.display_name,
      countryCode: hit.address?.country_code?.toLowerCase(),
      bboxSpanLatDeg: span?.lat,
      bboxSpanLngDeg: span?.lng,
      importance: hit.importance,
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
  country: string | undefined,
): Promise<NominatimHit | null> {
  const key = cacheKey(query, country);
  const mem = cacheGet(key);
  if (mem) return mem.coords;

  const persisted = dbGetGeo(key);
  if (persisted) {
    const coords: NominatimHit | null =
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
      dbPutGeo(
        key,
        coords ? { lat: coords.lat, lng: coords.lng, displayName: coords.displayName } : null,
      );
    } catch (err) {
      console.warn(`[warmap:geo] db write failed: ${(err as Error).message}`);
    }
    return coords;
  });
  nominatimQueue = p.catch(() => undefined);
  return p;
}

// LLM-stated type → starting confidence for gazetteer hits. Nominatim hits
// reassess confidence below based on the actual response signal.
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

const SPECIFIC_TYPES: ReadonlySet<LocationType> = new Set(["city", "base"]);

export interface GeocodeOptions {
  /** When true, don't hit Nominatim (gazetteer-only). Useful for tests/offline. */
  gazetteerOnly?: boolean;
}

/**
 * Resolve a single extracted location to coordinates.
 *
 * Priority:
 *   1. Custom gazetteer (instant; covers Strait of Hormuz, Bab el-Mandeb, etc.)
 *   2. Nominatim (rate-limited, cached) with country-match + bbox-size guards
 *   3. Country-level fallback via gazetteer
 *   4. null
 */
export async function geocodeOne(
  loc: ExtractedLocation,
  opts: GeocodeOptions = {},
  ctx: GeocodeContext = {},
): Promise<GeoLocation | null> {
  if (!loc.name) return null;

  // 1. Gazetteer by name.
  const gaz = lookupByName(loc.name);
  if (gaz) {
    console.log(
      logLine({
        item: ctx.itemId,
        role: ctx.source,
        name: loc.name,
        llm_country: loc.country,
        type: loc.type,
        path: "gazetteer",
        result: "accepted",
        lat: gaz.lat.toFixed(4),
        lng: gaz.lng.toFixed(4),
        confidence: gaz.confidence,
      }),
    );
    return gaz;
  }

  // 1b. Gazetteer by name with country appended (helps with ambiguous city names).
  if (loc.country) {
    const combined = lookupByName(`${loc.name} ${loc.country}`);
    if (combined) {
      console.log(
        logLine({
          item: ctx.itemId,
          role: ctx.source,
          name: loc.name,
          llm_country: loc.country,
          type: loc.type,
          path: "gazetteer-combined",
          result: "accepted",
          lat: combined.lat.toFixed(4),
          lng: combined.lng.toFixed(4),
          confidence: combined.confidence,
        }),
      );
      return combined;
    }
  }

  // 2. Nominatim (unless disabled).
  if (!opts.gazetteerOnly) {
    const query =
      loc.country && !loc.name.toLowerCase().includes(loc.country.toLowerCase())
        ? `${loc.name}, ${loc.country}`
        : loc.name;
    const hit = await throttledNominatim(query, loc.country);
    if (hit) {
      const expectedCc = loc.country ? countryNameToCode(loc.country) : null;
      const bboxFlag =
        SPECIFIC_TYPES.has(loc.type) &&
        ((hit.bboxSpanLatDeg ?? 0) > SPECIFIC_TYPE_BBOX_LIMIT_DEG ||
          (hit.bboxSpanLngDeg ?? 0) > SPECIFIC_TYPE_BBOX_LIMIT_DEG);
      const countryMismatch =
        Boolean(expectedCc && hit.countryCode && expectedCc !== hit.countryCode);

      let rejection: string | null = null;
      if (countryMismatch) rejection = "country-mismatch";
      else if (bboxFlag) rejection = "bbox-too-large";

      if (rejection) {
        console.warn(
          logLine({
            item: ctx.itemId,
            role: ctx.source,
            name: loc.name,
            llm_country: loc.country,
            type: loc.type,
            path: "nominatim",
            result: "rejected",
            reason: rejection,
            nominatim_country: hit.countryCode,
            bbox_lat: hit.bboxSpanLatDeg?.toFixed(2),
            bbox_lng: hit.bboxSpanLngDeg?.toFixed(2),
            importance: hit.importance?.toFixed(2),
            display: hit.displayName,
          }),
        );
        // fall through to country fallback
      } else {
        const confidence = nominatimConfidence(loc, hit, expectedCc);
        console.log(
          logLine({
            item: ctx.itemId,
            role: ctx.source,
            name: loc.name,
            llm_country: loc.country,
            type: loc.type,
            path: "nominatim",
            result: "accepted",
            lat: hit.lat.toFixed(4),
            lng: hit.lng.toFixed(4),
            nominatim_country: hit.countryCode,
            bbox_lat: hit.bboxSpanLatDeg?.toFixed(2),
            bbox_lng: hit.bboxSpanLngDeg?.toFixed(2),
            importance: hit.importance?.toFixed(2),
            confidence,
          }),
        );
        return {
          name: loc.name,
          country: loc.country || "",
          lat: hit.lat,
          lng: hit.lng,
          confidence,
        };
      }
    }
  }

  // 3. Country-level fallback from gazetteer.
  if (loc.country) {
    const country = lookupCountry(loc.country);
    if (country) {
      console.log(
        logLine({
          item: ctx.itemId,
          role: ctx.source,
          name: loc.name,
          llm_country: loc.country,
          type: loc.type,
          path: "country-fallback",
          result: "accepted",
          lat: country.lat.toFixed(4),
          lng: country.lng.toFixed(4),
          confidence: "low",
        }),
      );
      return { ...country, confidence: "low" };
    }
  }

  console.warn(
    logLine({
      item: ctx.itemId,
      role: ctx.source,
      name: loc.name,
      llm_country: loc.country,
      type: loc.type,
      path: "exhausted",
      result: "failed",
    }),
  );
  return null;
}

/**
 * Combine LLM type, Nominatim country agreement, and bbox tightness into a
 * single Confidence label. Replaces the static TYPE_CONFIDENCE table for
 * Nominatim results so the badge in the UI tracks actual signal quality.
 */
function nominatimConfidence(
  loc: ExtractedLocation,
  hit: NominatimHit,
  expectedCc: string | null,
): Confidence {
  const baseline = TYPE_CONFIDENCE[loc.type];
  const countryAgrees = Boolean(expectedCc && hit.countryCode && expectedCc === hit.countryCode);
  const tightBbox =
    (hit.bboxSpanLatDeg ?? 99) <= 1 && (hit.bboxSpanLngDeg ?? 99) <= 1;

  if (SPECIFIC_TYPES.has(loc.type)) {
    if (countryAgrees && tightBbox) return "high";
    if (countryAgrees) return "medium";
    // Country agreement couldn't be verified (no expected code, or no
    // address.country_code returned) — downgrade to medium even for cities.
    return "medium";
  }
  return baseline;
}

/**
 * Resolve a list of extracted locations, then rank and pick the best one.
 * "Best" = highest (LLM confidence × type specificity).
 */
export async function resolveBestLocation(
  locations: ExtractedLocation[],
  opts: GeocodeOptions = {},
  ctx: GeocodeContext = {},
): Promise<GeoLocation | null> {
  if (!locations || locations.length === 0) return null;

  // Sort by LLM confidence × type weight so we try the best candidates first
  // and short-circuit on a confident gazetteer hit.
  const ranked = [...locations].sort(
    (a, b) => b.confidence * TYPE_WEIGHT[b.type] - a.confidence * TYPE_WEIGHT[a.type],
  );

  for (const loc of ranked) {
    const resolved = await geocodeOne(loc, opts, ctx);
    if (resolved) return resolved;
  }
  return null;
}

// English country/territory name → ISO-3166 alpha-2. Used both to bias
// Nominatim queries and to verify the returned `address.country_code`.
//
// Coverage strategy: every country named in the gazetteer + the long-tail
// territories that show up in conflict reporting (Greenland, Sri Lanka, Korea,
// Bangladesh, Western Sahara, etc.). Missing entries return null and skip
// country-bias / country-verification — strictly looser than rejecting.
const COUNTRY_CODE_MAP: Record<string, string> = {
  // Europe
  ukraine: "ua",
  russia: "ru",
  belarus: "by",
  moldova: "md",
  poland: "pl",
  germany: "de",
  france: "fr",
  spain: "es",
  portugal: "pt",
  italy: "it",
  greece: "gr",
  cyprus: "cy",
  turkey: "tr",
  romania: "ro",
  bulgaria: "bg",
  serbia: "rs",
  croatia: "hr",
  bosnia: "ba",
  "bosnia and herzegovina": "ba",
  kosovo: "xk",
  albania: "al",
  "north macedonia": "mk",
  macedonia: "mk",
  slovenia: "si",
  slovakia: "sk",
  czechia: "cz",
  "czech republic": "cz",
  hungary: "hu",
  austria: "at",
  switzerland: "ch",
  netherlands: "nl",
  belgium: "be",
  luxembourg: "lu",
  ireland: "ie",
  "united kingdom": "gb",
  uk: "gb",
  "great britain": "gb",
  britain: "gb",
  england: "gb",
  scotland: "gb",
  wales: "gb",
  "northern ireland": "gb",
  iceland: "is",
  norway: "no",
  sweden: "se",
  finland: "fi",
  denmark: "dk",
  greenland: "gl",
  estonia: "ee",
  latvia: "lv",
  lithuania: "lt",
  "faroe islands": "fo",

  // Middle East / North Africa
  israel: "il",
  palestine: "ps",
  "palestinian territories": "ps",
  lebanon: "lb",
  syria: "sy",
  iraq: "iq",
  iran: "ir",
  yemen: "ye",
  egypt: "eg",
  jordan: "jo",
  "saudi arabia": "sa",
  uae: "ae",
  "united arab emirates": "ae",
  qatar: "qa",
  bahrain: "bh",
  kuwait: "kw",
  oman: "om",
  libya: "ly",
  tunisia: "tn",
  algeria: "dz",
  morocco: "ma",
  "western sahara": "eh",

  // Sub-Saharan Africa
  sudan: "sd",
  "south sudan": "ss",
  somalia: "so",
  ethiopia: "et",
  eritrea: "er",
  djibouti: "dj",
  kenya: "ke",
  uganda: "ug",
  tanzania: "tz",
  mali: "ml",
  "burkina faso": "bf",
  niger: "ne",
  nigeria: "ng",
  chad: "td",
  cameroon: "cm",
  "central african republic": "cf",
  car: "cf",
  drc: "cd",
  congo: "cd",
  "democratic republic of the congo": "cd",
  "republic of the congo": "cg",
  rwanda: "rw",
  burundi: "bi",
  "south africa": "za",
  mozambique: "mz",
  madagascar: "mg",
  zambia: "zm",
  zimbabwe: "zw",
  angola: "ao",
  namibia: "na",
  botswana: "bw",
  ghana: "gh",
  senegal: "sn",
  mauritania: "mr",
  liberia: "lr",
  "sierra leone": "sl",
  "ivory coast": "ci",
  "côte d'ivoire": "ci",
  "cote d'ivoire": "ci",

  // Asia
  myanmar: "mm",
  burma: "mm",
  afghanistan: "af",
  pakistan: "pk",
  india: "in",
  bangladesh: "bd",
  "sri lanka": "lk",
  nepal: "np",
  bhutan: "bt",
  maldives: "mv",
  china: "cn",
  taiwan: "tw",
  "north korea": "kp",
  "south korea": "kr",
  japan: "jp",
  mongolia: "mn",
  vietnam: "vn",
  laos: "la",
  cambodia: "kh",
  thailand: "th",
  malaysia: "my",
  singapore: "sg",
  indonesia: "id",
  philippines: "ph",
  brunei: "bn",
  "east timor": "tl",
  "timor-leste": "tl",
  kazakhstan: "kz",
  kyrgyzstan: "kg",
  tajikistan: "tj",
  turkmenistan: "tm",
  uzbekistan: "uz",

  // Caucasus
  armenia: "am",
  azerbaijan: "az",
  georgia: "ge",

  // Americas
  haiti: "ht",
  venezuela: "ve",
  guyana: "gy",
  suriname: "sr",
  colombia: "co",
  ecuador: "ec",
  peru: "pe",
  bolivia: "bo",
  brazil: "br",
  argentina: "ar",
  chile: "cl",
  paraguay: "py",
  uruguay: "uy",
  mexico: "mx",
  "united states": "us",
  usa: "us",
  "united states of america": "us",
  canada: "ca",
  cuba: "cu",
  "dominican republic": "do",
  jamaica: "jm",
  guatemala: "gt",
  honduras: "hn",
  nicaragua: "ni",
  "el salvador": "sv",
  "costa rica": "cr",
  panama: "pa",

  // Oceania
  australia: "au",
  "new zealand": "nz",
  "papua new guinea": "pg",
  fiji: "fj",
};

function countryNameToCode(country: string): string | null {
  const key = country.toLowerCase().trim();
  return COUNTRY_CODE_MAP[key] ?? null;
}
