# SHIP/2H backend

Persists each visitor's sprint progress (task checkboxes, launch checklist, 120‑minute timer)
so it survives cleared browser data and follows them across devices.
Zero npm dependencies: Node ≥ 22.13 (`node:http` + built‑in `node:sqlite`).

## Run

```bash
# production: one process serves the built site and the API
npm run build
npm run server                 # http://localhost:8787

# development: two terminals (Vite proxies /api to :8787)
npm run server
npm run dev

npm run server:test            # 8 end‑to‑end tests
```

Docker: `docker build -t ship2h . && docker run -p 8787:8787 -v ship2h-data:/data ship2h`

## Config (env vars)

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | Listen port |
| `DB_FILE` | `server/data/ship2h.db` | SQLite file (put it on a persistent disk) |
| `DIST_DIR` | `../dist` | Built frontend to serve |
| `CORS_ORIGIN` | _(off)_ | Only needed if the site is hosted on a different origin than the API |
| `TRUST_PROXY` | _(off)_ | Set `1` behind a reverse proxy so rate limits use `X-Forwarded-For` |

## API

Auth is an anonymous bearer token: `POST /api/sessions` returns one, the client keeps it in
localStorage. Only its SHA‑256 hash is stored. Sessions idle for 90 days are purged.

| Method & path | Auth | Description |
|---|---|---|
| `GET /api/health` | – | Liveness + session count |
| `POST /api/sessions` | – | Create a session → `201 { token, ...state }` (20/hour/IP) |
| `GET /api/state` | Bearer | `{ rev, tasks, checks, timer, updatedAt, serverTime }` |
| `PUT /api/state` | Bearer | Partial update of `tasks`, `checks`, `timer`; returns new state. Optional `rev` → `409` if stale |
| `DELETE /api/state` | Bearer | Reset to defaults |
| `DELETE /api/session` | Bearer | Delete the session and its data |

Shapes (validated server‑side, unknown fields rejected with `422`, bodies capped at 16 KB):

```jsonc
{ "tasks":  { "p0:0": true, "p3:2": true },   // `${phase.id}:${taskIndex}`; false values are dropped
  "checks": { "l1": true },                    // launch-check ids
  "timer":  { "endsAt": 1790000000000, "left": 5400 } } // endsAt: unix ms or null; left: 0..7200 s
```

## Behaviour worth knowing

- **Sync model:** last write wins per field. On load, if the server already has data it wins;
  if the server session is new, the browser's existing localStorage progress is uploaded.
  Tabs re‑pull when they regain focus. The client sends no `rev`, so it never gets 409s;
  the check exists for clients that want strict concurrency.
- **Clock skew:** the client measures its offset from `serverTime` and shifts `timer.endsAt`,
  so two devices with different clocks agree on when the sprint ends.
- **Hosting:** this needs a long‑running Node process with a persistent disk (Fly.io, Railway,
  Render with a disk, a VPS). It will not run on Vercel/Netlify static hosting; there, keep the
  frontend static and host this separately with `CORS_ORIGIN` set. The frontend calls
  same‑origin `/api`, so for split hosting add a rewrite/proxy rule for `/api`.
- `node:sqlite` prints an "experimental" warning on Node 22; `--no-warnings` silences it.
