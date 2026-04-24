import type { WarEvent } from "./types";

type Listener = (event: WarEvent) => void;

const MAX_EVENTS = 500;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

class EventStore {
  private events: WarEvent[] = [];
  private byId = new Map<string, WarEvent>();
  private listeners = new Set<Listener>();

  add(event: WarEvent): boolean {
    if (this.byId.has(event.id)) return false;
    this.byId.set(event.id, event);
    this.events.push(event);
    // Keep newest first for cheap reads
    this.events.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    this.prune();
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
    return true;
  }

  list(): WarEvent[] {
    return [...this.events];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private prune() {
    const cutoff = Date.now() - MAX_AGE_MS;
    this.events = this.events.filter((e) => {
      const t = new Date(e.publishedAt).getTime();
      if (t < cutoff) {
        this.byId.delete(e.id);
        return false;
      }
      return true;
    });
    if (this.events.length > MAX_EVENTS) {
      const removed = this.events.splice(MAX_EVENTS);
      for (const r of removed) this.byId.delete(r.id);
    }
  }
}

const GLOBAL_KEY = "__warmap_event_store__";
type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: EventStore };
const g = globalThis as GlobalWithStore;

export const eventStore: EventStore = g[GLOBAL_KEY] ?? (g[GLOBAL_KEY] = new EventStore());
