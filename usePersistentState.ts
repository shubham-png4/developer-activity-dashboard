import { useEffect, useState } from "react";
import { push, subscribe } from "@/lib/sync";

/**
 * State that survives reloads via localStorage and, for the ship2h.* keys,
 * is mirrored to the backend (see src/lib/sync.ts). If the backend is
 * unreachable it degrades to plain localStorage.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode — degrade silently */
    }
  }, [key, value]);

  // remote -> local
  useEffect(() => subscribe(key, (v) => setValue(v as T)), [key]);

  // local -> remote
  useEffect(() => {
    push(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
