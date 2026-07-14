import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Playground from "@/components/Playground";

export const metadata: Metadata = {
  title: "Playground — Pov Lyhoung",
};

export default function PlaygroundPage() {
  return (
    <SiteShell>
      <Playground />
    </SiteShell>
  );
}
