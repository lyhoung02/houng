import { Suspense } from "react";
import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import ChatResume from "@/components/ChatResume";
import NokorApp from "@/components/nokor/NokorApp";

// On the Nokor deployment (NEXT_PUBLIC_APP=nokor) `/chat` is the Nokor chat
// tab; on the portfolio it is the resume chat. Same pattern as the root page.
const isNokorRoot = process.env.NEXT_PUBLIC_APP === "nokor";

export const metadata: Metadata = isNokorRoot
  ? {
      title: "Nokor",
      description: "A small social feed — share moments with the community.",
      robots: { index: false, follow: false },
    }
  : {
      title: "Chat — Pov Lyhoung",
      robots: { index: false, follow: false },
    };

export default function ChatPage() {
  if (isNokorRoot) {
    return <NokorApp />;
  }
  return (
    <SiteShell>
      {/* ChatResume reads the ?t= token via useSearchParams, which forces the
          subtree to render on the client under a static export. */}
      <Suspense fallback={null}>
        <ChatResume />
      </Suspense>
    </SiteShell>
  );
}
