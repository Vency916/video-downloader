"use client";

import DownloadHistory from "@/components/DownloadHistory";
import MediaResultCard from "@/components/MediaResultCard";
import PlatformBadges from "@/components/PlatformBadges";
import UrlInputForm from "@/components/UrlInputForm";
import { PLATFORM_CONFIG } from "@/lib/platform-detector";
import { ExtractResponse, MediaResult, Platform } from "@/lib/types";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Film,
  Layers,
  Music,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

const HISTORY_STORAGE_KEY = "vortex_dl_history_v1";

const PLATFORM_STATUS_INFO: Record<
  Platform,
  { label: string; engine: string; badge: string }
> = {
  tiktok: {
    label: "TikTok Mode (1080p HD • No Watermark)",
    engine: "TikWM HD Engine: Online",
    badge: "1080p No-WM",
  },
  instagram: {
    label: "Instagram Reels & Posts Mode",
    engine: "Reels Stream Engine: Online",
    badge: "Direct MP4",
  },
  twitter: {
    label: "X (Twitter) Video & GIF Mode",
    engine: "X Syndication API: Online",
    badge: "Highest Bitrate",
  },
  reddit: {
    label: "Reddit Video Mode",
    engine: "v.redd.it DASH Engine: Online",
    badge: "Native Audio/Video",
  },
  youtube: {
    label: "YouTube Shorts & Video Mode",
    engine: "YouTube Stream Engine: Online",
    badge: "HQ MP4",
  },
  facebook: {
    label: "Facebook Video Mode",
    engine: "FB Video Parser: Online",
    badge: "HD MP4",
  },
  pinterest: {
    label: "Pinterest Video Pin Mode",
    engine: "Pin MP4 Engine: Online",
    badge: "Direct Stream",
  },
  unknown: {
    label: "Universal Video Downloader",
    engine: "Multi-Resolver: Online",
    badge: "Auto-Detect",
  },
};

