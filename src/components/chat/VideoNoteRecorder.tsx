"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRecorder } from "@/lib/media/useRecorder";
import { formatDuration } from "@/lib/supabase/attachments";
import type { Recording } from "@/lib/media/useRecorder";

/** Telegram-style round selfie note: live circular preview, tap to stop. */
export function VideoNoteRecorder({
  onDone,
  onClose,
  cancelLabel,
  sendLabel,
}: {
  onDone: (rec: Recording) => void;
  onClose: () => void;
  cancelLabel: string;
  sendLabel: string;
}) {
  const rec = useRecorder("video", (r) => {
    onDone(r);
    onClose();
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void rec.start();
  }, [rec]);

  // Attach the live camera feed to the preview element.
  useEffect(() => {
    if (videoRef.current && rec.stream) {
      videoRef.current.srcObject = rec.stream;
    }
  }, [rec.stream]);

  const pct = Math.min(rec.elapsedMs / rec.maxMs, 1);

  // Portalled to <body>: the chat panel is transformed (translate-y) and
  // overflow-hidden, which would make it the containing block for a fixed
  // child and clip the preview — that's what pushed the stop/cancel controls
  // out of sight. Rendering outside the panel escapes both.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-sm grid place-items-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-48 w-48">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            // Mirrored so it reads like a selfie preview.
            className="h-48 w-48 rounded-full object-cover scale-x-[-1] bg-slate-800"
          />
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeDasharray={`${pct * 301.6} 301.6`}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {rec.error ? (
          <p className="text-xs text-rose-300 text-center max-w-[220px]">{rec.error}</p>
        ) : (
          <p className="text-sm text-white/80 tabular-nums">
            {formatDuration(rec.elapsedMs)} / {formatDuration(rec.maxMs)}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              rec.cancel();
              onClose();
            }}
            className="rounded-full px-4 py-2 text-sm border border-white/15 text-white/80 hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          {!rec.error && (
            <button
              type="button"
              onClick={rec.stop}
              disabled={!rec.recording}
              className="rounded-full h-12 w-12 grid place-items-center bg-rose-500 text-white disabled:opacity-40 hover:scale-105 transition"
              aria-label={sendLabel}
            >
              <span className="h-4 w-4 rounded-sm bg-white" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
