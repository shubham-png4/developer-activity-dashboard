import { cn } from "@/utils/cn";
import { CodeBlock } from "./CodeBlock";
import { Reveal } from "./Reveal";
import { providers, type Provider } from "@/data/sprint";
import { usePersistentState } from "@/hooks/usePersistentState";

const A: Record<Provider["accent"], { text: string; bg: string; border: string; solid: string }> = {
  signal: { text: "text-signal", bg: "bg-signal/10", border: "border-signal/45", solid: "bg-signal" },
  mint: { text: "text-mint", bg: "bg-mint/10", border: "border-mint/45", solid: "bg-mint" },
  amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/45", solid: "bg-amber" },
  lagoon: { text: "text-lagoon", bg: "bg-lagoon/10", border: "border-lagoon/45", solid: "bg-lagoon" },
};

const FLOW = [
  { k: "01", t: "git push", d: "main branch" },
  { k: "02", t: "npm ci", d: "clean install" },
  { k: "03", t: "npm run build", d: "→ dist/" },
  { k: "04", t: "upload", d: "hashed assets" },
  { k: "05", t: "edge cache", d: "https:// live" },
];

export function DeployPanel() {
  const [activeId, setActiveId] = usePersistentState<string>("ship2h.host", "vercel");
  const active = providers.find((p) => p.id === activeId) ?? providers[0];
  const a = A[active.accent];

  return (
    <section id="deploy" className="relative scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-[88rem] px-5 md:px-8">
        <Reveal className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-lagoon">
              § 02 — the deploy
            </div>
            <h2 className="mt-4 text-[clamp(2.2rem,5.4vw,4rem)] font-extrabold">
              Four ways to get it
              <br />
              <span className="text-fog">on the internet.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15.5px] leading-relaxed text-fog">
            All four serve a static <code className="rounded bg-ink-2 px-1.5 py-0.5 font-mono text-[13px] text-mint">dist/</code>{" "}
            folder for free with automatic HTTPS. Pick one, copy the commands,
            paste the config file. Every push to <span className="text-chalk">main</span>{" "}
            redeploys from then on.
            <span className="mt-4 block border-l-2 border-lagoon/50 pl-3 font-mono text-[11.5px] leading-relaxed tracking-normal text-lagoon/90">
              ↳ the page you are reading is itself a static Vite build — these
              are the exact steps that shipped it.
            </span>
          </p>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10">
          {/* host picker */}
          <Reveal>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
              {providers.map((p) => {
                const on = p.id === active.id;
                const pa = A[p.accent];
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={cn(
                      "group relative min-w-[15rem] flex-1 overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-all duration-300 lg:min-w-0 lg:flex-none",
                      on
                        ? cn(pa.border, "bg-panel translate-x-0 lg:translate-x-1")
                        : "border-line-soft bg-ink-2/40 hover:border-line hover:bg-panel/60",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-[3px] transition-all duration-300",
                        on ? pa.solid : "bg-transparent group-hover:bg-line",
                      )}
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "font-display text-[17px] font-bold transition-colors",
                          on ? "text-chalk" : "text-fog group-hover:text-chalk",
                        )}
                      >
                        {p.name}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-fog/60">
                        {p.minutes}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em]",
                        on ? pa.text : "text-fog/50",
                      )}
                    >
                      {p.tag}
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* detail */}
          <Reveal delay={80}>
            <div key={active.id} className="swap-in">
              <div className="rounded-2xl border border-line bg-panel/70 p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold">
                        {active.name}
                      </h3>
                      <span
                        className={cn(
                          "rounded border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em]",
                          a.border,
                          a.bg,
                          a.text,
                        )}
                      >
                        {active.tag}
                      </span>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-fog">
                      {active.blurb}
                    </p>
                  </div>
                </div>

                {/* steps */}
                <ol className="mt-7 space-y-1.5">
                  {active.steps.map((s, i) => (
                    <li
                      key={s.t}
                      className="group flex gap-4 rounded-lg border border-transparent px-3 py-2.5 transition hover:border-line-soft hover:bg-ink-2/60"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[10px] font-bold transition-colors",
                          a.border,
                          a.bg,
                          a.text,
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-semibold text-chalk">
                          {s.t}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] leading-relaxed text-fog">
                          {s.d}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>

                {/* specs */}
                <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-line bg-line-soft sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["best for", active.best],
                    ["first deploy", active.minutes],
                    ["free tier", active.free],
                    ["preview urls", active.previews],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-ink-2 px-4 py-3.5">
                      <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-fog/70">
                        {k}
                      </dt>
                      <dd className="mt-1.5 text-[13px] leading-snug text-chalk/90">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <CodeBlock
                  file="terminal"
                  lang="bash"
                  code={active.commands.join("\n")}
                  note="Run these from the project root. The CLI asks which account and project once, then remembers."
                />
                <CodeBlock
                  file={active.config.file}
                  lang={active.config.lang}
                  code={active.config.code}
                  note={active.config.note}
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* pipeline */}
        <Reveal className="mt-20">
          <div className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.28em] text-fog">
            what happens on every push
          </div>
          <div className="grid gap-3 md:grid-cols-5 md:gap-0">
            {FLOW.map((f, i) => (
              <div key={f.k} className="relative flex items-stretch">
                <div className="group flex-1 rounded-xl border border-line-soft bg-ink-2/50 px-4 py-4 transition-all duration-300 hover:-translate-y-1 hover:border-lagoon/50 hover:bg-panel">
                  <div className="font-mono text-[10px] tracking-widest text-fog/50">{f.k}</div>
                  <div className="mt-1.5 font-mono text-[13px] font-medium text-chalk transition-colors group-hover:text-lagoon">
                    {f.t}
                  </div>
                  <div className="mt-0.5 text-[12px] text-fog">{f.d}</div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="hidden items-center px-1.5 font-mono text-fog/40 md:flex">→</div>
                )}
              </div>
            ))}
          </div>
        </Reveal>

        {/* comparison + dns */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
          <Reveal>
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.28em] text-fog">
              side by side
            </div>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-ink-2/80">
                    {["Host", "Setup", "Free tier", "Preview URLs", "Best for"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.18em] text-fog"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => {
                    const on = p.id === active.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setActiveId(p.id)}
                        className={cn(
                          "cursor-pointer border-b border-line-soft text-[13.5px] transition-colors last:border-0",
                          on ? "bg-signal/[0.06]" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className={cn("font-display font-bold", on ? "text-signal" : "text-chalk")}>
                            {p.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-fog">{p.minutes}</td>
                        <td className="px-4 py-3 text-fog">{p.free}</td>
                        <td className="px-4 py-3 text-fog">{p.previews}</td>
                        <td className="px-4 py-3 text-fog">{p.best}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog/50">
              click a row to load that recipe ↑
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-2xl border border-line bg-panel/70 p-6">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-amber">
                pointing a domain
              </div>
              <h3 className="mt-3 text-[26px] font-bold">DNS in three lines</h3>
              <ul className="mt-5 space-y-4 text-[14px] leading-relaxed text-fog">
                <li className="border-l-2 border-line pl-4">
                  <span className="block font-mono text-[12px] text-chalk">apex · yourdomain.com</span>
                  Add an <span className="text-lagoon">A</span> record with the
                  IP your host gives you, or an{" "}
                  <span className="text-lagoon">ALIAS/ANAME</span> where the
                  registrar allows it.
                </li>
                <li className="border-l-2 border-line pl-4">
                  <span className="block font-mono text-[12px] text-chalk">www · subdomain</span>
                  Add a <span className="text-lagoon">CNAME</span> pointing at
                  the host-provided URL, e.g.{" "}
                  <span className="font-mono text-[12px] text-mint">cname.vercel-dns.com</span>
                </li>
                <li className="border-l-2 border-line pl-4">
                  <span className="block font-mono text-[12px] text-chalk">canonical host</span>
                  Pick one of the two and 301 the other to it, so you never
                  split analytics or SEO between them.
                </li>
              </ul>
              <p className="mt-5 border-t border-line-soft pt-4 text-[13px] leading-relaxed text-fog">
                TLS certificates are issued automatically on all four hosts —
                usually within a minute of the DNS record propagating. Never
                hand-roll a certificate for a static site in 2026.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
