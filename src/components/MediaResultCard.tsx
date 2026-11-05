"use client";

import {
  formatBytes,
  formatDuration,
  PLATFORM_CONFIG,
} from "@/lib/platform-detector";
import { MediaFormat, MediaResult } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileAudio,
  FileVideo,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Play,
  Share2,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";

interface MediaResultCardProps {
  result: MediaResult;
}

function formatCount(num?: number): string {
  if (!num || num <= 0) return "";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export default function MediaResultCard({ result }: MediaResultCardProps) {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const platformMeta = PLATFORM_CONFIG[result.platform];
  const primaryVideoFormat = result.formats.find((f) => !f.isAudioOnly);

  const handleDownloadClick = (fmt: MediaFormat) => {
    setDownloadingId(fmt.id);
    setTimeout(() => {
      setDownloadingId((curr) => (curr === fmt.id ? null : curr));
    }, 3500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#0d0e13] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#090a0e] border-b border-neutral-800/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-neutral-900 border border-neutral-800 text-neutral-300">
            {platformMeta.name}
          </span>
          <span className="inline-flex items-center gap-1.5 text-neutral-400 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Watermark-Free Stream Ready</span>
          </span>
        </div>

        <a
          href={result.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-300 transition"
        >
          <span>View Source</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Main Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Video Preview */}
        <div className="md:col-span-5 flex flex-col justify-center">
          <div className="relative aspect-[9/13] max-h-72 w-full mx-auto rounded-xl overflow-hidden bg-black border border-neutral-800 group">
            {isPlayingPreview && primaryVideoFormat ? (
              <video
                src={primaryVideoFormat.downloadUrl}
                poster={result.thumbnail}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <>
                {result.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <FileVideo className="w-10 h-10" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {primaryVideoFormat && (
                  <button
                    type="button"
                    onClick={() => setIsPlayingPreview(true)}
                    className="absolute inset-0 flex items-center justify-center group/btn cursor-pointer"
                    title="Preview video"
                  >
                    <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-black transition duration-200 shadow-xl">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </span>
                  </button>
                )}

                {result.durationSeconds !== undefined && (
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/80 text-neutral-300 border border-white/10 backdrop-blur-sm">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {formatDuration(result.durationSeconds)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Author & Format Selectors */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-5">
          {/* Creator Profile & Title */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {result.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.author.avatar}
                  alt={result.author.name}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white text-xs font-semibold">
                  {result.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-medium text-sm text-white truncate">
                  {result.author.name}
                </h3>
                <p className="text-xs text-neutral-500 truncate">
                  {result.author.handle}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
              {result.title}
            </p>

            {/* Engagement Stats */}
            {result.stats && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500">
                {result.stats.views !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatCount(result.stats.views)}
                  </span>
                )}
                {result.stats.likes !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500/80" />
                    {formatCount(result.stats.likes)}
                  </span>
                )}
                {result.stats.comments !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {formatCount(result.stats.comments)}
                  </span>
                )}
                {result.stats.shares !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    {formatCount(result.stats.shares)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Download Formats List */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium tracking-wide uppercase text-neutral-500">
              Select Output Format
            </div>

            <div className="grid grid-cols-1 gap-2">
              {result.formats.map((fmt, index) => {
                const isPrimaryHd = index === 0 && !fmt.isAudioOnly;
                const isDownloading = downloadingId === fmt.id;
                const sizeText = formatBytes(fmt.sizeBytes);

                return (
                  <a
                    key={fmt.id}
                    href={fmt.downloadUrl}
                    download
                    onClick={() => handleDownloadClick(fmt)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all border ${
                      isPrimaryHd
                        ? "bg-white text-black border-white hover:bg-neutral-200 shadow-sm"
                        : fmt.isAudioOnly
                        ? "bg-[#14151b] hover:bg-[#1a1b22] text-neutral-300 border-neutral-800/90"
                        : "bg-[#14151b] hover:bg-[#1a1b22] text-neutral-300 border-neutral-800/90"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {fmt.isAudioOnly ? (
                        <FileAudio className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      ) : isPrimaryHd ? (
                        <Sparkles className="w-3.5 h-3.5 shrink-0 text-black" />
                      ) : (
                        <FileVideo className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      )}
                      <span className="truncate">{fmt.label}</span>
                      {!fmt.hasWatermark && !fmt.isAudioOnly && (
                        <span
                          className={`hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-semibold uppercase rounded-full ${
                            isPrimaryHd
                              ? "bg-black/10 text-black"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          No Watermark
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {sizeText && (
                        <span
                          className={`text-[11px] ${
                            isPrimaryHd ? "text-neutral-700" : "text-neutral-500"
                          }`}
                        >
                          {sizeText}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium uppercase ${
                          isPrimaryHd
                            ? "bg-black/10 text-black"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                        }`}
                      >
                        .{fmt.ext}
                      </span>
                      {isDownloading ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                      ) : (
                        <Download className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Carousel Slideshow (if any) */}
      {result.images && result.images.length > 0 && (
        <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-neutral-800/80 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>HD Photo Slideshow ({result.images.length} Photos)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {result.images.map((slide) => (
              <div
                key={slide.index}
                className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-black border border-neutral-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.url}
                  alt={`Slide ${slide.index}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                  <span className="text-[11px] font-medium text-white">
                    #{slide.index}
                  </span>
                  <a
                    href={slide.downloadUrl}
                    download
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-medium hover:bg-neutral-200 shadow transition"
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>Save</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
