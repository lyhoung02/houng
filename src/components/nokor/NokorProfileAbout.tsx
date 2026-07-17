"use client";

import { useState } from "react";
import type { ProfileState } from "@/lib/supabase/useProfile";
import type { Gender, Relationship } from "@/lib/supabase/types";
import { useT } from "../providers/LanguageProvider";

const RELATIONSHIPS: Relationship[] = [
  "single",
  "in_a_relationship",
  "engaged",
  "married",
  "complicated",
  "private",
];
const GENDERS: Gender[] = ["female", "male", "other", "private"];

export type AboutFields = Pick<
  ProfileState,
  | "bio"
  | "work"
  | "education"
  | "hometown"
  | "current_city"
  | "relationship"
  | "website"
  | "birthday"
  | "gender"
  | "phone"
>;

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5 text-sm">
      <span aria-hidden className="w-5 shrink-0 text-center">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="opacity-60">{label} </span>
        <span className="font-medium break-words">{value}</span>
      </span>
    </li>
  );
}

/** Read-only "About" list — only fields that are filled in show up. */
export function NokorAbout({ profile }: { profile: AboutFields }) {
  const t = useT();
  const p = t.nokor.profile;
  const rel = profile.relationship ? p.relationships[profile.relationship] : null;
  const gender = profile.gender ? p.genders[profile.gender] : null;

  const rows: { icon: string; label: string; value: string }[] = [];
  if (profile.work) rows.push({ icon: "💼", label: p.worksAt, value: profile.work });
  if (profile.education) rows.push({ icon: "🎓", label: p.studiedAt, value: profile.education });
  if (profile.current_city) rows.push({ icon: "🏠", label: p.livesIn, value: profile.current_city });
  if (profile.hometown) rows.push({ icon: "📍", label: p.from, value: profile.hometown });
  if (rel) rows.push({ icon: "❤️", label: p.relationship, value: rel });
  if (profile.birthday) rows.push({ icon: "🎂", label: p.birthday, value: profile.birthday });
  if (gender) rows.push({ icon: "👤", label: p.gender, value: gender });
  if (profile.phone) rows.push({ icon: "📞", label: p.phone, value: profile.phone });

  if (!rows.length && !profile.website) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-1 text-sm font-semibold">{p.about}</h3>
      <ul>
        {rows.map((r) => (
          <Row key={r.label} {...r} />
        ))}
        {profile.website && (
          <li className="flex items-start gap-2.5 py-1.5 text-sm">
            <span aria-hidden className="w-5 shrink-0 text-center">
              🔗
            </span>
            <a
              href={/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noreferrer noopener"
              className="min-w-0 truncate font-medium text-indigo-400 hover:underline"
            >
              {profile.website}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Full edit form for every profile field. */
export function NokorAboutForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: AboutFields & { username: string | null };
  saving: boolean;
  onSave: (fields: AboutFields & { username: string | null }) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const p = t.nokor.profile;
  const [f, setF] = useState({ ...initial });
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const field = "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-indigo-400/60";

  return (
    <div className="mt-4 space-y-2">
      <input
        value={f.username ?? ""}
        onChange={(e) => set("username", e.target.value)}
        placeholder={p.username}
        maxLength={40}
        className={field}
      />
      <textarea
        value={f.bio ?? ""}
        onChange={(e) => set("bio", e.target.value)}
        placeholder={p.bioPlaceholder}
        rows={2}
        maxLength={300}
        className={`${field} resize-none`}
      />
      <input
        value={f.work ?? ""}
        onChange={(e) => set("work", e.target.value)}
        placeholder={p.workPlaceholder}
        maxLength={120}
        className={field}
      />
      <input
        value={f.education ?? ""}
        onChange={(e) => set("education", e.target.value)}
        placeholder={p.educationPlaceholder}
        maxLength={120}
        className={field}
      />
      <input
        value={f.current_city ?? ""}
        onChange={(e) => set("current_city", e.target.value)}
        placeholder={p.currentCityPlaceholder}
        maxLength={80}
        className={field}
      />
      <input
        value={f.hometown ?? ""}
        onChange={(e) => set("hometown", e.target.value)}
        placeholder={p.hometownPlaceholder}
        maxLength={80}
        className={field}
      />
      <input
        value={f.website ?? ""}
        onChange={(e) => set("website", e.target.value)}
        placeholder={p.websitePlaceholder}
        maxLength={200}
        className={field}
      />
      <input
        value={f.phone ?? ""}
        onChange={(e) => set("phone", e.target.value)}
        placeholder={p.phonePlaceholder}
        maxLength={30}
        className={field}
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs opacity-60">
          {p.birthday}
          <input
            type="date"
            value={f.birthday ?? ""}
            onChange={(e) => set("birthday", e.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-xs opacity-60">
          {p.gender}
          <select
            value={f.gender ?? ""}
            onChange={(e) => set("gender", (e.target.value || null) as Gender | null)}
            className={`${field} mt-1`}
          >
            <option value="">{p.notSet}</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {p.genders[g]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-xs opacity-60">
        {p.relationship}
        <select
          value={f.relationship ?? ""}
          onChange={(e) => set("relationship", (e.target.value || null) as Relationship | null)}
          className={`${field} mt-1`}
        >
          <option value="">{p.notSet}</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {p.relationships[r]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-1.5 text-sm opacity-70 transition hover:opacity-100"
        >
          {t.nokor.feed.cancel}
        </button>
        <button
          type="button"
          onClick={() => onSave(f)}
          disabled={saving}
          className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
        >
          {t.nokor.feed.save}
        </button>
      </div>
    </div>
  );
}
