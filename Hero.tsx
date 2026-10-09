import { Console, SprintBar } from "./Console";
import type { Phase } from "@/data/sprint";
import { phases, providers } from "@/data/sprint";

const blockCount =
  phases.reduce((n, p) => n + p.snippets.length, 0) + providers.length * 2;

type Timer = Parameters<typeof Console>[0]["timer"];

export function Hero({
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
  return (
    <section id="top" className="relative pt-28 md:pt-32 lg:pt-36">
      <div className="mx-auto max-w-[88rem] px-5 md:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
          {/* ---------- left: the pitch ---------- */}
          <div className="reveal is-in">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.24em] text-fog">
              <span className="inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-3 py-1 text-signal">
                <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal" />
                sprint 01
              </span>
              <span>static site</span>
              <span className="text-line">/</span>
              <span>solo build</span>
              <span className="text-line">/</span>
              <span>no backend</span>
            </div>

            <h1 className="mt-7 text-[clamp(2.7rem,7.4vw,5.4rem)] font-extrabold">
              <span className="block text-chalk">Build a website</span>
              <span className="block text-signal">in two hours.</span>
              <span
                className="block text-chalk/90"
                style={{
                  WebkitTextStroke: "1.5px rgba(233,241,238,0.55)",
                  color: "transparent",
                }}
              >
                Then ship it.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-[16.5px] leading-relaxed text-fog">
              Everything you need for one uninterrupted build sprint: eight
              time-boxed phases, the actual code for each one, and four
              copy-paste deployment recipes. Tick things off as you go — the
              clock and the checklist both remember where you stopped.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#sprint"
                className="group inline-flex items-center gap-2.5 rounded-lg bg-signal px-5 py-3 font-mono text-[11.5px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-chalk hover:text-ink active:scale-[0.97]"
              >
                open phase 00
                <span className="transition-transform duration-300 group-hover:translate-y-0.5">
                  ↓
                </span>
              </a>
              <a
                href="#deploy"
                className="inline-flex items-center gap-2.5 rounded-lg border border-line px-5 py-3 font-mono text-[11.5px] uppercase tracking-[0.16em] text-chalk transition hover:border-lagoon hover:bg-lagoon/10 hover:text-lagoon active:scale-[0.97]"
              >
                skip to deploy
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {["React 19", "Vite 7", "Tailwind v4", "TypeScript", "Git", "localStorage"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-md border border-line-soft bg-ink-2/70 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-fog transition hover:-translate-y-0.5 hover:border-line hover:text-chalk"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line-soft sm:grid-cols-4">
              {[
                ["08", "phases"],
                ["120", "minutes"],
                ["04", "hosts"],
                [String(blockCount).padStart(2, "0"), "code blocks"],
              ].map(([n, l]) => (
                <div key={l} className="bg-panel px-4 py-3.5">
                  <dt className="font-mono text-[22px] font-bold leading-none text-chalk">
                    {n}
                  </dt>
                  <dd className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fog">
                    {l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ---------- right: the console ---------- */}
          <div className="reveal is-in lg:sticky lg:top-24">
            <Console
              timer={timer}
              current={current}
              tasksDone={tasksDone}
              tasksTotal={tasksTotal}
            />
          </div>
        </div>

        {/* ---------- sprint strip ---------- */}
        <div className="mt-14 border-t border-line-soft pt-6 md:mt-16">
          <div className="mb-3 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-fog">
            <span>sprint timeline</span>
            <span>
              {Math.floor(timer.elapsedMin)} of 120 min elapsed
            </span>
          </div>
          <SprintBar elapsedMin={timer.elapsedMin} />
        </div>
      </div>
    </section>
  );
}
