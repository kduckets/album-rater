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
  description: "Like Flockify, but different.",
  icons: {
    icon: "/flockify.png",
    apple: "/flockify.png",
  },
  openGraph: {
    title: "Flockify 4.2.0",
    description: "Like Flockify, but different.",
    siteName: "Flockify 4.2.0",
    type: "website",
    images: [{ url: "/flockify.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flockify 4.2.0",
    description: "Like Flockify, but different.",
    images: ["/flockify.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50 overflow-x-hidden">{children}</body>
    </html>
  );
}
