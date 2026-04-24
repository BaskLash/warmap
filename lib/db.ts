import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Single file-backed SQLite database used for:
//   - LLM extraction cache (keyed by RSS item.id)
//   - Nominatim geocoder cache
//   - Persisted event list (re-hydrated on boot so restarts don't spam the LLM)
//
// better-sqlite3 is a synchronous driver — that's fine here: writes happen
// during background fetcher cycles (already off the request path) and DB
// operations are sub-millisecond. Sync is actually easier to reason about
// than async for this layer.

const DB_DIR = path.resolve(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "warmap.db");

interface DbHandles {
  db: Database.Database;
  stmt: {
    getLlm: Database.Statement<[string]>;
    putLlm: Database.Statement<[string, string, number]>;
    countLlm: Database.Statement;

    getGeo: Database.Statement<[string]>;
    putGeo: Database.Statement<[string, number | null, number | null, string | null, number]>;
    countGeo: Database.Statement;

    allEvents: Database.Statement;
    putEvent: Database.Statement<[string, string, number, number]>;
    pruneEvents: Database.Statement<[number]>;
    countEvents: Database.Statement;
  };
}

const GLOBAL_KEY = "__warmap_db__";
type GlobalWithDb = typeof globalThis & { [GLOBAL_KEY]?: DbHandles };
const g = globalThis as GlobalWithDb;

function open(): DbHandles {
  if (g[GLOBAL_KEY]) return g[GLOBAL_KEY]!;

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_cache (
      item_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS geocode_cache (
      query TEXT PRIMARY KEY,
      lat REAL,
      lng REAL,
      display_name TEXT,
      ts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      published_at INTEGER NOT NULL,
      received_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS events_published_at_idx ON events(published_at DESC);
  `);

  const handles: DbHandles = {
    db,
    stmt: {
      getLlm: db.prepare("SELECT payload FROM llm_cache WHERE item_id = ?"),
      putLlm: db.prepare(
        "INSERT OR REPLACE INTO llm_cache(item_id, payload, ts) VALUES (?, ?, ?)",
      ),
      countLlm: db.prepare("SELECT COUNT(*) AS n FROM llm_cache"),

      getGeo: db.prepare(
        "SELECT lat, lng, display_name FROM geocode_cache WHERE query = ?",
      ),
      putGeo: db.prepare(
        "INSERT OR REPLACE INTO geocode_cache(query, lat, lng, display_name, ts) VALUES (?, ?, ?, ?, ?)",
      ),
      countGeo: db.prepare("SELECT COUNT(*) AS n FROM geocode_cache"),

      allEvents: db.prepare(
        "SELECT payload FROM events ORDER BY published_at DESC LIMIT 1000",
      ),
      putEvent: db.prepare(
        "INSERT OR REPLACE INTO events(id, payload, published_at, received_at) VALUES (?, ?, ?, ?)",
      ),
      pruneEvents: db.prepare("DELETE FROM events WHERE published_at < ?"),
      countEvents: db.prepare("SELECT COUNT(*) AS n FROM events"),
    },
  };

  g[GLOBAL_KEY] = handles;
  return handles;
}

export function initDb(): void {
  open();
}

export function getDbStats() {
  const h = open();
  return {
    llm: (h.stmt.countLlm.get() as { n: number }).n,
    geocode: (h.stmt.countGeo.get() as { n: number }).n,
    events: (h.stmt.countEvents.get() as { n: number }).n,
  };
}

// ── LLM cache ──
export function dbGetLlm<T>(itemId: string): T | null {
  const row = open().stmt.getLlm.get(itemId) as { payload: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

export function dbPutLlm<T>(itemId: string, value: T): void {
  const payload = JSON.stringify(value);
  open().stmt.putLlm.run(itemId, payload, Date.now());
}

// ── Geocode cache ──
export interface GeocodeCacheHit {
  lat: number | null;
  lng: number | null;
  displayName: string | null;
}

export function dbGetGeo(query: string): GeocodeCacheHit | null {
  const row = open().stmt.getGeo.get(query.toLowerCase()) as
    | { lat: number | null; lng: number | null; display_name: string | null }
    | undefined;
  if (!row) return null;
  return {
    lat: row.lat,
    lng: row.lng,
    displayName: row.display_name,
  };
}

export function dbPutGeo(
  query: string,
  hit: { lat: number; lng: number; displayName: string } | null,
): void {
  open().stmt.putGeo.run(
    query.toLowerCase(),
    hit ? hit.lat : null,
    hit ? hit.lng : null,
    hit ? hit.displayName : null,
    Date.now(),
  );
}

// ── Events ──
export function dbLoadEvents<T>(): T[] {
  const rows = open().stmt.allEvents.all() as Array<{ payload: string }>;
  const out: T[] = [];
  for (const r of rows) {
    try {
      out.push(JSON.parse(r.payload) as T);
    } catch {
      // corrupt row — skip
    }
  }
  return out;
}

export function dbPutEvent(
  id: string,
  payload: object,
  publishedAt: number,
  receivedAt: number,
): void {
  open().stmt.putEvent.run(id, JSON.stringify(payload), publishedAt, receivedAt);
}

export function dbPruneEvents(olderThanMs: number): number {
  const cutoff = Date.now() - olderThanMs;
  return open().stmt.pruneEvents.run(cutoff).changes;
}
