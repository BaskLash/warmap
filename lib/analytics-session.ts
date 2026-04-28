// Per-tab session identity. Stored in sessionStorage so reloads keep the same
// id but a new tab gets a fresh one — that's the granularity we want for
// behavioural reconstruction.

const SESSION_ID_KEY = "warmap_session_id";
const SESSION_START_KEY = "warmap_session_start";

function safeRandomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for ancient browsers or non-secure contexts.
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = safeRandomUUID();
    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return "";
  }
}

export function getSessionStart(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const existing = window.sessionStorage.getItem(SESSION_START_KEY);
    if (existing) {
      const n = Number(existing);
      if (Number.isFinite(n)) return n;
    }
    const t = Date.now();
    window.sessionStorage.setItem(SESSION_START_KEY, String(t));
    return t;
  } catch {
    return Date.now();
  }
}

export function isFirstSessionVisit(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_ID_KEY) === null;
  } catch {
    return false;
  }
}
