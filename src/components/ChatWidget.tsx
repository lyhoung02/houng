"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useT } from "./providers/LanguageProvider";

type Role = "bot" | "user";

type Message = {
  id: string;
  role: Role;
  text: string;
  ts: number;
};

type ReplyKey = keyof ReturnType<typeof useT>["chat"]["replies"];

const STORAGE_KEY = "houng.chat";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function detectIntent(input: string): ReplyKey {
  const s = input.toLowerCase();
  if (/(hi|hello|hey|សួស្តី|សួ​ស្តី)/.test(s)) return "greeting";
  if (/(hire|job|work|freelance|outsourc|ការងារ|ជួល)/.test(s)) return "hire";
  if (/(project|portfolio|គម្រោង)/.test(s)) return "projects";
  if (/(stack|tech|skill|បច្ចេកវិទ្យា|ជំនាញ|stack)/.test(s)) return "stack";
  if (/(phone|call|number|ទូរសព្ទ|លេខ)/.test(s)) return "phone";
  if (/(resume|cv|ប្រវត្តិរូប)/.test(s)) return "resume";
  if (/(email|អ៊ីមែល|mail)/.test(s)) return "email";
  if (/(thanks|thank you|អរគុណ|thx)/.test(s)) return "thanks";
  return "default";
}

export default function ChatWidget() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const greeted = useRef(false);

  // Restore prior messages
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  // Initial welcome message when first opened
  useEffect(() => {
    if (!open || greeted.current || messages.length > 0) return;
    greeted.current = true;
    const id = uid();
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id, role: "bot", text: t.chat.welcome, ts: Date.now() },
      ]);
    }, 700);
    return () => clearTimeout(timer);
  }, [open, messages.length, t.chat.welcome]);

  const sendUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMsg: Message = {
        id: uid(),
        role: "user",
        text: trimmed,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setTyping(true);
      const intent = detectIntent(trimmed);
      const reply = t.chat.replies[intent];
      // Variable thinking time so it feels real
      const delay = 600 + Math.min(reply.length * 18, 1400);
      window.setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "bot", text: reply, ts: Date.now() },
        ]);
      }, delay);
    },
    [t.chat.replies],
  );

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage(input);
    }
  };

  const suggestions = useMemo(() => t.chat.suggestions, [t.chat.suggestions]);
  const showSuggestions = messages.length <= 1 && !typing;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        aria-label={open ? t.chat.close : t.chat.open}
        onClick={() => setOpen((v) => !v)}
        className={`no-print fixed bottom-5 right-5 z-50 inline-flex items-center justify-center h-14 w-14 rounded-full shadow-lg shadow-indigo-500/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
          open
            ? "bg-slate-900 text-white"
            : "bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white hover:scale-105"
        }`}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        role="dialog"
        aria-label={t.chat.title}
        aria-hidden={!open}
        className={`no-print fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-[380px] origin-bottom-right transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="glass rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-slate-950/40 flex flex-col h-[70vh] max-h-[560px]">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-cyan-400/20">
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-400 shrink-0">
              <Image
                src="/profile-nobg.png"
                alt=""
                fill
                sizes="40px"
                className="object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {t.chat.title}
              </p>
              <p className="text-[11px] text-white/70 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t.chat.status} · {t.chat.subtitle}
              </p>
            </div>
            <button
              type="button"
              aria-label={t.chat.close}
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-2.5"
          >
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} />
            ))}
            {typing && <Typing label={t.chat.typing} />}
            {showSuggestions && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendUserMessage(s)}
                    className="text-[11px] rounded-full px-2.5 py-1 border border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer / input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={t.chat.placeholder}
                className="flex-1 resize-none rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 max-h-24"
              />
              <button
                type="button"
                aria-label={t.chat.send}
                onClick={() => sendUserMessage(input)}
                disabled={!input.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 11l18-8-8 18-2-8-8-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-[10px] text-white/40 leading-snug text-center">
              {t.chat.demoNote}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          mine
            ? "bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-br-md"
            : "bg-white/[0.06] text-white rounded-bl-md border border-white/10"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function Typing({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-white/[0.06] border border-white/10 px-3 py-2 flex items-center gap-1.5">
        <Dot />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse"
      style={delay ? { animationDelay: delay } : undefined}
    />
  );
}
