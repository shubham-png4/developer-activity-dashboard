import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extname, join, normalize, resolve, sep } from "node:path";
import { openDb } from "./db.mjs";
import { parsePatch, ValidationError } from "./validate.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));

export function createApp(opts = {}) {
  const cfg = {
    dbFile: opts.dbFile ?? process.env.DB_FILE ?? join(here, "data", "ship2h.db"),
    distDir: resolve(opts.distDir ?? process.env.DIST_DIR ?? join(here, "..", "dist")),
    corsOrigin: opts.corsOrigin ?? process.env.CORS_ORIGIN ?? "", // e.g. https://signal.vercel.app
    trustProxy: (opts.trustProxy ?? process.env.TRUST_PROXY) === "1" || opts.trustProxy === true,
    rateLimit: opts.rateLimit ?? 120, // requests / minute / IP
    sessionLimit: opts.sessionLimit ?? 20, // new sessions / hour / IP
  };
  const db = openDb(cfg.dbFile);

  /* ---------- tiny fixed-window rate limiter ---------- */
  const buckets = new Map();
  function hit(key, limit, windowMs) {
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now >= b.reset) buckets.set(key, (b = { n: 0, reset: now + windowMs }));
    return ++b.n <= limit;
  }
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (now >= b.reset) buckets.delete(k);
    db.purgeExpired();
  }, 10 * 60 * 1000);
  sweep.unref();

  const clientIp = (req) =>
    (cfg.trustProxy && req.headers["x-forwarded-for"]?.split(",")[0].trim()) ||
    req.socket.remoteAddress ||
    "unknown";

  /* ---------- helpers ---------- */
  function send(res, status, body, extra = {}) {
    const json = body === undefined ? "" : JSON.stringify(body);
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extra,
    });
    res.end(json);
  }

  function readJson(req, limit = 16 * 1024) {
    return new Promise((resolveBody, reject) => {
      let size = 0;
      const chunks = [];
      let rejected = false;
      req.on("data", (c) => {
        if (rejected) return; // discard the rest; the response closes the connection
        size += c.length;
        if (size > limit) {
          rejected = true;
          chunks.length = 0;
          reject(Object.assign(new Error("payload too large"), { status: 413 }));
        } else chunks.push(c);
      });
      req.on("end", () => {
        try {
          resolveBody(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
        } catch {
          reject(Object.assign(new Error("invalid JSON"), { status: 400 }));
        }
      });
      req.on("error", reject);
    });
  }

  function bearer(req) {
    const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(req.headers.authorization ?? "");
    return m ? m[1] : null;
  }

  /* ---------- API ---------- */
  async function api(req, res, path) {
    if (path === "/api/health" && req.method === "GET") {
      return send(res, 200, { ok: true, sessions: db.sessionCount(), serverTime: Date.now() });
    }

    if (path === "/api/sessions" && req.method === "POST") {
      if (!hit(`s:${clientIp(req)}`, cfg.sessionLimit, 3600_000)) {
        return send(res, 429, { error: "too many sessions created, try again later" });
      }
      const token = db.createSession();
      return send(res, 201, { token, ...db.getState(token), serverTime: Date.now() });
    }

    if (path === "/api/state") {
      const token = bearer(req);
      if (!token) return send(res, 401, { error: "missing bearer token" });

      if (req.method === "GET") {
        const state = db.getState(token);
        return state
          ? send(res, 200, { ...state, serverTime: Date.now() })
          : send(res, 401, { error: "unknown or expired session" });
      }

      if (req.method === "PUT") {
        let patch;
        try {
          patch = parsePatch(await readJson(req));
        } catch (e) {
          if (e instanceof ValidationError) return send(res, 422, { error: e.message });
          throw e;
        }
        const cur = db.getState(token);
        if (!cur) return send(res, 401, { error: "unknown or expired session" });
        if (patch.expectedRev !== undefined && patch.expectedRev !== cur.rev) {
          return send(res, 409, { error: "stale revision", ...cur, serverTime: Date.now() });
        }
        const next = db.patchState(token, patch);
        return send(res, 200, { ...next, serverTime: Date.now() });
      }

      if (req.method === "DELETE") {
        const next = db.resetState(token);
        return next
          ? send(res, 200, { ...next, serverTime: Date.now() })
          : send(res, 401, { error: "unknown or expired session" });
      }
    }

    if (path === "/api/session" && req.method === "DELETE") {
      const token = bearer(req);
      if (!token) return send(res, 401, { error: "missing bearer token" });
      return db.deleteSession(token) ? send(res, 204) : send(res, 404, { error: "not found" });
    }

    return send(res, path.startsWith("/api/") ? 404 : 405, { error: "not found" });
  }

  /* ---------- static files (the Vite build) ---------- */
  const MIME = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml",
    ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
    ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
  };

  async function serveStatic(req, res, path) {
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "method not allowed" });
    let file = resolve(cfg.distDir, "." + normalize("/" + decodeURIComponent(path)));
    if (file !== cfg.distDir && !file.startsWith(cfg.distDir + sep)) return send(res, 403, { error: "forbidden" });
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      await stat(file);
    } catch {
      file = join(cfg.distDir, "index.html"); // SPA fallback
    }
    try {
      const body = await readFile(file);
      const ext = extname(file);
      res.writeHead(200, {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      send(res, 404, { error: "build not found — run `npm run build` in the project root first" });
    }
  }

  /* ---------- server ---------- */
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = url.pathname;

      if (cfg.corsOrigin && path.startsWith("/api/")) {
        res.setHeader("Access-Control-Allow-Origin", cfg.corsOrigin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
        if (req.method === "OPTIONS") return (res.writeHead(204), res.end());
      }

      if (path.startsWith("/api/")) {
        if (!hit(`r:${clientIp(req)}`, cfg.rateLimit, 60_000)) {
          return send(res, 429, { error: "rate limit exceeded" }, { "Retry-After": "60" });
        }
        return await api(req, res, path);
      }
      return await serveStatic(req, res, path);
    } catch (e) {
      if (!res.headersSent) {
        send(res, e.status ?? 500, { error: e.status ? e.message : "internal error" }, { Connection: "close" });
      }
      if (!e.status) console.error(e);
    }
  });

  server.on("close", () => {
    clearInterval(sweep);
    db.close();
  });
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.env.PORT ?? 8787);
  const server = createApp();
  server.listen(port, () => console.log(`ship2h server listening on :${port}`));
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.close(() => process.exit(0)));
}
