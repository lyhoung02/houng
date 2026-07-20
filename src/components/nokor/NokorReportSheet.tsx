"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { nokorErrorText } from "@/lib/supabase/nokorErrors";
import type { NokorReportKind, NokorReportReason } from "@/lib/supabase/types";
import { useT } from "../providers/LanguageProvider";

export type NokorReportTarget = {
  kind: NokorReportKind;
  id: string;
  /** The author being reported (target_user_id). */
  userId: string;
  /** Body text captured as evidence, if any. */
  snapshot?: string | null;
};

const REASONS: NokorReportReason[] = [
  "spam",
  "harassment",
  "nudity",
  "violence",
  "hate",
  "scam",
  "other",
];

/** Shared report dialog reused by every reportable surface (post, comment,
 *  message, story, profile). Inserts one nokor_reports row. */
export default function NokorReportSheet({
  meId,
  target,
  onClose,
}: {
  meId: string;
  target: NokorReportTarget;
  onClose: () => void;
}) {
  const t = useT();
  const r = t.nokor.report;
  const [reason, setReason] = useState<NokorReportReason>("spam");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const supabase = getSupabase();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    const { error: insErr } = await supabase.from("nokor_reports").insert({
      reporter_id: meId,
      target_kind: target.kind,
      target_id: target.id,
      target_user_id: target.userId,
      reason,
      note: note.trim() || null,
      snapshot: target.snapshot ?? null,
      source: "user",
    });
    setBusy(false);
    if (insErr) {
      // 23505 = the partial unique index: already an open report on this target.
      setError(insErr.code === "23505" ? r.already : nokorErrorText(insErr.message, t.nokor.errors));
      return;
    }
    setDone(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={r.title}
        className="glass w-full max-w-sm rounded-2xl border border-border p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">{r.success}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
            >
              {t.nokor.feed.cancel}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold">{r.title}</h2>
            <p className="mt-1 text-xs opacity-60">{r.reasonLabel}</p>
            <div className="mt-3 space-y-0.5">
              {REASONS.map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-surface-strong"
                >
                  <input
                    type="radio"
                    name="nokor-report-reason"
                    checked={reason === key}
                    onChange={() => setReason(key)}
                    className="accent-indigo-500"
                  />
                  {r.reasons[key]}
                </label>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={r.notePlaceholder}
              className="mt-3 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-400/60"
            />
            {error && <p className="mt-1 text-sm text-rose-400">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm opacity-70 transition hover:opacity-100"
              >
                {t.nokor.feed.cancel}
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                {r.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
