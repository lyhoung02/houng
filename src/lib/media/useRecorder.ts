"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderMode = "audio" | "video";

/** Chrome/Firefox produce webm; Safari only ever gives mp4. */
function pickMime(mode: RecorderMode): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates =
    mode === "audio"
      ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
      : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

export function recorderSupported() {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export type Recording = {
  blob: Blob;
  mime: string;
  durationMs: number;
};

export type RecorderState = {
  recording: boolean;
  elapsedMs: number;
  error: string | null;
  /** Live camera feed for the video-note preview. */
  stream: MediaStream | null;
};

const MAX_MS = 60_000;

export function useRecorder(mode: RecorderMode, onDone: (rec: Recording) => void) {
  const [state, setState] = useState<RecorderState>({
    recording: false,
    elapsedMs: 0,
    error: null,
    stream: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);
  // Kept in a ref so `start` doesn't need to be rebuilt when the callback
  // identity changes mid-recording.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => teardown, [teardown]);

  // Tick the elapsed counter while recording, and stop at the cap.
  useEffect(() => {
    if (!state.recording) return;
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed >= MAX_MS) {
        recorderRef.current?.stop();
        return;
      }
      setState((s) => ({ ...s, elapsedMs: elapsed }));
    }, 100);
    return () => window.clearInterval(id);
  }, [state.recording]);

  const start = useCallback(async () => {
    if (!recorderSupported()) {
      setState((s) => ({ ...s, error: "Recording isn't supported in this browser." }));
      return;
    }
    try {
      cancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia(
        mode === "audio"
          ? { audio: true }
          : { audio: true, video: { facingMode: "user", width: 480, height: 480 } },
      );
      streamRef.current = stream;

      const mime = pickMime(mode);
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const type = rec.mimeType || mime || "application/octet-stream";
        const blob = new Blob(chunksRef.current, { type });
        teardown();
        setState({ recording: false, elapsedMs: 0, error: null, stream: null });
        // A cancelled take is discarded; so is an empty one (instant tap).
        if (!cancelledRef.current && blob.size > 0 && durationMs > 300) {
          onDoneRef.current({ blob, mime: type.split(";")[0], durationMs });
        }
      };

      startedAtRef.current = Date.now();
      rec.start();
      setState({ recording: true, elapsedMs: 0, error: null, stream });
    } catch (e) {
      teardown();
      const denied = e instanceof DOMException && e.name === "NotAllowedError";
      setState({
        recording: false,
        elapsedMs: 0,
        stream: null,
        error: denied
          ? mode === "audio"
            ? "Microphone access denied."
            : "Camera access denied."
          : "Couldn't start recording.",
      });
    }
  }, [mode, teardown]);

  const stop = useCallback(() => {
    cancelledRef.current = false;
    recorderRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    } else {
      teardown();
      setState({ recording: false, elapsedMs: 0, error: null, stream: null });
    }
  }, [teardown]);

  return { ...state, start, stop, cancel, maxMs: MAX_MS };
}
