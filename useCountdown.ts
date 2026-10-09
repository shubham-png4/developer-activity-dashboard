import { useCallback, useEffect, useState } from "react";
import { SPRINT_TOTAL_MIN } from "@/data/sprint";
import { usePersistentState } from "./usePersistentState";

const TOTAL_SEC = SPRINT_TOTAL_MIN * 60;

type TimerState = { endsAt: number | null; left: number };

/**
 * A 120-minute countdown that survives reloads: while running we store the
 * wall-clock deadline, so background tabs and refreshes stay accurate.
 */
export function useCountdown() {
  const [state, setState] = usePersistentState<TimerState>("ship2h.timer", {
    endsAt: null,
    left: TOTAL_SEC,
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const endsAt = state.endsAt;
  const running = endsAt !== null;
  const left =
    endsAt !== null
      ? Math.max(0, Math.round((endsAt - now) / 1000))
      : Math.max(0, Math.round(state.left));

  const start = useCallback(() => {
    setState((s) => {
      const current = s.endsAt
        ? Math.max(0, Math.round((s.endsAt - Date.now()) / 1000))
        : s.left;
      if (current <= 0) return s;
      return { endsAt: Date.now() + current * 1000, left: current };
    });
    setNow(Date.now());
  }, [setState]);

  const pause = useCallback(() => {
    setState((s) => {
      const current = s.endsAt
        ? Math.max(0, Math.round((s.endsAt - Date.now()) / 1000))
        : s.left;
      return { endsAt: null, left: current };
    });
  }, [setState]);

  const reset = useCallback(() => {
    setState({ endsAt: null, left: TOTAL_SEC });
    setNow(Date.now());
  }, [setState]);

  const nudge = useCallback(
    (deltaSec: number) => {
      setState((s) => {
        const current = s.endsAt
          ? Math.max(0, Math.round((s.endsAt - Date.now()) / 1000))
          : s.left;
        const next = Math.min(TOTAL_SEC, Math.max(0, current + deltaSec));
        return s.endsAt
          ? { endsAt: Date.now() + next * 1000, left: next }
          : { endsAt: null, left: next };
      });
      setNow(Date.now());
    },
    [setState],
  );

  const elapsedSec = TOTAL_SEC - left;
  const elapsedMin = elapsedSec / 60;

  return {
    left,
    running,
    done: left === 0,
    start,
    pause,
    reset,
    nudge,
    totalSec: TOTAL_SEC,
    elapsedMin,
    progress: elapsedSec / TOTAL_SEC,
    hhmmss: format(left),
    mmss: formatShort(left),
  };
}

function format(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [pad(h), pad(m), pad(s)].join(":");
}

function formatShort(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
