const DOCS = [
  ["Vite", "https://vite.dev/guide/"],
  ["React", "https://react.dev/learn"],
  ["Tailwind v4", "https://tailwindcss.com/docs/installation/using-vite"],
  ["marked", "https://marked.js.org/"],
  ["DOMPurify", "https://github.com/cure53/DOMPurify"],
];

const HOSTS = [
  ["Vercel docs", "https://vercel.com/docs"],
  ["Netlify docs", "https://docs.netlify.com/"],
  ["Cloudflare Pages", "https://developers.cloudflare.com/pages/"],
  ["GitHub Pages", "https://docs.github.com/pages"],
  ["Lighthouse", "https://developer.chrome.com/docs/lighthouse/overview"],
];

export function Footer() {
  return (
    <footer className="relative mt-10 border-t border-line bg-ink-2/40">
      <div className="mx-auto max-w-[88rem] px-5 md:px-8">
        <div className="grid gap-10 py-14 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
          <div>
            <div className="font-display text-[22px] font-extrabold tracking-tight">
              SHIP<span className="text-signal">/</span>2H
            </div>
            <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-fog">
              A build sprint you can run this afternoon. Start the clock at
              minute zero, work top to bottom, and finish with a URL you can
              send to somebody.
            </p>
            <a
              href="#top"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-chalk transition hover:border-signal hover:bg-signal hover:text-white"
            >
              ↑ back to the clock
            </a>
          </div>

          <nav>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fog/60">
              documentation
            </div>
            <ul className="mt-4 space-y-2.5">
              {DOCS.map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-1.5 text-[14px] text-fog transition-colors hover:text-chalk"
                  >
                    <span className="h-px w-0 bg-signal transition-all duration-300 group-hover:w-3" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fog/60">
              hosting
            </div>
            <ul className="mt-4 space-y-2.5">
              {HOSTS.map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-1.5 text-[14px] text-fog transition-colors hover:text-chalk"
                  >
                    <span className="h-px w-0 bg-lagoon transition-all duration-300 group-hover:w-3" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* oversized wordmark */}
        <div className="select-none overflow-hidden border-t border-line-soft pt-8">
          <div
            className="whitespace-nowrap text-center font-display text-[clamp(3.4rem,17vw,15rem)] font-extrabold leading-[0.8] tracking-tighter text-transparent"
            style={{ WebkitTextStroke: "1px rgba(139,162,159,0.18)" }}
          >
            SHIP IT TODAY
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-line-soft py-6 font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog/60 sm:flex-row sm:items-center sm:justify-between">
          <span>120 minutes · 8 phases · 1 live url</span>
          <span>
            timer &amp; checklist persist in your browser only — nothing is sent
            anywhere
          </span>
        </div>
      </div>
    </footer>
  );
}
