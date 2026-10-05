import type { Metadata } from "next";
import "./globals.css";
import "./fixes.css";
import "./workspaces.css";

export const metadata: Metadata = {
  title: "Blackberrys · Commerce OS",
  description: "Blackberrys marketing intelligence prototype — connected demo data, evidence and recommended actions.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
