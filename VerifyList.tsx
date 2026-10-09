import { cn } from "@/utils/cn";
import { Reveal } from "./Reveal";
import { launchChecks } from "@/data/sprint";

export function VerifyList({
  checks,
  onToggle,
  tasksDone,
  tasksTotal,
  elapsedMin,
  onReset,
}: {
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
  tasksDone: number;
  tasksTotal: number;
  elapsedMin: number;
  onReset: () => void;
}) {
  const done = launchChecks.filter((c) => checks[c.id]).length;
  const pct = Math.round((done / launchChecks.length) * 100);
  const complete = done === launchChecks.length;

  return (
    <section id="verify" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-[88rem] px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-mint">
              § 03 — verify
            </div>
            <h2 className="mt-4 text-[clamp(2.2rem,5.4vw,3.6rem)] font-extrabold">
              It is not shipped
              <br />
              <span className="text-fog">until this is green.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-fog">
              Eight checks that catch almost every first-deploy failure. Run
              them against the live URL, not localhost — the two behave
              differently more often than anyone admits.
            </p>

            <div className="mt-8 rounded-2xl border border-line bg-panel/70 p-5">
              <div className="flex items-end justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
                  sprint report
                </span>
                <span
                  className={cn(
                    "font-mono text-[28px] font-bold leading-none tabular-nums",
                    complete ? "text-mint" : "text-chalk",
                  )}
                >
                  {pct}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 ease-out",
                    complete ? "bg-mint" : "bg-signal",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4 font-mono text-[11px]">
                <div>
                  <dt className="text-fog/70">tasks</dt>
                  <dd className="mt-1 text-[17px] font-bold text-chalk tabular-nums">
                    {tasksDone}
                    <span className="text-fog/50">/{tasksTotal}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-fog/70">checks</dt>
                  <dd className="mt-1 text-[17px] font-bold text-chalk tabular-nums">
                    {done}
                    <span className="text-fog/50">/{launchChecks.length}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-fog/70">clock</dt>
                  <dd className="mt-1 text-[17px] font-bold text-chalk tabular-nums">
                    {Math.floor(elapsedMin)}
                    <span className="text-fog/50">m</span>
                  </dd>
                </div>
              </dl>
              {complete && (
                <p className="mt-4 rounded-lg border border-mint/40 bg-mint/10 px-3 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-mint">
                  ✓ shipped. go post the link somewhere.
                </p>
              )}
              <button
                onClick={onReset}
                className="mt-4 w-full rounded-lg border border-line px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-fog transition hover:border-signal hover:text-signal"
              >
                reset the whole sprint
              </button>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <ul className="border-t border-line-soft">
              {launchChecks.map((c, i) => {
                const on = !!checks[c.id];
                return (
                  <li key={c.id} className="border-b border-line-soft">
                    <button
                      onClick={() => onToggle(c.id)}
                      className="group flex w-full items-start gap-4 py-4 text-left transition-colors hover:bg-white/[0.025]"
                      aria-pressed={on}
                    >
                      <span className="mt-0.5 w-6 shrink-0 font-mono text-[11px] tabular-nums text-fog/40">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-all duration-300",
                          on
                            ? "border-mint bg-mint text-ink"
                            : "border-line text-transparent group-hover:border-fog",
                        )}
                      >
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                          <path
                            d="M2 6.4 4.6 9 10 3.2"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-[15.5px] font-medium leading-snug transition-colors",
                            on ? "text-fog/55 line-through" : "text-chalk",
                          )}
                        >
                          {c.label}
                        </span>
                        <span
                          className={cn(
                            "mt-1 block overflow-hidden text-[13px] leading-relaxed text-fog transition-all duration-300",
                            on ? "max-h-0 opacity-0" : "max-h-20 opacity-100",
                          )}
                        >
                          ↳ {c.why}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
