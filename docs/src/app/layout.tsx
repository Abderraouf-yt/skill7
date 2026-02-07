import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skill7 | 634+ AI Expert Skills",
  description: "Browse and search 634+ production-ready AI development skills for security, development, infrastructure, and more. Works with Gemini CLI, Claude, Cursor & VS Code.",
  keywords: ["skill7", "MCP", "AI skills", "development", "security", "infrastructure", "Gemini CLI", "Claude", "Cursor"],
  icons: {
    icon: "/skill7/favicon.svg",
  },
  openGraph: {
    title: "Skill7 - Expert Skills for AI Agents",
    description: "634+ AI development skills for any MCP-compatible client",
    type: "website",
    url: "https://abderraouf-yt.github.io/skill7",
    images: ["/skill7/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#030711] text-slate-200`}>
        {children}
      </body>
    </html>
  );
}
