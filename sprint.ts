export type Snippet = {
  file: string;
  lang: string;
  code: string;
  note?: string;
};

export type Phase = {
  id: string;
  index: number;
  start: number; // minutes into the sprint
  minutes: number;
  title: string;
  verb: string;
  summary: string;
  tasks: string[];
  snippets: Snippet[];
  accent: "signal" | "amber" | "mint" | "lagoon";
};

export const SPRINT_TOTAL_MIN = 120;

export const phases: Phase[] = [
  {
    id: "p0",
    index: 0,
    start: 0,
    minutes: 8,
    title: "Scaffold & commit",
    verb: "BOOT",
    accent: "signal",
    summary:
      "Empty folder to running dev server. Do not design yet, do not open Figma. The goal of minute eight is a green terminal and a first commit.",
    tasks: [
      "Create the Vite + React + TS app",
      "Install Tailwind v4 and the markdown deps",
      "git init and make the first commit",
      "Open the dev server and confirm it renders",
    ],
    snippets: [
      {
        file: "terminal",
        lang: "bash",
        code: `npm create vite@latest signal -- --template react-ts
cd signal
npm install

# Tailwind v4 is one package + one vite plugin. No config file needed.
npm install tailwindcss @tailwindcss/vite

# Markdown rendering, sanitised
npm install marked dompurify

git init
git add -A
git commit -m "chore: scaffold vite + react + ts + tailwind"`,
        note: "Eight minutes. If a prompt asks you anything, accept the defaults and move on.",
      },
    ],
  },
  {
    id: "p1",
    index: 1,
    start: 8,
    minutes: 12,
    title: "Design tokens",
    verb: "TUNE",
    accent: "amber",
    summary:
      "Decide the whole visual language in one file. Colours, type scale and fonts declared up front stop you re-litigating them at minute ninety.",
    tasks: [
      "Register the Tailwind plugin in vite.config.ts",
      "Declare colours + fonts as @theme tokens",
      "Load two fonts: one display, one body",
      "Add base styles and a selection colour",
    ],
    snippets: [
      {
        file: "vite.config.ts",
        lang: "ts",
        code: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: true },
});`,
      },
      {
        file: "src/index.css",
        lang: "css",
        code: `@import "tailwindcss";

@theme {
  --color-ink:    #0a1012;
  --color-panel:  #101a1c;
  --color-line:   #22322f;
  --color-fog:    #8ba29f;
  --color-chalk:  #e9f1ee;
  --color-signal: #ff4d2e;
  --color-mint:   #35e08c;
  --color-amber:  #ffb020;

  --font-display: "Bricolage Grotesque", sans-serif;
  --font-sans:    "IBM Plex Sans", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", monospace;
}

@layer base {
  body { background: var(--color-ink); color: var(--color-chalk); }
  h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.03em; }
  ::selection { background: var(--color-signal); color: #fff; }
}`,
        note: "Token names become utilities: --color-signal gives you bg-signal, text-signal, border-signal.",
      },
      {
        file: "index.html",
        lang: "html",
        code: `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />`,
      },
    ],
  },
  {
    id: "p2",
    index: 2,
    start: 20,
    minutes: 15,
    title: "Layout shell",
    verb: "FRAME",
    accent: "lagoon",
    summary:
      "Build the skeleton with ugly grey boxes first. Header, main, footer, container widths. Structure before surface — you cannot polish a layout that does not exist.",
    tasks: [
      "Header with wordmark and nav",
      "Container + grid gutters",
      "Empty-state panel where the app will live",
      "Check it at 375px and 1440px before styling",
    ],
    snippets: [
      {
        file: "src/App.tsx",
        lang: "tsx",
        code: `import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Workspace } from "./components/Workspace";

