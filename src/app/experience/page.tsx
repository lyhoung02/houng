import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Experience from "@/components/Experience";

export const metadata: Metadata = {
  title: "Experience — Pov Lyhoung",
};

export default function ExperiencePage() {
  return (
    <SiteShell>
      <Experience />
    </SiteShell>
  );
}
