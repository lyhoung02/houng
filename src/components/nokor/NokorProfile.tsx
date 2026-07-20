"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { nokorAvatarUrl, nokorPostImages } from "@/lib/supabase/useNokor";
import { useNokorFollow } from "@/lib/supabase/useNokorSocial";
import { useProfile } from "@/lib/supabase/useProfile";
import { useT } from "../providers/LanguageProvider";
import NokorBadge from "./NokorBadge";
import { NokorAbout, NokorAboutForm, type AboutFields } from "./NokorProfileAbout";
import NokorReportSheet, { type NokorReportTarget } from "./NokorReportSheet";
import { useNokorNav } from "./useNokorNav";

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-xs opacity-60">{label}</p>
    </div>
  );
}

export default function NokorProfile({ meId, userId }: { meId: string | null; userId: string }) {
  const t = useT();
  const p = t.nokor.profile;
  const nav = useNokorNav();
  const { profile, posts, loaded, reload, toggleFollow } = useNokorFollow(meId, userId);
  const own = meId === userId;
  const editable = useProfile(own ? meId : null);

  const [editing, setEditing] = useState(false);
  const [reportTarget, setReportTarget] = useState<NokorReportTarget | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveEdit = async (fields: AboutFields & { username: string | null }) => {
    const ok = await editable.save(fields);
    if (ok) {
      setEditing(false);
      await reload();
    }
  };

  const onAvatar = async (file: File | null) => {
    if (!file) return;
    const ok = await editable.uploadAvatar(file);
    if (ok) await reload();
  };

  if (!loaded || !profile) {
    return <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>;
  }

  const avatar = nokorAvatarUrl({ username: profile.username, avatar_path: profile.avatar_path });

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatar ? (
              <Image
                src={avatar}
                alt=""
                width={72}
                height={72}
                unoptimized
                className="h-18 w-18 rounded-full object-cover"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full bg-indigo-500/30 text-xl font-semibold uppercase"
                style={{ width: 72, height: 72 }}
              >
                {name(profile.username, profile.userId).slice(0, 2)}
              </div>
            )}
            {own && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label={p.changePhoto}
                className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs"
              >
                📷
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void onAvatar(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-1 justify-around">
            <Stat value={profile.postCount} label={p.posts} />
            <Stat value={profile.followers} label={p.followers} />
            <Stat value={profile.following} label={p.following} />
          </div>
        </div>

        {editing ? (
          <NokorAboutForm
            initial={{
              username: profile.username,
              bio: profile.bio,
              work: profile.work,
              education: profile.education,
              hometown: profile.hometown,
              current_city: profile.current_city,
              relationship: profile.relationship,
              website: profile.website,
              birthday: profile.birthday,
              gender: profile.gender,
              phone: profile.phone,
            }}
            saving={editable.saving}
            onSave={(fields) => void saveEdit(fields)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 font-semibold">
              <span>{name(profile.username, profile.userId)}</span>
              <NokorBadge kind={profile.badge} size={18} />
            </p>
            {profile.bio && <p className="mt-1 text-sm opacity-80 whitespace-pre-wrap">{profile.bio}</p>}

            <div className="mt-4 flex gap-2">
              {own ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex-1 rounded-full border border-border py-2 text-sm font-medium transition hover:bg-surface-strong"
                >
                  {p.editProfile}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void toggleFollow()}
                    className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                      profile.isFollowedByMe
                        ? "border border-border hover:bg-surface-strong"
                        : "bg-indigo-500 text-white hover:bg-indigo-400"
                    }`}
                  >
                    {profile.isFollowedByMe ? p.following : p.follow}
                  </button>
                  <button
                    type="button"
                    onClick={() => nav?.openChat(profile.userId)}
                    className="flex-1 rounded-full border border-border py-2 text-sm font-medium transition hover:bg-surface-strong"
                  >
                    {p.message}
                  </button>
                  {meId && (
                    <button
                      type="button"
                      onClick={() =>
                        setReportTarget({
                          kind: "profile",
                          id: profile.userId,
                          userId: profile.userId,
                          snapshot: profile.bio,
                        })
                      }
                      aria-label={t.nokor.report.action}
                      title={t.nokor.report.action}
                      className="rounded-full border border-border px-3 py-2 text-sm opacity-70 transition hover:bg-surface-strong hover:opacity-100"
                    >
                      ⚑
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {editable.error && <p className="mt-2 text-sm text-rose-400">{editable.error}</p>}
      </div>

      {!editing && <NokorAbout profile={profile} />}

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm opacity-60">{p.noPosts}</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post) => {
            const imgs = nokorPostImages(post);
            return (
              <div
                key={post.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
              >
                {imgs.length ? (
                  <Image src={imgs[0]} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <p className="line-clamp-5 p-2 text-xs opacity-70">{post.body}</p>
                )}
                {imgs.length > 1 && (
                  <span className="absolute top-1 right-1 rounded bg-black/60 px-1 text-[10px] text-white">
                    ×{imgs.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reportTarget && meId && (
        <NokorReportSheet
          meId={meId}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
