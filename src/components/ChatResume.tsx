"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "./providers/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useVisitorChat } from "@/lib/supabase/useChat";
import { AuthForm } from "./chat/VisitorPanel";
import { ThreadView } from "./chat/ThreadView";

/**
 * Landing page for the "continue this conversation" link in reply emails. The
 * `t` query param is the conversation's access_token. Visitors hold real
 * accounts now, so the link only opens once they're signed in — claiming then
 * re-points the thread at whichever account followed the link.
 */
export default function ChatResume() {
  const { t, lang } = useLanguage();
  const params = useSearchParams();
  const token = params.get("t");
  const chat = useVisitorChat(lang);
  const claimed = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Claiming needs a session, so wait for sign-in before trying.
    if (!token || claimed.current || !isSupabaseConfigured || !chat.user) return;
    claimed.current = true;
    void chat.claim(token).then((id) => {
      if (!id) setFailed(true);
    });
  }, [token, chat]);

  const broken = !token || failed || !isSupabaseConfigured;

  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-semibold text-foreground">{t.chat.resume.heading}</h1>

      {broken ? (
        <p className="mt-4 text-sm text-foreground/60">
          {isSupabaseConfigured ? t.chat.resume.invalid : t.chat.unavailable}{" "}
          <Link href="/" className="text-indigo-600 dark:text-indigo-300 hover:underline">
            {t.nav.about}
          </Link>
        </p>
      ) : !chat.authReady ? (
        <p className="mt-4 text-sm text-foreground/60">{t.chat.resume.loading}</p>
      ) : !chat.user ? (
        <div className="mt-6 glass rounded-2xl border border-border overflow-hidden flex flex-col">
          <AuthForm chat={chat} />
        </div>
      ) : !chat.conversationId ? (
        <p className="mt-4 text-sm text-foreground/60">{t.chat.resume.loading}</p>
      ) : (
        <div className="mt-6 glass rounded-2xl border border-border overflow-hidden flex flex-col h-[65vh]">
          <ThreadView
            thread={chat}
            mineIs="visitor"
            peerAuthor={{ name: "Pov Lyhoung", avatarUrl: "/profile-nobg.png" }}
          />
        </div>
      )}
    </section>
  );
}
