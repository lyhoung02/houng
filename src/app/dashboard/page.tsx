import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard — Pov Lyhoung",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <SiteShell hideFooter>
      <Dashboard />
    </SiteShell>
  );
}
