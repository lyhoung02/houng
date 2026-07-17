"use client";

import { useNokorRoomConversation, useNokorRoomMembers, type NokorRoomSummary } from "@/lib/supabase/useNokorRooms";
import { useProfile } from "@/lib/supabase/useProfile";
import { useT } from "../providers/LanguageProvider";
import NokorConversation from "./NokorConversation";

function shortName(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

/** Binds the room hook to the shared conversation UI. */
export default function NokorRoomView({
  meId,
  room,
  onBack,
  onLeave,
}: {
  meId: string;
  room: NokorRoomSummary;
  onBack: () => void;
  onLeave: () => void;
}) {
  const t = useT();
  const c = t.nokor.chat;
  const conv = useNokorRoomConversation(room, meId);
  const { members } = useNokorRoomMembers(room.id);
  const me = useProfile(meId);

  const senderName = (senderId: string) => {
    if (senderId === meId) return c.you;
    const a = conv.authors[senderId];
    return shortName(a?.username ?? null, senderId);
  };

  const subtitle = conv.typingNames.length
    ? `${conv.typingNames.join(", ")} ${c.typing}`
    : `${room.kind === "channel" ? c.channel : c.group} · ${c.membersN.replace("{n}", String(members.length || room.memberCount))}`;

  return (
    <NokorConversation
      meId={meId}
      conv={conv}
      title={room.name}
      subtitle={subtitle}
      avatar={null}
      canPost={conv.canPost}
      lockedNote={c.readOnly}
      senderName={senderName}
      onTyping={() => conv.pingTyping(shortName(me.profile.username, meId))}
      onBack={onBack}
      headerExtra={
        <button
          type="button"
          onClick={onLeave}
          className="shrink-0 rounded-full px-2.5 py-1 text-xs opacity-60 transition hover:bg-surface-strong hover:opacity-100"
        >
          {c.leave}
        </button>
      }
    />
  );
}
