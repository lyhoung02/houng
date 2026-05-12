"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useT } from "./providers/LanguageProvider";
import { SectionHeader } from "./About";
import { DEFAULT_PLAYGROUND_CODE } from "@/lib/playground-default";

export default function Playground() {
  const t = useT();
  const [code, setCode] = useState(DEFAULT_PLAYGROUND_CODE);
  const [debounced, setDebounced] = useState(DEFAULT_PLAYGROUND_CODE);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Debounce updates to the iframe so typing stays responsive.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(code), 280);
    return () => window.clearTimeout(id);
  }, [code]);

  const lineCount = useMemo(() => code.split("\n").length, [code]);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const reset = () => {
    setCode(DEFAULT_PLAYGROUND_CODE);
    textareaRef.current?.focus();
  };

  // Insert a tab character instead of leaving the field on Tab.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart, selectionEnd } = ta;
      const next =
        code.slice(0, selectionStart) + "  " + code.slice(selectionEnd);
      setCode(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = selectionStart + 2;
      });
    }
  };

  return (
    <section id="playground" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.playground.eyebrow}
          title={t.playground.title}
          description={t.playground.description}
        />

        <div className="mt-12 glass rounded-2xl overflow-hidden border border-white/10">
          <div className="grid lg:grid-cols-2">
            {/* ---------------------- Editor ---------------------- */}
            <div className="border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 text-[11px] font-mono text-white/55">
                    {t.playground.filename}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[11px] rounded-md px-2 py-1 border border-white/10 bg-white/[0.04] text-white/75 hover:text-white hover:border-white/20 transition"
                  >
                    {t.playground.reset}
                  </button>
                  <button
                    type="button"
                    onClick={copy}
                    aria-live="polite"
                    className={`inline-flex items-center gap-1.5 text-[11px] rounded-md px-2 py-1 border transition ${
                      copied
                        ? "bg-emerald-400/15 border-emerald-400/30 text-emerald-200"
                        : "bg-white/[0.04] border-white/10 text-white/75 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {copied ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12.5l4 4 10-10"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="9"
                          y="9"
                          width="11"
                          height="11"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M5 15V6a2 2 0 0 1 2-2h9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {copied ? t.playground.copied : t.playground.copy}
                  </button>
                </div>
              </div>
              <div className="relative flex-1 bg-slate-950/40">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-10 sm:w-12 overflow-hidden bg-white/[0.02] border-r border-white/5 font-mono text-[11px] sm:text-[12px] text-white/30 select-none whitespace-pre pt-4 leading-[1.55] text-right pr-2"
                >
                  {lineNumbers}
                </div>
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  wrap="off"
                  className="block w-full h-[460px] sm:h-[520px] pl-12 sm:pl-14 pr-3 py-4 font-mono text-[11px] sm:text-[12px] leading-[1.55] bg-transparent text-white/85 placeholder-white/30 resize-none focus:outline-none overflow-auto"
                />
              </div>
            </div>

            {/* ---------------------- Preview ---------------------- */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
                <div className="inline-flex items-center gap-2 text-[11px] text-white/55">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
                  {t.playground.preview}
                </div>
                <span className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                  iframe · sandbox
                </span>
              </div>
              <div className="relative flex-1 bg-slate-950">
                <iframe
                  title="Playground preview"
                  srcDoc={debounced}
                  sandbox="allow-scripts"
                  className="block w-full h-[460px] sm:h-[520px] bg-slate-950"
                />
              </div>
            </div>
          </div>

          <p className="border-t border-white/10 px-4 py-2.5 text-[11px] text-white/45">
            {t.playground.hint}
          </p>
        </div>
      </div>
    </section>
  );
}
