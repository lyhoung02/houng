import type { Metadata } from "next";
import NokorApp from "@/components/nokor/NokorApp";

export const metadata: Metadata = {
  title: "Nokor",
  description: "A small social feed — share moments with the community.",
  robots: { index: false, follow: false },
};

export default function NokorPage() {
  return <NokorApp />;
}
