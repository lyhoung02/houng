import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pov Lyhoung — Junior Software Engineer",
  description:
    "Portfolio of Pov Lyhoung — full-stack & mobile engineer building production apps at E-Power CCL. Backend, frontend, Flutter, Next.js, Node.js, and AI-augmented engineering.",
  keywords: [
    "Pov Lyhoung",
    "Junior Software Engineer",
    "Full Stack Developer",
    "Flutter Developer",
    "Next.js",
    "Cambodia",
    "Norton University",
    "E-Power CCL",
  ],
  authors: [{ name: "Pov Lyhoung" }],
  openGraph: {
    title: "Pov Lyhoung — Junior Software Engineer",
    description:
      "Full-stack & mobile engineer shipping real products at E-Power CCL.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-indigo-500/40 selection:text-white">
        {children}
      </body>
    </html>
  );
}
