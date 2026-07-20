"use client";

import { type useNokor } from "@/lib/supabase/useNokor";
import { nokorErrorText } from "@/lib/supabase/nokorErrors";
import { useT } from "../providers/LanguageProvider";
import NokorComposer from "./NokorComposer";
import NokorStories from "./NokorStories";
import PostCard from "./PostCard";

type Nokor = ReturnType<typeof useNokor>;

export default function NokorFeed({ fk }: { fk: Nokor }) {
  const t = useT();

  return (
    <div className="space-y-4">
      <NokorStories meId={fk.userId} />
      <NokorComposer busy={fk.busy} onPost={fk.createPost} />
      {fk.error && (
        <p className="text-sm text-rose-400">{nokorErrorText(fk.error, t.nokor.errors)}</p>
      )}
      {!fk.feedLoaded ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>
      ) : fk.posts.length === 0 ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.empty}</p>
      ) : (
        fk.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userId={fk.userId!}
            onToggleLike={() => void fk.toggleLike(post)}
            onEdit={(body) => fk.editPost(post.id, body)}
            onDelete={() => void fk.deletePost(post)}
            onComment={(body, replyToId) => fk.addComment(post.id, body, replyToId)}
            onToggleCommentLike={(comment) => void fk.toggleCommentLike(post.id, comment)}
            onDeleteComment={(id) => void fk.deleteComment(id)}
          />
        ))
      )}
    </div>
  );
}
