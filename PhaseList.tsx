import { useState } from "react";
import { cn } from "@/utils/cn";
import { CodeBlock } from "./CodeBlock";
import { Reveal } from "./Reveal";
import type { Phase } from "@/data/sprint";

const ACCENT: Record<
  Phase["accent"],
  { text: string; border: string; bg: string; dot: string }
> = {
  signal: { text: "text-signal", border: "border-signal/40", bg: "bg-signal/10", dot: "bg-signal" },
  amber: { text: "text-amber", border: "border-amber/40", bg: "bg-amber/10", dot: "bg-amber" },
  mint: { text: "text-mint", border: "border-mint/40", bg: "bg-mint/10", dot: "bg-mint" },
  lagoon: { text: "text-lagoon", border: "border-lagoon/40", bg: "bg-lagoon/10", dot: "bg-lagoon" },
};

const mm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function PhaseList({
  phases,
  elapsedMin,
  done,
  onToggle,
  onJump,
}: {
  phases: Phase[];
  elapsedMin: number;
  done: Record<string, boolean>;
  onToggle: (key: string) => void;
  onJump: (minute: number) => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ p0: true });
  const [allOpen, setAllOpen] = useState(false);

  const toggleAll = () => {
    const next = !allOpen;
    setAllOpen(next);
    setOpen(Object.fromEntries(phases.map((p) => [p.id, next])));
  };

  return (
    <section id="sprint" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-[88rem] px-5 md:px-8">
        {/* header */}
        <Reveal className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-signal">
              § 01 — the plan
            </div>
            <h2 className="mt-4 text-[clamp(2.2rem,5.4vw,4rem)] font-extrabold">
              Eight phases.
              <br />
              <span className="text-fog">No side quests.</span>
            </h2>
          </div>
          <div>
            <p className="max-w-md text-[15.5px] leading-relaxed text-fog">
              Each phase is time-boxed and ends with something you can see
              running. If a phase overruns, cut scope — never cut the deploy
              step at the end. A rough site on a real URL beats a perfect one
              on localhost.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={toggleAll}
                className="rounded-lg border border-line px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-fog transition hover:border-chalk/40 hover:text-chalk"
              >
                {allOpen ? "collapse all" : "expand all code"}
              </button>
              <button
                onClick={() => {
                  const p = phases.find(
                    (ph) => elapsedMin >= ph.start && elapsedMin < ph.start + ph.minutes,
                  );
                  if (p) {
                    setOpen((o) => ({ ...o, [p.id]: true }));
                    document
                      .getElementById(`phase-${p.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="rounded-lg bg-mint/15 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-mint transition hover:bg-mint hover:text-ink"
              >
                jump to current phase
              </button>
            </div>
          </div>
        </Reveal>

        {/* phases */}
        <ol className="mt-4">
          {phases.map((p, i) => {
            const isOpen = !!open[p.id];
            const isNow = elapsedMin >= p.start && elapsedMin < p.start + p.minutes;
            const isPast = elapsedMin >= p.start + p.minutes;
            const a = ACCENT[p.accent];
            const checked = p.tasks.filter((_, ti) => done[`${p.id}:${ti}`]).length;

            return (
              <Reveal
                as="li"
                key={p.id}
                delay={Math.min(i * 60, 240)}
                id={`phase-${p.id}`}
                className="scroll-mt-24"
              >
                <div
                  className={cn(
                    "group relative grid gap-0 border-b border-line-soft py-6 transition-colors md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-8 md:py-8",
                    isNow && "bg-signal/[0.035]",
                  )}
                >
                  {/* rail */}
                  <div className="flex items-start gap-3 md:block">
                    <div className="relative">
                      <span
                        className={cn(
                          "font-mono text-[11px] tabular-nums transition-colors",
                          isNow ? "text-signal" : isPast ? "text-mint/70" : "text-fog/60",
                        )}
                      >
                        {mm(p.start)}
                      </span>
                      {isNow && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded border border-signal/50 bg-signal/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-signal">
                          <span className="h-1 w-1 animate-blink rounded-full bg-signal" />
                          now
                        </span>
                      )}
                    </div>
                    <div className="mt-3 hidden font-display text-[52px] font-extrabold leading-none text-line transition-colors duration-500 group-hover:text-fog/40 md:block">
                      {String(p.index).padStart(2, "0")}
                    </div>
                    <div className="mt-3 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-fog/50 md:block">
                      {p.minutes} min · {mm(p.start + p.minutes)}
                    </div>
                  </div>

                  {/* body */}
                  <div className="min-w-0">
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))}
                      className="flex w-full items-start gap-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.2em]",
                              a.border,
                              a.bg,
                              a.text,
                            )}
                          >
                            {p.verb}
                          </span>
                          {checked === p.tasks.length && (
                            <span className="rounded border border-mint/40 bg-mint/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-mint">
                              done ✓
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2.5 text-[clamp(1.5rem,3vw,2.1rem)] font-bold transition-colors group-hover:text-signal">
                          {p.title}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line font-mono text-sm text-fog transition-all duration-300",
                          isOpen ? "rotate-45 border-signal text-signal" : "group-hover:border-chalk/50 group-hover:text-chalk",
                        )}
                      >
                        +
                      </span>
                    </button>

                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-500 ease-out",
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="pt-5">
                          <p className="max-w-2xl text-[15px] leading-relaxed text-fog">
                            {p.summary}
                          </p>

                          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
                            {/* tasks */}
                            <div>
                              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fog">
                                <span>checklist</span>
                                <span className={cn(checked === p.tasks.length ? "text-mint" : "text-chalk")}>
                                  {checked}/{p.tasks.length}
                                </span>
                              </div>
                              <ul className="space-y-1.5">
                                {p.tasks.map((t, ti) => {
                                  const key = `${p.id}:${ti}`;
                                  const on = !!done[key];
                                  return (
                                    <li key={key}>
                                      <button
                                        onClick={() => onToggle(key)}
                                        className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.04]"
                                      >
                                        <span
                                          className={cn(
                                            "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition-all duration-200",
                                            on
                                              ? "scale-105 border-mint bg-mint text-ink"
                                              : "border-line text-transparent hover:border-fog",
                                          )}
                                        >
                                          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                                            <path
                                              d="M2 6.4 4.6 9 10 3.2"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </span>
                                        <span
                                          className={cn(
                                            "text-[14px] leading-snug transition-colors",
                                            on ? "text-fog/50 line-through" : "text-chalk/90",
                                          )}
                                        >
                                          {t}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                              <button
                                onClick={() => onJump(p.start + p.minutes)}
                                className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-fog transition hover:text-signal"
                              >
                                ⏩ set clock to {mm(p.start + p.minutes)}
                              </button>
                            </div>

                            {/* code */}
                            <div className="space-y-4">
                              {p.snippets.map((s) => (
                                <CodeBlock
                                  key={s.file}
                                  file={s.file}
                                  lang={s.lang}
                                  code={s.code}
                                  note={s.note}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
