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
  metadataBase: new URL("https://hassannu-source.github.io/music-player-nextjs"),
  title: "Music Player",
  description: "A simple music player with playlist",
  openGraph: {
    title: "Music Player",
    description: "A simple music player with playlist",
    url: "https://hassannu-source.github.io/music-player-nextjs",
    siteName: "Music Player",
    images: [
      {
        url: "./default-cover.png",
        width: 1200,
        height: 630,
        alt: "Music Player Cover",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script src="https://cdn.jsdelivr.net/npm/jsmediatags@3.9.7/dist/jsmediatags.min.js"></script>
      </body>
    </html>
  );
}
