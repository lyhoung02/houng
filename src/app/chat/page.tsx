import { Suspense } from "react";
import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import ChatResume from "@/components/ChatResume";

export const metadata: Metadata = {
  title: "Chat — Pov Lyhoung",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
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
