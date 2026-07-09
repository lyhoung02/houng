import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import InternalWork from "@/components/InternalWork";
import PersonalProjects from "@/components/PersonalProjects";
import Skills from "@/components/Skills";
import Archive from "@/components/Archive";
import Contact from "@/components/Contact";
import Playground from "@/components/Playground";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import ScrollToTop from "@/components/ScrollToTop";

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
        <Archive />
        <Contact />
        <Playground />
      </main>
      <Footer />
      <ScrollToTop />
      <ChatWidget />
    </>
  );
}
