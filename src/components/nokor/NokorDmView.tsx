"use client";

import { useNokorConversation } from "@/lib/supabase/useNokorChat";
import type { NokorAuthor } from "@/lib/supabase/useNokor";
import { useT } from "../providers/LanguageProvider";
import NokorConversation from "./NokorConversation";

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

/** Binds the DM hook to the shared conversation UI. */
export default function NokorDmView({
  meId,
  summary,
  onBack,
}: {
  meId: string;
  summary: { threadId: string; otherId: string; other: NokorAuthor | null };
  onBack: () => void;
}) {
  const t = useT();
  const conv = useNokorConversation(summary.threadId, meId);

  return (
    <NokorConversation
      meId={meId}
      conv={conv}
      title={name(summary.other?.username ?? null, summary.otherId)}
      subtitle={conv.otherTyping ? t.nokor.chat.typing : null}
      avatar={{ author: summary.other, userId: summary.otherId }}
      seenAt={conv.otherReadAt}
      onTyping={conv.pingTyping}
      onBack={onBack}
    />
  );
}
