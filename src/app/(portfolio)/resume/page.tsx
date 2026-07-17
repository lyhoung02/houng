import type { Metadata } from "next";
import Resume from "@/components/Resume";
import ResumeActions from "@/components/ResumeActions";

export const metadata: Metadata = {
  title: "Pov Lyhoung — Résumé",
  description:
    "Printable résumé for Pov Lyhoung, Software Engineer at E-Power CCL.",
};

export default function ResumePage() {
  return (
    <div className="resume-shell">
      <ResumeActions />
      <main className="py-6 sm:py-10 px-3 sm:px-6 overflow-x-auto">
        <Resume />
      </main>
    </div>
  );
}
