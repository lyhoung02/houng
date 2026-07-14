import SiteShell from "@/components/SiteShell";
import Hero from "@/components/Hero";
import About from "@/components/About";

export default function Home() {
  return (
    <SiteShell>
      <Hero />
      <About />
    </SiteShell>
  );
}
