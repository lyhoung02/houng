import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import InternalWork from "@/components/InternalWork";

export const metadata: Metadata = {
  title: "Internal Work — Pov Lyhoung",
};

export default function InternalPage() {
  return (
    <SiteShell>
      <InternalWork />
    </SiteShell>
  );
}
