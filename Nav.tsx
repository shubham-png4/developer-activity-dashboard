import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "#sprint", label: "Sprint" },
  { href: "#deploy", label: "Deploy" },
  { href: "#verify", label: "Verify" },
];

export function Nav({
  mmss,
  running,
  onStart,
}: {
  mmss: string;
  running: boolean;
  onStart: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[88rem] items-center gap-4 px-5 py-3.5 md:px-8">
        <a href="#top" className="group flex items-center gap-2.5">
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute inset-0 rounded-[9px] bg-signal/20 transition-transform duration-500 group-hover:rotate-45" />
            <span className="absolute inset-[3px] rounded-[6px] border border-signal/60" />
            <span className="relative font-mono text-[10px] font-bold text-signal">2h</span>
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-tight">
            SHIP<span className="text-signal">/</span>2H
          </span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-fog transition hover:bg-white/5 hover:text-chalk"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[12px] tabular-nums transition",
              running
                ? "border-mint/40 bg-mint/10 text-mint"
                : "border-line bg-panel/60 text-fog",
            )}
            title={running ? "Clock running" : "Clock paused"}
          >
            <span className="relative flex h-1.5 w-1.5">
              {running && (
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-mint" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-1.5 w-1.5 rounded-full",
                  running ? "bg-mint" : "bg-fog/60",
                )}
              />
            </span>
            {mmss}
          </div>
          <button
            onClick={onStart}
            className="rounded-full bg-chalk px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-signal hover:text-white active:scale-95"
          >
            {running ? "Pause" : "Start"}
          </button>
        </div>
      </div>
    </header>
  );
}
