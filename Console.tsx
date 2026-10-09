import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { phases, type Phase } from "@/data/sprint";

type Timer = {
  hhmmss: string;
  mmss: string;
  left: number;
  running: boolean;
  done: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  nudge: (d: number) => void;
  progress: number;
  elapsedMin: number;
  totalSec: number;
};

const LOG = [
  "$ npm create vite@latest signal -- --template react-ts",
  "scaffolding project in ./signal",
  "✓ 148 packages installed in 4.2s",
  "$ npm i tailwindcss @tailwindcss/vite marked dompurify",
  "$ npm run dev",
  "VITE v7.3.2  ready in 312 ms",
  "➜  Local:   http://localhost:5173/",
  "hmr update /src/index.css",
  "page reload src/components/Workspace.tsx",
  "$ git commit -m 'feat: workspace + live preview'",
  "[main 3f1a9c2] 6 files changed, 214 insertions(+)",
  "$ npm run build",
  "✓ built in 1.87s",
  "dist/index.html                 4.21 kB │ gzip:  1.68 kB",
  "dist/assets/index-Cx3kQz9.js  148.02 kB │ gzip: 47.11 kB",
  "$ vercel --prod",
  "🔗  Production: https://signal.vercel.app",
  "✅  Deployment complete — 41s",
];

function toneFor(left: number) {
  if (left > 45 * 60) return { text: "text-mint", stroke: "#35e08c", label: "on track" };
  if (left > 15 * 60) return { text: "text-amber", stroke: "#ffb020", label: "push" };
  return { text: "text-signal", stroke: "#ff4d2e", label: "final stretch" };
}

