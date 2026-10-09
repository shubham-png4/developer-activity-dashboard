import { SPRINT_TOTAL_SEC } from "./db.mjs";

const TASK_KEY = /^p\d{1,2}:\d{1,2}$/; // "p3:2" = phase 3, task 2 (matches the frontend's `${p.id}:${i}`)
const CHECK_KEY = /^l\d{1,2}$/; // "l1".."l8"
const MAX_KEYS = 200;

export class ValidationError extends Error {}

function boolMap(value, keyRe, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${name} must be an object`);
  }
  const out = {};
  const keys = Object.keys(value);
  if (keys.length > MAX_KEYS) throw new ValidationError(`${name} has too many keys`);
  for (const k of keys) {
    if (!keyRe.test(k)) throw new ValidationError(`${name}: invalid key "${k}"`);
    if (typeof value[k] !== "boolean") throw new ValidationError(`${name}.${k} must be boolean`);
    if (value[k]) out[k] = true; // store only true values; false == absent
  }
  return out;
}

function timer(value) {
  if (value === null || typeof value !== "object") throw new ValidationError("timer must be an object");
  const { endsAt, left } = value;
  if (endsAt !== null && !(Number.isInteger(endsAt) && endsAt > 0 && endsAt < 4e12)) {
    throw new ValidationError("timer.endsAt must be null or a unix-ms integer");
  }
  if (!Number.isInteger(left) || left < 0 || left > SPRINT_TOTAL_SEC) {
    throw new ValidationError(`timer.left must be an integer 0..${SPRINT_TOTAL_SEC}`);
  }
  return { endsAt, left };
}

/** Validate a partial state update. Unknown top-level fields are rejected. */
export function parsePatch(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("body must be a JSON object");
  }
  const allowed = new Set(["tasks", "checks", "timer", "rev"]);
  for (const k of Object.keys(body)) {
    if (!allowed.has(k)) throw new ValidationError(`unknown field "${k}"`);
  }
  const patch = {};
  if ("tasks" in body) patch.tasks = boolMap(body.tasks, TASK_KEY, "tasks");
  if ("checks" in body) patch.checks = boolMap(body.checks, CHECK_KEY, "checks");
  if ("timer" in body) patch.timer = timer(body.timer);
  if (Object.keys(patch).length === 0) throw new ValidationError("nothing to update");
  if ("rev" in body) {
    if (!Number.isInteger(body.rev) || body.rev < 0) throw new ValidationError("rev must be a non-negative integer");
    patch.expectedRev = body.rev;
  }
  return patch;
}
