import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Contact from "@/components/Contact";

export const metadata: Metadata = {
  title: "Contact — Pov Lyhoung",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <Contact />
    </SiteShell>
  );
}