export function Console({
  timer,
  current,
  tasksDone,
  tasksTotal,
}: {
  timer: Timer;
  current: Phase | null;
  tasksDone: number;
  tasksTotal: number;
}) {
  const [logIdx, setLogIdx] = useState(4);

  useEffect(() => {
    if (!timer.running) return;
    const id = window.setInterval(
      () => setLogIdx((i) => (i + 1) % LOG.length),
      2400,
    );
    return () => window.clearInterval(id);
  }, [timer.running]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        timer.running ? timer.pause() : timer.start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [timer]);

  const tone = toneFor(timer.left);
  const R = 54;
  const C = 2 * Math.PI * R;
  const visible = [0, 1, 2].map((k) => LOG[(logIdx + k) % LOG.length]);
  const pct = Math.round(tasksTotal ? (tasksDone / tasksTotal) * 100 : 0);

  return (
    <div className="relative">
      {/* offset print shadow */}
      <div className="absolute -inset-x-2 -bottom-3 top-6 rounded-2xl border border-line/50 bg-ink-2/60" />
      <section className="relative overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-fog">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                timer.running ? "animate-blink bg-signal" : "bg-fog/50",
              )}
            />
            build clock
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/60">
            press <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 text-chalk/80">T</kbd>
          </span>
        </div>

        <div className="flex flex-col gap-6 px-5 py-6 sm:flex-row sm:items-center sm:px-7">
          <div className="relative h-[136px] w-[136px] shrink-0">
            <svg viewBox="0 0 136 136" className="h-full w-full -rotate-90">
              <circle cx="68" cy="68" r={R} fill="none" stroke="#1c2a28" strokeWidth="9" />
              <circle
                cx="68"
                cy="68"
                r={R}
                fill="none"
                stroke={tone.stroke}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - timer.progress)}
                style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1), stroke .6s" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-content-center text-center">
              <span className={cn("font-mono text-[34px] font-bold leading-none tabular-nums", tone.text)}>
                {Math.ceil(timer.left / 60)}
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-fog">
                min left
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-fog">
              remaining
            </div>
            <div className="mt-1 font-mono text-[40px] font-bold leading-none tabular-nums text-chalk sm:text-[48px]">
              {timer.done ? "00:00:00" : timer.hhmmss}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={timer.running ? timer.pause : timer.start}
                disabled={timer.done}
                className={cn(
                  "rounded-lg px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition active:scale-95",
                  timer.done
                    ? "cursor-not-allowed bg-line text-fog"
                    : timer.running
                      ? "bg-amber text-ink hover:bg-amber/85"
                      : "bg-signal text-white hover:bg-signal/85",
                )}
              >
                {timer.done ? "time" : timer.running ? "pause" : "start clock"}
              </button>
              <button
                onClick={timer.reset}
                className="rounded-lg border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fog transition hover:border-chalk/40 hover:text-chalk active:scale-95"
              >
                reset
              </button>
              <button
                onClick={() => timer.nudge(-5 * 60)}
                className="rounded-lg border border-line px-3 py-2 font-mono text-[11px] text-fog transition hover:border-lagoon hover:text-lagoon"
                title="Skip forward five minutes"
              >
                +5m
              </button>
              <span className={cn("font-mono text-[10px] uppercase tracking-[0.16em]", tone.text)}>
                {timer.done ? "shipped 🎉" : tone.label}
              </span>
            </div>
          </div>
        </div>

        {/* status rows */}
        <div className="grid gap-px border-y border-line-soft bg-line-soft sm:grid-cols-2">
          <div className="bg-panel px-5 py-4 sm:px-7">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
              now building
            </div>
            <div className="mt-1.5 truncate font-display text-[19px] font-semibold text-chalk">
              {current ? (
                <>
                  <span className="text-signal">0{current.index}</span>{" "}
                  {current.title}
                </>
              ) : (
                <span className="text-fog">Start the clock</span>
              )}
            </div>
          </div>
          <div className="bg-panel px-5 py-4 sm:px-7">
            <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
              <span>tasks checked</span>
              <span className="text-chalk">
                {tasksDone}/{tasksTotal}
              </span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lagoon via-mint to-amber transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* log */}
        <div className="h-[92px] overflow-hidden bg-[#080e10] px-5 py-3 font-mono text-[11.5px] leading-[1.65] sm:px-7">
          {visible.map((line, i) => (
            <div
              key={`${logIdx}-${i}`}
              className={cn(
                "truncate",
                i === 0 ? "swap-in text-chalk/90" : i === 1 ? "text-fog" : "text-fog/45",
              )}
            >
              <span className="mr-2 text-fog/35">
                {String(Math.floor(timer.elapsedMin)).padStart(3, "0")}:
                {String(Math.floor((timer.elapsedMin % 1) * 60)).padStart(2, "0")}
              </span>
              {line}
            </div>
          ))}
          <div className="truncate text-mint">
            <span className="mr-2 text-fog/35">$</span>
            <span className={cn(timer.running && "animate-blink")}>▊</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Full-width sprint strip: eight segments, playhead at elapsed time. */
export function SprintBar({ elapsedMin }: { elapsedMin: number }) {
  return (
    <div className="relative">
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-line bg-ink">
        {phases.map((p) => {
          const end = p.start + p.minutes;
          const fill = Math.min(1, Math.max(0, (elapsedMin - p.start) / p.minutes));
          const isNow = elapsedMin >= p.start && elapsedMin < end;
          return (
            <div
              key={p.id}
              className="relative h-full border-r border-ink/70 last:border-r-0"
              style={{ width: `${(p.minutes / 120) * 100}%` }}
              title={`${p.title} · ${p.start}–${end} min`}
            >
              <div className="absolute inset-0 bg-white/[0.03]" />
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width] duration-700",
                  isNow ? "bg-signal" : "bg-mint/70",
                )}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 hidden grid-cols-8 gap-2 md:grid">
        {phases.map((p) => {
          const isNow = elapsedMin >= p.start && elapsedMin < p.start + p.minutes;
          return (
            <div key={p.id} className="min-w-0">
              <div
                className={cn(
                  "truncate font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                  isNow ? "text-signal" : "text-fog/50",
                )}
              >
                {String(p.index).padStart(2, "0")} {p.verb}
              </div>
              <div className="truncate text-[11px] text-fog/70">{p.minutes}m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
