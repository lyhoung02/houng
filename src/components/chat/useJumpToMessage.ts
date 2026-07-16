"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HIGHLIGHT_MS = 1600;

/**
 * Scroll-to-quoted-message: register each rendered message node, and jumpTo()
 * smooth-scrolls the original into view with a brief highlight ring.
 */
export function useJumpToMessage() {
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  /** Ref callback for the wrapper of message `id`. */
  const register = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) nodes.current.set(id, el);
      else nodes.current.delete(id);
    },
    [],
  );

  const jumpTo = useCallback((id: string) => {
    const el = nodes.current.get(id);
    // The original may be deleted or outside the loaded window — then no-op.
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
  }, []);

  /** Classes for the wrapper of message `id`. */
  const highlightClass = useCallback(
    (id: string) =>
      `rounded-2xl transition-shadow duration-300 ${
        highlightId === id ? "ring-2 ring-indigo-400/60" : ""
      }`,
    [highlightId],
  );

  return { register, jumpTo, highlightClass };
}
