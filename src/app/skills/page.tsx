import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Skills from "@/components/Skills";

export const metadata: Metadata = {
  title: "Skills — Pov Lyhoung",
};

export default function SkillsPage() {
  return (
    <SiteShell>
      <Skills />
    </SiteShell>
  );
}
