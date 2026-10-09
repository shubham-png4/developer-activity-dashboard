import { stackTicker } from "@/data/sprint";

export function Marquee() {
  const row = [...stackTicker, ...stackTicker];
  return (
    <div className="group relative mt-16 overflow-hidden border-y border-line-soft bg-ink-2/50 py-3.5">
      <div className="flex w-max animate-marquee items-center gap-8 group-hover:[animation-play-state:paused]">
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.28em] text-fog/70"
          >
            {item}
            <span className="text-signal/50">◆</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