export default function App() {
  return (
    <div className="min-h-dvh bg-ink text-chalk">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8">
        <Workspace />
      </main>
      <Footer />
    </div>
  );
}`,
      },
      {
        file: "src/components/Header.tsx",
        lang: "tsx",
        code: `const links = ["Notes", "About", "Deploy"];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="#" className="font-display text-xl font-extrabold tracking-tight">
          SIGNAL<span className="text-signal">.</span>
        </a>
        <nav className="hidden gap-7 font-mono text-xs uppercase tracking-widest text-fog md:flex">
          {links.map((l) => (
            <a key={l} href={"#" + l.toLowerCase()}
               className="transition-colors hover:text-chalk">{l}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}`,
      },
    ],
  },
  {
    id: "p3",
    index: 3,
    start: 35,
    minutes: 25,
    title: "Core feature",
    verb: "BUILD",
    accent: "signal",
    summary:
      "The one thing that makes this an app and not a landing page. Write it, then stop. Everything after this point is garnish.",
    tasks: [
      "Note list state with an id, title, body, updatedAt",
      "Editor + live markdown preview side by side",
      "Sanitise the HTML before injecting it",
      "Create, edit, delete, search",
    ],
    snippets: [
      {
        file: "src/hooks/usePersistentState.ts",
        lang: "ts",
        code: `import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode / quota — ignore */
    }
  }, [key, value]);

  return [value, setValue] as const;
}`,
      },
      {
        file: "src/components/Preview.tsx",
        lang: "tsx",
        code: `import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

