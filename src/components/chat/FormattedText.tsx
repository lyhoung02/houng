"use client";

import { Fragment, useState } from "react";
import { useT } from "../providers/LanguageProvider";

/**
 * Telegram-style inline markup, stored as plain text markers in the message
 * body and rendered here as React nodes — no HTML ever parsed, so there is no
 * injection surface.
 *
 *   **bold**  *italic*  __underline__  ~~strike~~  ||spoiler||
 *   `code`    ```pre block```
 */

type SpecType = "pre" | "code" | "spoiler" | "bold" | "underline" | "strike" | "italic";

// Order = priority on ties (pre/code first so their contents stay raw).
const SPECS: { type: SpecType; re: RegExp }[] = [
  { type: "pre", re: /```([\s\S]+?)```/ },
  { type: "code", re: /`([^`\n]+)`/ },
  { type: "spoiler", re: /\|\|([\s\S]+?)\|\|/ },
  { type: "bold", re: /\*\*([\s\S]+?)\*\*/ },
  { type: "underline", re: /__([\s\S]+?)__/ },
  { type: "strike", re: /~~([\s\S]+?)~~/ },
  // Inner text must start and end with non-space, so "5 * 3 * 2" stays math.
  { type: "italic", re: /\*(\S(?:[^*\n]*\S)?)\*/ },
];

const MAX_DEPTH = 4;

function parseInline(text: string, depth: number): React.ReactNode[] {
  if (!text) return [];
  if (depth > MAX_DEPTH) return [text];

  // Earliest match wins; SPECS order breaks ties (so ** beats * at index 0).
  let best: { type: SpecType; m: RegExpExecArray } | null = null;
  for (const spec of SPECS) {
    const m = spec.re.exec(text);
    if (m && (best === null || m.index < best.m.index)) {
      best = { type: spec.type, m };
    }
  }
  if (!best) return [text];

  const { type, m } = best;
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + m[0].length);
  return [
    ...(before ? [before] : []),
    renderNode(type, m[1], depth),
    ...parseInline(after, depth),
  ];
}

function renderNode(type: SpecType, inner: string, depth: number): React.ReactNode {
  const children = withKeys(parseInline(inner, depth + 1));
  switch (type) {
    case "bold":
      return <strong>{children}</strong>;
    case "italic":
      return <em>{children}</em>;
    case "underline":
      return <u>{children}</u>;
    case "strike":
      return <s>{children}</s>;
    case "spoiler":
      return <Spoiler>{children}</Spoiler>;
    case "code":
      // Raw contents — markers inside code stay literal.
      return <CodeInline text={inner} />;
    case "pre":
      return <PreBlock text={inner.replace(/^\n|\n$/g, "")} />;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Tap to copy, like Telegram's inline code. */
function CodeInline({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <code
      role="button"
      tabIndex={0}
      title={copied ? t.playground.copied : t.playground.copy}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        void copyText(text).then((ok) => {
          if (!ok) return;
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={`font-mono text-[0.85em] rounded px-1 py-px cursor-pointer transition ${
        copied ? "bg-emerald-500/30" : "bg-black/20 dark:bg-white/15 hover:bg-black/30 dark:hover:bg-white/25"
      }`}
    >
      {text}
    </code>
  );
}

/** Code block with a copy button in the corner. */
function PreBlock({ text }: { text: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative my-1">
      <pre className="font-mono text-[0.85em] rounded-lg pl-2 pr-8 py-1.5 bg-black/20 dark:bg-white/10 overflow-x-auto whitespace-pre-wrap">
        {text}
      </pre>
      <button
        type="button"
        aria-label={copied ? t.playground.copied : t.playground.copy}
        title={copied ? t.playground.copied : t.playground.copy}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          void copyText(text).then((ok) => {
            if (!ok) return;
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-md text-current opacity-60 hover:opacity-100 hover:bg-white/10 transition"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}

const iconProps = {
  width: 13,
  height: 13,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function CopyIcon() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function withKeys(nodes: React.ReactNode[]): React.ReactNode {
  return nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>);
}

/** Hidden until tapped, like Telegram's spoiler. */
function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return <span className="rounded bg-white/10 px-0.5">{children}</span>;
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setRevealed(true);
      }}
      className="rounded px-0.5 cursor-pointer select-none blur-[5px] hover:blur-[4px] transition"
    >
      {children}
    </span>
  );
}

export function FormattedText({ text }: { text: string }) {
  return <>{withKeys(parseInline(text, 0))}</>;
}
