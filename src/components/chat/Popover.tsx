"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const MARGIN = 8;
/** Enough room above the trigger to open upward; otherwise flip below. */
const FLIP_THRESHOLD = 220;

/**
 * Anchored popover rendered at <body>. The chat panel is both transformed
 * (translate-y) and overflow-hidden, so anything absolutely positioned near its
 * edge gets clipped — portalling out and clamping to the viewport is what keeps
 * menus inside the safe area.
 *
 * `anchor` is a DOMRect captured in the click handler, so no measuring effect
 * is needed.
 */
export function Popover({
  anchor,
  width,
  onClose,
  children,
}: {
  anchor: DOMRect;
  width: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Any scroll would detach the menu from its bubble, so dismiss instead of
  // chasing it.
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  // Centre on the trigger, then pull back inside whichever edge it overruns.
  const centred = anchor.left + anchor.width / 2 - width / 2;
  const left = Math.min(
    Math.max(centred, MARGIN),
    window.innerWidth - width - MARGIN,
  );

  const openUpward = anchor.top > FLIP_THRESHOLD;
  const vertical = openUpward
    ? // Anchoring the bottom edge means the height doesn't need measuring.
      { bottom: window.innerHeight - anchor.top + MARGIN }
    : { top: anchor.bottom + MARGIN };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} />
      <div
        className="fixed z-[71] rounded-xl border border-border bg-background/95 backdrop-blur p-1 shadow-xl"
        style={{ left, width, ...vertical }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