export function Preview({ source }: { source: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(source, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [source]);

  return (
    <article
      className="prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}`,
        note: "Never pipe user markdown into innerHTML without sanitising it.",
      },
      {
        file: "src/components/Workspace.tsx",
        lang: "tsx",
        code: `import { usePersistentState } from "../hooks/usePersistentState";
import { Preview } from "./Preview";

type Note = { id: string; title: string; body: string; updatedAt: number };

const uid = () => Math.random().toString(36).slice(2, 9);

export function Workspace() {
  const [notes, setNotes] = usePersistentState<Note[]>("signal.notes", []);
  const [activeId, setActiveId] = usePersistentState<string | null>(
    "signal.active",
    null
  );
  const [query, setQuery] = usePersistentState("signal.query", "");

  const active = notes.find((n) => n.id === activeId) ?? null;
  const visible = notes
    .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  function create() {
    const note: Note = { id: uid(), title: "Untitled", body: "", updatedAt: Date.now() };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  }

  function patch(id: string, next: Partial<Note>) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...next, updatedAt: Date.now() } : n))
    );
  }

  function remove(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-signal"
          />
          <button onClick={create}
            className="rounded-md bg-signal px-3 text-sm font-semibold text-white">
            New
          </button>
        </div>
        <ul className="space-y-1">
          {visible.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setActiveId(n.id)}
                className={
                  "w-full rounded-md px-3 py-2 text-left text-sm transition " +
                  (n.id === activeId ? "bg-panel text-chalk" : "text-fog hover:bg-panel/60")
                }>
                {n.title || "Untitled"}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {active ? (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <input
              value={active.title}
              onChange={(e) => patch(active.id, { title: e.target.value })}
              className="w-full bg-transparent font-display text-2xl font-bold outline-none"
            />
            <textarea
              value={active.body}
              onChange={(e) => patch(active.id, { body: e.target.value })}
              rows={18}
              className="w-full resize-none rounded-lg border border-line bg-panel p-4 font-mono text-sm outline-none focus:border-lagoon"
            />
            <button onClick={() => remove(active.id)}
              className="font-mono text-xs uppercase text-fog hover:text-signal">
              Delete note
            </button>
          </div>
          <div className="rounded-lg border border-line bg-panel/60 p-5">
            <Preview source={active.body} />
          </div>
        </section>
      ) : (
        <EmptyState onCreate={create} />
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-start justify-center gap-3 rounded-lg border border-dashed border-line p-8">
      <p className="font-display text-2xl">Nothing here yet.</p>
      <p className="max-w-sm text-sm text-fog">
        Notes are saved to this browser automatically. No account, no server.
      </p>
      <button onClick={onCreate}
        className="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-ink">
        Write the first one
      </button>
    </div>
  );
}`,
      },
    ],
  },
  {
    id: "p4",
    index: 4,
    start: 60,
    minutes: 15,
    title: "Motion & feedback",
    verb: "ALIVE",
    accent: "mint",
    summary:
      "Halfway. Now make it respond to touch: every interactive element gets a hover state, a transition and a visible focus ring. This is the difference between a demo and a product.",
    tasks: [
      "Transitions on every button, link and card",
      "Scroll-reveal for below-the-fold sections",
      "Focus-visible rings for keyboard users",
      "One ambient background layer (grid, glow, grain)",
    ],
    snippets: [
      {
        file: "src/components/Reveal.tsx",
        lang: "tsx",
        code: `import { useEffect, useRef, type ReactNode } from "react";

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = delay + "ms";
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  );
}`,
      },
      {
        file: "src/index.css  (append)",
        lang: "css",
        code: `.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .7s cubic-bezier(.16,1,.3,1),
              transform .7s cubic-bezier(.16,1,.3,1);
}
.reveal.is-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}`,
      },
    ],
  },
  {
    id: "p5",
    index: 5,
    start: 75,
    minutes: 12,
    title: "Responsive & a11y pass",
    verb: "FIT",
    accent: "lagoon",
    summary:
      "Open devtools, switch to an iPhone-sized viewport, and fix everything that breaks. Then tab through the whole app with the keyboard only.",
    tasks: [
      "Stack columns under 768px",
      "No horizontal scroll at 320px",
      "Labels on every input, alt text on images",
      "Contrast check on body text (aim 4.5:1)",
    ],
    snippets: [
      {
        file: "src/components/Workspace.tsx  (diff)",
        lang: "diff",
        code: `- <div className="grid gap-6 grid-cols-[280px_1fr]">
+ <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

- <input value={query} onChange={...} placeholder="Search…" />
+ <label className="sr-only" htmlFor="q">Search notes</label>
+ <input id="q" type="search" value={query} onChange={...} placeholder="Search…" />

- <textarea rows={18} />
+ <textarea rows={12} className="min-h-40 md:min-h-0" aria-label="Note body" />`,
      },
    ],
  },
  {
    id: "p6",
    index: 6,
    start: 87,
    minutes: 13,
    title: "Production build",
    verb: "PACK",
    accent: "amber",
    summary:
      "The dev server lies to you. Build for real, serve the output locally, and walk every route. Add the metadata that makes the link look good when someone pastes it.",
    tasks: [
      "npm run build with zero errors",
      "npm run preview and click through everything",
      "Title, description, favicon, OG tags",
      "Commit and push to a remote repository",
    ],
    snippets: [
      {
        file: "terminal",
        lang: "bash",
        code: `npm run build      # -> dist/
npm run preview    # serve the real build on :4173

git add -A
git commit -m "feat: signal markdown scratchpad"
git branch -M main
git remote add origin https://github.com/YOU/signal.git
git push -u origin main`,
      },
      {
        file: "index.html  (head)",
        lang: "html",
        code: `<title>Signal — a markdown scratchpad</title>
<meta name="description" content="Fast, private markdown notes that live in your browser." />
<meta property="og:title" content="Signal" />
<meta property="og:description" content="Fast, private markdown notes." />
<meta property="og:image" content="/og.png" />
<meta name="theme-color" content="#0a1012" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>" />`,
      },
    ],
  },
  {
    id: "p7",
    index: 7,
    start: 100,
    minutes: 20,
    title: "Deploy & verify",
    verb: "SHIP",
    accent: "signal",
    summary:
      "Last twenty minutes. Pick one host below, connect the repo, let it build, and watch the live URL. Then set up the domain and check the score.",
    tasks: [
      "Choose a host in the Deploy tab",
      "Connect the repo — build npm run build, output dist",
      "Confirm the live URL loads and works",
      "Run Lighthouse, fix anything under 90",
    ],
    snippets: [
      {
        file: "the short version",
        lang: "bash",
        code: `# Vercel  — fastest path from zero to https://
npm i -g vercel
vercel --prod

# Netlify — drag dist/ into the dashboard, or:
npm i -g netlify-cli
netlify deploy --prod --dir=dist

# Cloudflare Pages
npm i -g wrangler
wrangler pages deploy dist --project-name=signal`,
        note: "Full step-by-step instructions, config files and a host comparison live in the Deploy tab below.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */

export type Provider = {
  id: string;
  name: string;
  tag: string;
  blurb: string;
  best: string;
  minutes: string;
  free: string;
  domain: string;
  previews: string;
  steps: { t: string; d: string }[];
  commands: string[];
  config: Snippet;
  accent: "signal" | "mint" | "amber" | "lagoon";
};

export const providers: Provider[] = [
  {
    id: "vercel",
    name: "Vercel",
    tag: "recommended",
    accent: "signal",
    blurb:
      "Zero-config for Vite. Import the repo, it detects the framework, done. Every push to any branch gets its own preview URL.",
    best: "First deploy, preview URLs, edge network",
    minutes: "~4 min",
    free: "100 GB bandwidth / mo, unlimited preview deploys",
    domain: "Free custom domain, automatic TLS",
    previews: "One URL per branch and per pull request",
    steps: [
      { t: "Push the repo to GitHub", d: "Vercel builds from git, not from your laptop." },
      { t: "vercel.com → Add New → Project", d: "Sign in with GitHub and import the repository." },
      { t: "Confirm the preset", d: "Framework: Vite · Build: npm run build · Output: dist. Leave the rest alone." },
      { t: "Hit Deploy", d: "First build takes 30–60 seconds. You get a *.vercel.app URL." },
      { t: "Add a custom domain", d: "Settings → Domains, then point an A or CNAME record as instructed." },
    ],
    commands: [
      "npm i -g vercel",
      "vercel login",
      "vercel            # preview deploy, asks 5 questions",
      "vercel --prod     # ship it to the live URL",
    ],
    config: {
      file: "vercel.json",
      lang: "json",
      code: `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}`,
      note: "Optional — Vercel auto-detects Vite. Only add this for SPA rewrites and asset caching.",
    },
  },
  {
    id: "netlify",
    name: "Netlify",
    accent: "lagoon",
    tag: "drag & drop",
    blurb:
      "The most forgiving host. You can literally drag the dist folder onto a browser tab and have a live site in ten seconds.",
    best: "Forms, redirects, instant manual deploys",
    minutes: "~3 min",
    free: "100 GB bandwidth / mo, 300 build minutes",
    domain: "Free custom domain, automatic TLS",
    previews: "Deploy Previews on every pull request",
    steps: [
      { t: "app.netlify.com → Add new site", d: "Choose 'Import an existing project' from GitHub, or 'Deploy manually'." },
      { t: "Set build command and publish dir", d: "Build: npm run build · Publish: dist" },
      { t: "Deploy", d: "Manual drag-and-drop of the dist/ folder works with no git at all." },
      { t: "Add SPA redirect", d: "netlify.toml or a public/_redirects file so client routes don't 404." },
      { t: "Domain settings", d: "Domain management → Add custom domain, then update your DNS." },
    ],
    commands: [
      "npm i -g netlify-cli",
      "netlify login",
      "netlify init                 # link folder to a new site",
      "netlify deploy --prod --dir=dist",
    ],
    config: {
      file: "netlify.toml",
      lang: "toml",
      code: `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[build.environment]
  NODE_VERSION = "20"`,
    },
  },
  {
    id: "cloudflare",
    name: "Cloudflare Pages",
    accent: "amber",
    tag: "cheapest egress",
    blurb:
      "Unmetered bandwidth on the free tier and a network that is very hard to beat. Slightly more setup, far better long-run economics.",
    best: "High traffic, no bandwidth bill",
    minutes: "~6 min",
    free: "Unlimited bandwidth, 500 builds / mo",
    domain: "Free custom domain, automatic TLS",
    previews: "Preview deployment per branch",
    steps: [
      { t: "dash.cloudflare.com → Workers & Pages", d: "Create → Pages → Connect to Git." },
      { t: "Authorise the repository", d: "Pick the repo you pushed in phase 6." },
      { t: "Build settings", d: "Framework preset: Vite · Build command: npm run build · Build output directory: dist" },
      { t: "Save and Deploy", d: "You get a *.pages.dev URL. Subsequent pushes redeploy automatically." },
      { t: "Custom domain", d: "If your DNS is already on Cloudflare it attaches in one click." },
    ],
    commands: [
      "npm i -g wrangler",
      "wrangler login",
      "wrangler pages project create signal",
      "wrangler pages deploy dist --project-name=signal",
    ],
    config: {
      file: "wrangler.toml",
      lang: "toml",
      code: `name = "signal"
compatibility_date = "2026-01-01"
pages_build_output_dir = "dist"

# Optional: cache immutable hashed assets aggressively
[[headers]]
  source = "/assets/*"
  [headers]
    Cache-Control = "public, max-age=31536000, immutable"`,
    },
  },
  {
    id: "github",
    name: "GitHub Pages",
    accent: "mint",
    tag: "free forever",
    blurb:
      "No account anywhere else, no build minutes, no cost. Best for portfolios and docs. You must set the Vite base path and publish via Actions.",
    best: "Portfolios, docs, zero budget",
    minutes: "~8 min",
    free: "Unlimited for public repos, 100 GB soft limit",
    domain: "Free custom domain + HTTPS, manual DNS",
    previews: "None natively — use Actions artifacts",
    steps: [
      { t: "Set the base path in vite.config.ts", d: "Must match your repo name exactly, with slashes on both sides." },
      { t: "Add the deploy workflow", d: ".github/workflows/deploy.yml runs on every push to main." },
      { t: "Enable Pages", d: "Repo → Settings → Pages → Source: GitHub Actions." },
      { t: "Push", d: "Watch the Actions tab go green; the URL is in the job summary." },
      { t: "Custom domain", d: "Add a CNAME file with your domain and set DNS in your registrar." },
    ],
    commands: [
      "# vite.config.ts -> base: \"/signal/\"",
      "npm run build",
      "npx gh-pages -d dist        # or push and let Actions do it",
    ],
    config: {
      file: ".github/workflows/deploy.yml",
      lang: "yaml",
      code: `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4`,
      note: "Also set base in vite.config.ts: base: \"/your-repo-name/\"",
    },
  },
];

export const launchChecks = [
  { id: "l1", label: "Live URL loads over HTTPS with no console errors", why: "Open devtools → Console on the deployed site, not localhost." },
  { id: "l2", label: "Every route works after a hard refresh", why: "Missing SPA rewrite rule is the #1 post-deploy bug." },
  { id: "l3", label: "Lighthouse: Performance, A11y, SEO all ≥ 90", why: "Devtools → Lighthouse → Analyse. Fix the red ones." },
  { id: "l4", label: "Open Graph image renders when the link is pasted", why: "Test at opengraph.xyz before sharing it anywhere." },
  { id: "l5", label: "Mobile pass on a real phone, not just devtools", why: "Touch targets, keyboard behaviour and 100dvh differ on device." },
  { id: "l6", label: "Analytics or privacy-respecting counter installed", why: "Plausible, Umami, or GoatCounter. You cannot improve what you cannot see." },
  { id: "l7", label: "Custom domain + www redirect configured", why: "Pick one canonical host and 301 the other to it." },
  { id: "l8", label: "README written with the live URL at the top", why: "The repo is the portfolio piece. Link the site in line one." },
];

export const stackTicker = [
  "VITE 7",
  "REACT 19",
  "TYPESCRIPT",
  "TAILWIND v4",
  "GIT",
  "VERCEL",
  "NETLIFY",
  "CLOUDFLARE",
  "GITHUB ACTIONS",
  "LIGHTHOUSE",
  "DOMPURIFY",
  "MARKED",
];
