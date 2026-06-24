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
  title: {
    default: "Flockify420",
    template: "%s | Flockify420",
  },
  description: "Rate music albums and react with GIFs",
  openGraph: {
    title: "Flockify420",
    description: "Rate music albums and react with GIFs",
    siteName: "Flockify420",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Flockify420",
    description: "Rate music albums and react with GIFs",
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
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 overflow-x-hidden">{children}</body>
    </html>
  );
}
