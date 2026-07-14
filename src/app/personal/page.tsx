import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import PersonalProjects from "@/components/PersonalProjects";

export const metadata: Metadata = {
  title: "Personal Projects — Pov Lyhoung",
};

export default function PersonalPage() {
  return (
    <SiteShell>
      <PersonalProjects />
    </SiteShell>
  );
}
