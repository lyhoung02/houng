import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Projects from "@/components/Projects";

export const metadata: Metadata = {
  title: "Projects — Pov Lyhoung",
};

export default function ProjectsPage() {
  return (
    <SiteShell>
      <Projects />
    </SiteShell>
  );
}
