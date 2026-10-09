export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* colour wash */}
      <div
        className="absolute inset-0 animate-drift"
        style={{
          background:
            "radial-gradient(58rem 34rem at 12% -6%, rgba(255,77,46,0.20), transparent 62%)," +
            "radial-gradient(48rem 30rem at 88% 4%, rgba(76,196,214,0.16), transparent 60%)," +
            "radial-gradient(60rem 40rem at 55% 108%, rgba(53,224,140,0.10), transparent 62%)",
        }}
      />
      {/* blueprint grid */}
      <div
        className="grid-paper absolute inset-0 opacity-70"
        style={{
          maskImage:
            "radial-gradient(120% 90% at 50% 0%, #000 25%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 50% 0%, #000 25%, transparent 85%)",
        }}
      />
      {/* scanline */}
      <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-signal/[0.05] to-transparent" />
      {/* grain */}
      <div className="noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_45%,rgba(4,8,9,0.85)_100%)]" />
    </div>
  );
}
