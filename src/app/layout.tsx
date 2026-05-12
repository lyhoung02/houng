import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeBootScript } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoKhmer = Noto_Sans_Khmer({
  variable: "--font-noto-khmer",
  subsets: ["khmer"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pov Lyhoung — Software Engineer",
  description:
    "Portfolio of Pov Lyhoung — full-stack & mobile engineer building production apps at E-Power CCL. Backend, frontend, Flutter, Next.js, Node.js, and AI-augmented engineering.",
  keywords: [
    "Pov Lyhoung",
    "Software Engineer",
    "Full Stack Developer",
    "Flutter Developer",
    "Next.js",
    "Cambodia",
    "Norton University",
    "E-Power CCL",
  ],
  authors: [{ name: "Pov Lyhoung" }],
  openGraph: {
    title: "Pov Lyhoung — Software Engineer",
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
      className={`${geistSans.variable} ${geistMono.variable} ${notoKhmer.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col selection:bg-indigo-500/40 selection:text-white">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
