import { Reveal } from "./Reveal";

const RULES = [
  {
    n: "1",
    t: "One feature, finished",
    d: "A single working thing beats four half-built ones. Decide what the app does in one sentence before you write a line, and defend that sentence for two hours.",
  },
  {
    n: "2",
    t: "Ugly first, pretty second",
    d: "Grey boxes and correct structure for the first forty minutes. Colour, type and motion are a coat of paint — they only work on something already standing.",
  },
  {
    n: "3",
    t: "Cut scope, never the deploy",
    d: "Running out of time means shipping less, not shipping nothing. Reserve the last twenty minutes and treat them as untouchable.",
  },
];

export function Rules() {
  return (
    <section className="relative py-20 md:py-24">
      <div className="mx-auto max-w-[88rem] px-5 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <Reveal>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-amber">
              § 00 — the brief
            </div>
            <h2 className="mt-4 text-[clamp(1.9rem,4.2vw,3rem)] font-extrabold">
              Three rules
              <br />
              <span className="text-fog">that make the clock work.</span>
            </h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line-soft sm:grid-cols-3">
            {RULES.map((r, i) => (
              <Reveal key={r.n} delay={i * 90}>
                <div className="group h-full bg-panel/80 p-6 transition-colors duration-300 hover:bg-panel">
                  <div className="font-display text-[46px] font-extrabold leading-none text-line transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-signal">
                    {r.n}
                  </div>
                  <h3 className="mt-4 text-[18px] font-bold leading-tight text-chalk">
                    {r.t}
                  </h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-fog">{r.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