export default function HomePage() {
  const [results, setResults] = useState<MediaResult[]>([]);
  const [history, setHistory] = useState<MediaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");

  const currentPlatformInfo = PLATFORM_STATUS_INFO[selectedPlatform];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveToHistory = (newItems: MediaResult[]) => {
    setHistory((prev) => {
      const combined = [...newItems, ...prev];
      const unique = combined.filter(
        (item, idx, arr) =>
          arr.findIndex(
            (x) => x.platform === item.platform && x.id === item.id
          ) === idx
      );
      const sliced = unique.slice(0, 8);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sliced));
      } catch {
        // Ignore
      }
      return sliced;
    });
  };

  const handleExtract = async (urls: string[]) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    const extractedList: MediaResult[] = [];
    const errorsList: string[] = [];

    for (const rawUrl of urls.slice(0, 10)) {
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: rawUrl }),
        });

        const data: ExtractResponse = await res.json();
        if (data.success && data.data) {
          extractedList.push(data.data);
        } else {
          errorsList.push(data.error || `Failed to extract: ${rawUrl}`);
        }
      } catch {
        errorsList.push(`Network error while processing: ${rawUrl}`);
      }
    }

    if (extractedList.length > 0) {
      setResults(extractedList);
      saveToHistory(extractedList);
    }

    if (errorsList.length > 0) {
      setError(errorsList.join(" • "));
    }

    setIsLoading(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-[#ededed] antialiased selection:bg-rose-500/30 selection:text-white flex flex-col justify-between">
      {/* Background Soft Plum Vignette Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[18%] -left-[200px] w-[500px] h-[500px] bg-gradient-to-r from-rose-900/25 via-pink-900/15 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[18%] -right-[200px] w-[500px] h-[500px] bg-gradient-to-l from-rose-900/25 via-pink-900/15 to-transparent blur-[120px] rounded-full" />
      </div>

      {/* 1. Header Navigation Bar */}
      <header className="w-full border-b border-neutral-900/80 bg-black/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-4 bg-white rounded-xs -skew-x-12 inline-block" />
              <span className="w-2.5 h-4 bg-neutral-400 rounded-xs -skew-x-12 inline-block" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              Nexio Video
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-normal text-neutral-400">
            <a href="#downloader" className="hover:text-white transition">
              Downloader
            </a>
            <a href="#workflow" className="hover:text-white transition">
              Workflow
            </a>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
          </nav>

          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>1080p Pure HD</span>
          </div>
        </div>
      </header>

      {/* Main Content - Tight, clean, instant console above the fold */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-20 space-y-5">
        {/* 2. Streamlined, Simple Header */}
        <section className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 h-px bg-gradient-to-r from-transparent to-neutral-700" />
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-950 border border-neutral-800 text-neutral-300">
              <Sparkles className="w-3 h-3 text-neutral-400" />
              Simplify your workflow
            </span>
            <span className="w-10 h-px bg-gradient-to-l from-transparent to-neutral-700" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
            Enhance your video downloads with Nexio
          </h1>

          <p className="text-xs text-neutral-400">
            TikTok 1080p HD without watermark, audio MP3, and social media reels.
          </p>
        </section>

        {/* 3. Hero Console - Instantly Visible */}
        <div id="downloader" className="relative max-w-4xl mx-auto space-y-3">
          {/* Real Platform Icons & Badges directly on top of the Console */}
          <div className="w-full flex justify-center">
            <PlatformBadges
              activePlatform={selectedPlatform}
              onSelectPlatform={(p) => setSelectedPlatform(p)}
            />
          </div>

          {/* Outer glowing border ring */}
          <div className="relative rounded-[24px] p-[1px] bg-gradient-to-b from-neutral-700/80 via-neutral-800/40 to-neutral-900/60 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
            <div className="rounded-[23px] bg-[#0c0d12] p-4 sm:p-7 space-y-5">
              {/* Dynamic Status Header Bar for "Media Downloader Console" */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-neutral-800/70 text-xs">
                {/* Left: Console Name + Dynamic Social Filter Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-neutral-300 font-medium ml-1 text-xs">
                    Media Downloader Console
                  </span>

                  {/* Dynamic Platform Status Indicator */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-900 border border-neutral-700 text-neutral-200 transition-all">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{currentPlatformInfo.label}</span>
                  </span>
                </div>

                {/* Right: Engine Status Text */}
                <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] text-neutral-400">
                    {currentPlatformInfo.engine}
                  </span>
                </div>
              </div>

              {/* The Input Form Component (receives the selected platform) */}
              <UrlInputForm
                onExtract={handleExtract}
                isLoading={isLoading}
                selectedPlatform={selectedPlatform}
              />

              {/* Extraction Error Notice */}
              {error && (
                <div className="w-full max-w-2xl mx-auto p-3 rounded-xl bg-neutral-900 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-medium text-rose-300">Notice</p>
                    <p className="text-neutral-400 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Result Card Component (when extracted) */}
              {results.length > 0 && (
                <div className="pt-1 space-y-4">
                  {results.map((item) => (
                    <MediaResultCard
                      key={`${item.platform}-${item.id}`}
                      result={item}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Relocated Feature Metric Cards (Cleanly placed below the Console) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-[#0e0f15] border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span>Source Resolution</span>
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm font-semibold text-white">
                1080p Full HD
              </div>
              <p className="text-[10px] text-neutral-500">
                Uncompressed raw stream
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e0f15] border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span>Watermark Removal</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-white">
                100% Watermark-Free
              </div>
              <p className="text-[10px] text-neutral-500">
                Raw play_addr stream
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0e0f15] border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                <span>Audio Extraction</span>
                <Music className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-sm font-semibold text-white">
                MP3 320kbps
              </div>
              <p className="text-[10px] text-neutral-500">
                Isolated original sounds
              </p>
            </div>
          </div>
        </div>

        {/* History Component */}
        <DownloadHistory
          history={history}
          onSelectResult={(item) => {
            setError(null);
            setResults([item]);
          }}
          onClearHistory={handleClearHistory}
        />

        {/* 4. "Our Workflow" Section */}
        <section id="workflow" className="pt-12 border-t border-neutral-900 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <span className="w-10 h-px bg-gradient-to-r from-transparent to-neutral-700" />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-950 border border-neutral-800 text-neutral-300">
                Our workflow
              </span>
              <span className="w-10 h-px bg-gradient-to-l from-transparent to-neutral-700" />
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              How our platform makes your workflow easier
            </h2>
            <p className="text-xs text-neutral-400">
              Three seamless steps from copying a social link to saving clean HD
              media files.
            </p>
          </div>

          {/* Workflow Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-5 rounded-2xl bg-[#0c0d12] border border-neutral-800/80 hover:border-neutral-700 transition space-y-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-xs font-semibold">
                01
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white">
                  Paste Any Social URL
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Paste links from TikTok, Instagram Reels, X (Twitter), Reddit,
                  or Pinterest. Even mobile share text is auto-parsed.
                </p>
              </div>
              <div className="pt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                <span>Clipboard auto-clean</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0c0d12] border border-neutral-800/80 hover:border-neutral-700 transition space-y-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-xs font-semibold">
                02
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white">
                  Instant Stream Resolution
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Our server queries raw source manifests to fetch unwatermarked
                  1080p ByteVC1/H.264 streams and original audio.
                </p>
              </div>
              <div className="pt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                <span>Sub-second response</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0c0d12] border border-neutral-800/80 hover:border-neutral-700 transition space-y-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-xs font-semibold">
                03
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white">
                  Direct Attachment Stream
                </h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  The `/api/download` proxy streams bytes straight to your
                  device with clean attachment headers so files download instantly.
                </p>
              </div>
              <div className="pt-1 text-[10px] text-neutral-500 flex items-center gap-1">
                <span>Zero RAM buffering lag</span>
                <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Features Grid */}
        <section id="features" className="pt-6 border-t border-neutral-900 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0a0b0f] border border-neutral-800/70 space-y-1">
              <Film className="w-4 h-4 text-neutral-300" />
              <h4 className="font-medium text-white">1080p HD (No Watermark)</h4>
              <p className="text-[11px] text-neutral-500">
                Pristine video without TikTok overlay stamps.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b0f] border border-neutral-800/70 space-y-1">
              <Music className="w-4 h-4 text-neutral-300" />
              <h4 className="font-medium text-white">Isolated MP3 Audio</h4>
              <p className="text-[11px] text-neutral-500">
                Download pure background songs and voiceovers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b0f] border border-neutral-800/70 space-y-1">
              <Layers className="w-4 h-4 text-neutral-300" />
              <h4 className="font-medium text-white">Batch & Slideshows</h4>
              <p className="text-[11px] text-neutral-500">
                Process multiple links and photo carousels.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b0f] border border-neutral-800/70 space-y-1">
              <Zap className="w-4 h-4 text-neutral-300" />
              <h4 className="font-medium text-white">Direct CDN Proxy</h4>
              <p className="text-[11px] text-neutral-500">
                Instant file save with bypass for expired tokens.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="w-full border-t border-neutral-900 bg-black/90 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-3 bg-white rounded-xs -skew-x-12 inline-block" />
              <span className="w-2 h-3 bg-neutral-500 rounded-xs -skew-x-12 inline-block" />
            </div>
            <span className="text-neutral-300 font-medium">Nexio Video</span>
          </div>

          <p className="text-neutral-500">
            For personal archival and educational purposes. Respect creator copyrights.
          </p>

          <div className="flex items-center gap-4 text-neutral-400">
            <a href="#downloader" className="hover:text-white transition">
              Downloader
            </a>
            <a href="#workflow" className="hover:text-white transition">
              Workflow
            </a>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
