import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VortexDL — TikTok HD No-Watermark & Social Video Downloader",
  description:
    "Download TikTok videos in 1080p HD without watermark, extract original MP3 audio, photo slideshows, and save videos from Instagram, X (Twitter), Reddit, YouTube, and Facebook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#040711] text-slate-100 antialiased selection:bg-pink-500/30 selection:text-pink-200">
        {children}
      </body>
    </html>
  );
}

