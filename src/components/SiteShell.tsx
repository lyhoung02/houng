"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import ScrollToTop from "@/components/ScrollToTop";
import { usePathname } from "next/navigation";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Nav />
      <main key={pathname} className="page-enter flex-1">
        {children}
      </main>
      <Footer />
      <ScrollToTop />
      <ChatWidget />
    </>
  );
}
