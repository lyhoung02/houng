import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import InternalWork from "@/components/InternalWork";
import PersonalProjects from "@/components/PersonalProjects";
import Skills from "@/components/Skills";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <InternalWork />
        <PersonalProjects />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
