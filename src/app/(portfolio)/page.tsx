import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Hero from "@/components/Hero";
import About from "@/components/About";
import NokorApp from "@/components/nokor/NokorApp";

// The Nokor deployment (nokor.pages.dev) builds this same repo with
// NEXT_PUBLIC_APP=nokor, which serves the Nokor app at the site root instead
// of the portfolio. The unused branch is stripped at build time.
const isNokorRoot = process.env.NEXT_PUBLIC_APP === "nokor";

export const metadata: Metadata = isNokorRoot
  ? {
      title: "Nokor",
      description: "A small social feed — share moments with the community.",
      robots: { index: false, follow: false },
    }
  : {};

export default function Home() {
  if (isNokorRoot) {
    return <NokorApp />;
  }
  return (
    <SiteShell>
      <Hero />
      <About />
    </SiteShell>
  );
}
