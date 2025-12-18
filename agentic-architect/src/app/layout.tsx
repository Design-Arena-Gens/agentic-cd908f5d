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
  title: "Agentic Architect",
  description:
    "Otonom yazılım mühendisi ajanı için çok ajanlı orkestrasyon, kendi kendini iyileştiren terminal ve RAG tabanlı bağlam sunan yönetim konsolu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
