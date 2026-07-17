"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import ScrollToTop from "@/components/ScrollToTop";
import { usePathname } from "next/navigation";

export default function SiteShell({
  children,
  hideFooter = false,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <Nav />
      <main key={pathname} className="page-enter flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <ScrollToTop />
      <ChatWidget />
    </>
  );
}
