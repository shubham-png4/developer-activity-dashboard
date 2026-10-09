import { useState } from "react";
import { cn } from "@/utils/cn";

type Props = {
  file: string;
  lang: string;
  code: string;
  note?: string;
  className?: string;
};

const KEYWORDS =
  "const|let|var|function|return|import|export|from|default|type|interface|extends|new|if|else|try|catch|finally|async|await|for|while|of|in|null|true|false|as|use|permissions|jobs|steps|runs-on";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** One-pass, dependency-free token highlighter. Strings win over comments. */
function highlight(code: string, lang: string) {
  const hashComment = ["bash", "sh", "shell", "toml", "yaml", "yml"].includes(lang);
  const hexColor = lang === "css";

  const parts = [
    "(?<comment>/\\*[\\s\\S]*?\\*/|//[^\\n]*" +
      (hashComment ? "|#[^\\n]*" : "") +
      "|&lt;!--[\\s\\S]*?--&gt;)",
    "(?<string>\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*')",
    hexColor ? "(?<hex>#[0-9a-fA-F]{3,8}\\b)" : "",
    `(?<keyword>\\b(?:${KEYWORDS})\\b)`,
    "(?<number>\\b\\d+(?:\\.\\d+)?\\b)",
  ]
    .filter(Boolean)
    .join("|");

  const re = new RegExp(parts, "g");

  return escapeHtml(code).replace(re, (m, ...rest) => {
    const groups = rest[rest.length - 1] as Record<string, string | undefined>;
    if (groups.comment) return `<span class="text-fog/60 italic">${m}</span>`;
    if (groups.string) return `<span class="text-mint">${m}</span>`;
    if (groups.hex) return `<span class="text-lagoon">${m}</span>`;
    if (groups.keyword) return `<span class="text-amber font-medium">${m}</span>`;
    if (groups.number) return `<span class="text-signal/90">${m}</span>`;
    return m;
  });
}

export function CodeBlock({ file, lang, code, note, className }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.replace(/[\\/]/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = code.split("\n");
  const isDiff = lang === "diff";

  return (
    <figure
      className={cn(
        "group/code overflow-hidden rounded-xl border border-line bg-[#080e10] shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <figcaption className="flex items-center gap-3 border-b border-line-soft bg-panel/70 px-3 py-2">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-signal/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-amber/60" />
          <i className="h-2.5 w-2.5 rounded-full bg-mint/60" />
        </span>
        <span className="truncate font-mono text-[11px] tracking-tight text-chalk/80">
          {file}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-fog sm:inline">
            {lang}
          </span>
          <button
            onClick={download}
            title="Download this file"
            className="rounded border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-fog transition hover:border-lagoon hover:text-lagoon"
          >
            save
          </button>
          <button
            onClick={copy}
            className={cn(
              "rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition",
              copied
                ? "border-mint bg-mint/15 text-mint"
                : "border-line text-fog hover:border-signal hover:text-signal",
            )}
          >
            {copied ? "copied ✓" : "copy"}
          </button>
        </span>
      </figcaption>

      <div className="relative overflow-x-auto">
        <pre className="min-w-full py-3 font-mono text-[12.5px] leading-[1.75]">
          <code>
            {lines.map((line, i) => {
              const html = isDiff ? escapeHtml(line) : highlight(line, lang);
              const tone = isDiff
                ? line.startsWith("+")
                  ? "text-mint bg-mint/[0.07]"
                  : line.startsWith("-")
                    ? "text-signal bg-signal/[0.07]"
                    : "text-fog"
                : "text-chalk/85";
              return (
                <span
                  key={i}
                  className={cn(
                    "grid grid-cols-[3rem_1fr] hover:bg-white/[0.03]",
                    tone,
                  )}
                >
                  <span className="select-none pr-3 text-right text-fog/35">
                    {i + 1}
                  </span>
                  <span
                    className="whitespace-pre pr-6"
                    dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }}
                  />
                </span>
              );
            })}
          </code>
        </pre>
      </div>

      {note && (
        <figcaption className="border-t border-line-soft bg-panel/50 px-4 py-2.5 text-[12.5px] leading-relaxed text-fog">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-widest text-amber">
            note
          </span>
          {note}
        </figcaption>
      )}
    </figure>
  );
}
