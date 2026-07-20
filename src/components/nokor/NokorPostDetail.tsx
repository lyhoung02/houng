"use client";

import { useNokorPost } from "@/lib/supabase/useNokorPost";
import { useT } from "../providers/LanguageProvider";
import PostCard from "./PostCard";

/** Standalone view for `#/post/<id>` — resolves a post by id (even one outside
 *  the 50-item feed window) so shared links always open the right post. */
export default function NokorPostDetail({
  postId,
  meId,
  onBack,
}: {
  postId: string;
  meId: string;
  onBack: () => void;
}) {
  const t = useT();
  const api = useNokorPost(postId, meId);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm opacity-70 transition hover:opacity-100"
      >
        ← {t.nokor.chat.back}
      </button>

      {!api.loaded ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>
      ) : !api.post ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.postUnavailable}</p>
      ) : (
        <PostCard
          post={api.post}
          userId={meId}
          onToggleLike={() => void api.toggleLike()}
          onEdit={api.editPost}
          onDelete={() => {
            void api.deletePost();
            onBack();
          }}
          onComment={api.addComment}
          onToggleCommentLike={(c) => void api.toggleCommentLike(c)}
          onDeleteComment={(id) => void api.deleteComment(id)}
        />
      )}
    </div>
  );
}
