import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Antigravity Skills | 634+ AI Development Skills",
  description: "Browse and search 634+ production-ready AI development skills for security, development, infrastructure, and more.",
  keywords: ["MCP", "AI skills", "development", "security", "infrastructure", "Gemini CLI", "Claude", "Cursor"],
  icons: {
    icon: "/skills-mcp-server/favicon.svg",
  },
  openGraph: {
    title: "Antigravity Skills",
    description: "634+ AI development skills for any MCP-compatible client",
    type: "website",
    url: "https://abderraouf-yt.github.io/skills-mcp-server",
    images: ["/skills-mcp-server/favicon.svg"],
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
