/**
 * Server sync for the three pieces of persisted state (tasks, checks, timer).
 *
 * localStorage stays the source of truth for rendering (instant, works offline);
 * this module mirrors changes to the backend and pulls remote changes in.
 *
 *  - First ever load on a fresh server session: local data is pushed up.
 *  - Load when the server already has data (another device): server wins.
 *  - Writes are debounced and batched into one PUT; failures retry with backoff.
 *  - Timer `endsAt` is shifted by the measured client/server clock offset so
 *    two devices with different clocks still agree on when the sprint ends.
 */

type Field = "tasks" | "checks" | "timer";
type Json = unknown;
type ServerState = {
  rev: number;
  tasks: Json;
  checks: Json;
  timer: { endsAt: number | null; left: number };
  serverTime: number;
};

const FIELD_BY_KEY: Record<string, Field> = {
  "ship2h.tasks": "tasks",
  "ship2h.checks": "checks",
  "ship2h.timer": "timer",
};
const FIELDS: Field[] = ["tasks", "checks", "timer"];
const TOKEN_KEY = "ship2h.token";
const DEBOUNCE_MS = 600;

const listeners = new Map<Field, (value: Json) => void>();
const latest: Partial<Record<Field, Json>> = {}; // newest local value per field
const pending: Partial<Record<Field, Json>> = {}; // not yet confirmed by the server
const lastSynced: Partial<Record<Field, string>> = {}; // JSON of last server-form value

let token: string | null = readToken();
let rev = 0;
let clockOffset = 0; // serverTime - clientTime (ms)
let ready = false;
let started = false;
let inflight = false;
let flushTimer: number | undefined;
let retryMs = 0;

function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(t: string) {
  token = t;
  try {
    window.localStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* private mode — session lasts until reload */
  }
}

async function http(method: string, path: string, body?: unknown) {
  const res = await fetch("/api" + path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as (ServerState & { token?: string }) | null;
  return { status: res.status, data };
}

/* ---- timer clock translation ---- */
function toServer(field: Field, value: Json): Json {
  if (field !== "timer") return value;
  const t = value as { endsAt: number | null; left: number };
  return { ...t, endsAt: t.endsAt === null ? null : Math.round(t.endsAt + clockOffset) };
}

function fromServer(field: Field, value: Json): Json {
  if (field !== "timer") return value;
  const t = value as { endsAt: number | null; left: number };
  return { ...t, endsAt: t.endsAt === null ? null : Math.round(t.endsAt - clockOffset) };
}

/** Make a server-owned state visible to the UI, skipping fields that already match. */
function applyServer(s: ServerState) {
  clockOffset = s.serverTime - Date.now();
  rev = s.rev;
  for (const f of FIELDS) {
    const serverJson = JSON.stringify(s[f]);
    delete pending[f];
    if (lastSynced[f] === serverJson) continue;
    lastSynced[f] = serverJson;
    const local = fromServer(f, s[f]);
    latest[f] = local;
    listeners.get(f)?.(local);
  }
}

async function openSession(): Promise<ServerState> {
  let r = token ? await http("GET", "/state") : { status: 401, data: null };
  if (r.status === 401) {
    r = await http("POST", "/sessions");
    if (r.status !== 201 || !r.data?.token) throw new Error("could not create session");
    saveToken(r.data.token);
    for (const f of FIELDS) delete lastSynced[f]; // fresh server: everything is unsynced
  }
  if (!r.data || (r.status !== 200 && r.status !== 201)) throw new Error(`state: HTTP ${r.status}`);
  return r.data;
}

async function init() {
  if (started) return;
  started = true;
  try {
    const s = await openSession();
    clockOffset = s.serverTime - Date.now();
    if (s.rev > 0) {
      applyServer(s); // another device (or an earlier visit) has data: server wins
    } else {
      rev = s.rev; // empty server session: push what this browser already has
      for (const f of FIELDS) if (latest[f] !== undefined) pending[f] = latest[f];
    }
    ready = true;
    retryMs = 0;
    schedule(0);
  } catch {
    started = false;
    retry();
  }
}

function schedule(ms: number) {
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flush, ms);
}

function retry() {
  retryMs = Math.min(30_000, retryMs ? retryMs * 2 : 2_000);
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => (started ? flush() : init()), retryMs);
}

async function flush() {
  const fields = FIELDS.filter((f) => pending[f] !== undefined);
  if (!ready || inflight || fields.length === 0) return;
  inflight = true;
  const sent: Partial<Record<Field, Json>> = {};
  const body: Record<string, Json> = {};
  for (const f of fields) {
    sent[f] = pending[f];
    body[f] = toServer(f, pending[f]);
  }
  try {
    const r = await http("PUT", "/state", body);
    if (r.status === 401) {
      // session expired or wiped server-side: start a new one and re-upload everything we know
      ready = false;
      token = null;
      const s = await openSession();
      clockOffset = s.serverTime - Date.now();
      rev = s.rev;
      for (const f of FIELDS) if (latest[f] !== undefined) pending[f] = latest[f];
      ready = true;
      inflight = false;
      return schedule(0);
    }
    if (r.status !== 200 || !r.data) throw new Error(`PUT: HTTP ${r.status}`);
    rev = r.data.rev;
    clockOffset = r.data.serverTime - Date.now();
    for (const f of fields) {
      lastSynced[f] = JSON.stringify(body[f]);
      if (pending[f] === sent[f]) delete pending[f]; // unchanged while in flight
    }
    retryMs = 0;
    inflight = false;
    if (FIELDS.some((f) => pending[f] !== undefined)) schedule(DEBOUNCE_MS);
  } catch {
    inflight = false;
    retry();
  }
}

/** Pick up changes made on another device when the tab regains focus. */
async function pull() {
  if (!ready || inflight || FIELDS.some((f) => pending[f] !== undefined)) return;
  try {
    const r = await http("GET", "/state");
    if (r.status === 200 && r.data && r.data.rev !== rev) applyServer(r.data);
  } catch {
    /* offline — nothing to do */
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pull();
  });
  window.addEventListener("online", () => (started ? schedule(0) : init()));
}

/* ---- public API used by usePersistentState ---- */

/** Register a callback that receives remote values for `key`. Returns an unsubscribe fn. */
export function subscribe(key: string, apply: (value: Json) => void) {
  const f = FIELD_BY_KEY[key];
  if (!f) return () => {};
  listeners.set(f, apply);
  init();
  return () => {
    if (listeners.get(f) === apply) listeners.delete(f);
  };
}

/** Report a new local value for `key`; it is mirrored to the server shortly after. */
export function push(key: string, value: Json) {
  const f = FIELD_BY_KEY[key];
  if (!f) return;
  latest[f] = value;
  if (lastSynced[f] === JSON.stringify(toServer(f, value))) {
    delete pending[f]; // echo of something the server already has
    return;
  }
  pending[f] = value;
  if (ready) schedule(DEBOUNCE_MS);
}
