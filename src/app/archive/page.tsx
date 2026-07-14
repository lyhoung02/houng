import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Archive from "@/components/Archive";

export const metadata: Metadata = {
  title: "Archive — Pov Lyhoung",
};

export default function ArchivePage() {
  return (
    <SiteShell>
      <Archive />
    </SiteShell>
  );
}
