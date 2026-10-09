import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./index.mjs";

const dist = mkdtempSync(join(tmpdir(), "dist-"));
writeFileSync(join(dist, "index.html"), "<!doctype html><title>spa</title>");
const server = createApp({ dbFile: ":memory:", distDir: dist, rateLimit: 1000 });
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
after(() => server.close());

const call = (method, path, { token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(body && { "Content-Type": "application/json" }) },
    body: body && JSON.stringify(body),
  });

test("health", async () => {
  const r = await call("GET", "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

test("session lifecycle: create, read defaults, update, merge, reset, delete", async () => {
  const created = await (await call("POST", "/api/sessions")).json();
  const { token } = created;
  assert.ok(token.length >= 40);
  assert.equal(created.rev, 0);
  assert.deepEqual(created.timer, { endsAt: null, left: 7200 });

  let r = await call("PUT", "/api/state", { token, body: { tasks: { "p0:0": true, "p1:2": true, "p2:1": false } } });
  let s = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(s.tasks, { "p0:0": true, "p1:2": true }); // false values are dropped
  assert.equal(s.rev, 1);

  // partial update leaves other fields untouched
  s = await (await call("PUT", "/api/state", { token, body: { checks: { l1: true } } })).json();
  assert.deepEqual(s.tasks, { "p0:0": true, "p1:2": true });
  assert.deepEqual(s.checks, { l1: true });
  assert.equal(s.rev, 2);

  const endsAt = Date.now() + 3600_000;
  s = await (await call("PUT", "/api/state", { token, body: { timer: { endsAt, left: 3600 } } })).json();
  assert.deepEqual(s.timer, { endsAt, left: 3600 });

  s = await (await call("GET", "/api/state", { token })).json();
  assert.equal(s.rev, 3);
  assert.ok(Math.abs(s.serverTime - Date.now()) < 5000);

  s = await (await call("DELETE", "/api/state", { token })).json();
  assert.deepEqual([s.tasks, s.checks, s.timer], [{}, {}, { endsAt: null, left: 7200 }]);

  assert.equal((await call("DELETE", "/api/session", { token })).status, 204);
  assert.equal((await call("GET", "/api/state", { token })).status, 401);
});

test("sessions are isolated", async () => {
  const a = (await (await call("POST", "/api/sessions")).json()).token;
  const b = (await (await call("POST", "/api/sessions")).json()).token;
  await call("PUT", "/api/state", { token: a, body: { tasks: { "p0:0": true } } });
  assert.deepEqual((await (await call("GET", "/api/state", { token: b })).json()).tasks, {});
});

test("optimistic concurrency: stale rev returns 409 with current state", async () => {
  const { token } = await (await call("POST", "/api/sessions")).json();
  await call("PUT", "/api/state", { token, body: { tasks: { "p0:0": true } } }); // rev 1
  const r = await call("PUT", "/api/state", { token, body: { tasks: { "p0:1": true }, rev: 0 } });
  assert.equal(r.status, 409);
  assert.deepEqual((await r.json()).tasks, { "p0:0": true });
  const ok = await call("PUT", "/api/state", { token, body: { tasks: { "p0:1": true }, rev: 1 } });
  assert.equal(ok.status, 200);
});

test("auth failures", async () => {
  assert.equal((await call("GET", "/api/state")).status, 401);
  assert.equal((await call("GET", "/api/state", { token: "x".repeat(43) })).status, 401);
  const r = await fetch(base + "/api/state", { headers: { Authorization: "Bearer bad token!" } });
  assert.equal(r.status, 401);
});

test("validation rejects bad input", async () => {
  const { token } = await (await call("POST", "/api/sessions")).json();
  const bad = [
    { tasks: { "../etc": true } },
    { tasks: { "p0:0": "yes" } },
    { tasks: [] },
    { checks: { l99999: true } },
    { timer: { endsAt: "soon", left: 10 } },
    { timer: { endsAt: null, left: 99999 } },
    { timer: { endsAt: null, left: -1 } },
    { admin: true },
    {},
  ];
  for (const body of bad) {
    const r = await call("PUT", "/api/state", { token, body });
    assert.equal(r.status, 422, JSON.stringify(body));
  }
  const tooBig = await call("PUT", "/api/state", { token, body: { tasks: {}, pad: "x".repeat(20_000) } });
  assert.equal(tooBig.status, 413);
  const malformed = await fetch(base + "/api/state", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{nope",
  });
  assert.equal(malformed.status, 400);
});

test("static files, SPA fallback, traversal blocked", async () => {
  let r = await fetch(base + "/");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /spa/);
  r = await fetch(base + "/some/client/route");
  assert.match(await r.text(), /spa/);
  r = await fetch(base + "/..%2f..%2fetc/passwd");
  assert.notEqual((await r.text()).includes("root:"), true);
  assert.equal((await fetch(base + "/api/nope")).status, 404);
});

test("rate limiting kicks in", async () => {
  const s2 = createApp({ dbFile: ":memory:", distDir: dist, rateLimit: 3, sessionLimit: 2 });
  await new Promise((r) => s2.listen(0, r));
  const b2 = `http://127.0.0.1:${s2.address().port}`;
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await fetch(b2 + "/api/health")).status);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
  s2.close();
  const s3 = createApp({ dbFile: ":memory:", distDir: dist, sessionLimit: 2 });
  await new Promise((r) => s3.listen(0, r));
  const b3 = `http://127.0.0.1:${s3.address().port}`;
  const c = [];
  for (let i = 0; i < 3; i++) c.push((await fetch(b3 + "/api/sessions", { method: "POST" })).status);
  assert.deepEqual(c, [201, 201, 429]);
  s3.close();
});
