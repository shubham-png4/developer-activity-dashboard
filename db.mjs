import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const SPRINT_TOTAL_SEC = 120 * 60;
const SESSION_TTL_MS = 90 * 24 * 3600 * 1000;

const hash = (token) => createHash("sha256").update(token).digest("hex");

const DEFAULT_TIMER = { endsAt: null, left: SPRINT_TOTAL_SEC };

export function openDb(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      rev        INTEGER NOT NULL DEFAULT 0,
      tasks      TEXT NOT NULL DEFAULT '{}',
      checks     TEXT NOT NULL DEFAULT '{}',
      timer      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_updated ON sessions(updated_at);
  `);

  const q = {
    insert: db.prepare(
      "INSERT INTO sessions (token_hash, created_at, updated_at, timer) VALUES (?, ?, ?, ?)",
    ),
    get: db.prepare("SELECT * FROM sessions WHERE token_hash = ?"),
    update: db.prepare(
      "UPDATE sessions SET tasks = ?, checks = ?, timer = ?, rev = rev + 1, updated_at = ? WHERE token_hash = ?",
    ),
    touch: db.prepare("UPDATE sessions SET updated_at = ? WHERE token_hash = ?"),
    remove: db.prepare("DELETE FROM sessions WHERE token_hash = ?"),
    purge: db.prepare("DELETE FROM sessions WHERE updated_at < ?"),
    count: db.prepare("SELECT COUNT(*) AS n FROM sessions"),
  };

  const toState = (row) => ({
    rev: row.rev,
    tasks: JSON.parse(row.tasks),
    checks: JSON.parse(row.checks),
    timer: JSON.parse(row.timer),
    updatedAt: row.updated_at,
  });

  return {
    createSession() {
      const token = randomBytes(32).toString("base64url");
      const now = Date.now();
      q.insert.run(hash(token), now, now, JSON.stringify(DEFAULT_TIMER));
      return token;
    },
    getState(token) {
      const row = q.get.get(hash(token));
      if (!row) return null;
      // Sliding expiry: only write once a day to avoid a write per read.
      if (Date.now() - row.updated_at > 24 * 3600 * 1000) {
        q.touch.run(Date.now(), row.token_hash);
      }
      return toState(row);
    },
    /** Merge a validated partial update. Returns the new state, or null if the session is unknown. */
    patchState(token, patch) {
      const h = hash(token);
      const row = q.get.get(h);
      if (!row) return null;
      const cur = toState(row);
      q.update.run(
        JSON.stringify(patch.tasks ?? cur.tasks),
        JSON.stringify(patch.checks ?? cur.checks),
        JSON.stringify(patch.timer ?? cur.timer),
        Date.now(),
        h,
      );
      return toState(q.get.get(h));
    },
    resetState(token) {
      return this.patchState(token, { tasks: {}, checks: {}, timer: DEFAULT_TIMER });
    },
    deleteSession(token) {
      return q.remove.run(hash(token)).changes > 0;
    },
    purgeExpired() {
      return Number(q.purge.run(Date.now() - SESSION_TTL_MS).changes);
    },
    sessionCount() {
      return q.count.get().n;
    },
    close() {
      db.close();
    },
  };
}
