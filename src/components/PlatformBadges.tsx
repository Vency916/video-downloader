"use client";

import { PLATFORM_CONFIG } from "@/lib/platform-detector";
import { Platform } from "@/lib/types";
import React from "react";

interface PlatformBadgesProps {
  activePlatform: Platform;
  onSelectPlatform?: (platform: Platform) => void;
}

// Official authentic SVG brand icons
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.563 1.25 1.25s-.562 1.25-1.25 1.25a1.25 1.25 0 0 1-1.188-.865l-2.094.444.808 3.794a4.137 4.137 0 0 1 1.764-.397c1.197 0 2.167.97 2.167 2.167 0 .808-.444 1.51-1.097 1.879.062.277.094.563.094.854 0 2.476-2.88 4.484-6.438 4.484s-6.438-2.008-6.438-4.484c0-.291.032-.577.094-.854a2.16 2.16 0 0 1-1.097-1.879c0-1.197.97-2.167 2.167-2.167.66 0 1.25.304 1.64.779l2.42-.513-.96-4.508 2.766-.587a1.246 1.246 0 0 1 1.188.859zm-6.19 8.016a1.134 1.134 0 1 0 0 2.268 1.134 1.134 0 0 0 0-2.268zm4.36 0a1.134 1.134 0 1 0 0 2.268 1.134 1.134 0 0 0 0-2.268zm-4.36 4.382c.078.078.188.118.297.118.109 0 .219-.04.297-.118.39-.39 1.03-.39 1.42 0 .078.078.188.118.297.118.109 0 .219-.04.297-.118a.42.42 0 0 0 0-.594 1.868 1.868 0 0 0-2.608 0 .42.42 0 0 0 0 .594z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className || "w-3.5 h-3.5"}
      aria-hidden="true"
    >
      <path d="M12 0a12 12 0 0 0-4.37 23.18c-.07-.98-.13-2.48.03-3.55l1.04-4.41s-.27-.53-.27-1.32c0-1.24.72-2.16 1.61-2.16.76 0 1.13.57 1.13 1.25 0 .76-.49 1.9-1.74 2.96-.21.89.44 1.62 1.32 1.62 1.58 0 2.8-1.67 2.8-4.07 0-2.13-1.53-3.62-3.71-3.62-2.53 0-4.01 1.9-4.01 3.86 0 .77.29 1.59.66 2.04.07.09.08.17.06.26l-.25 1.02c-.04.16-.13.2-.3.12-1.12-.52-1.82-2.16-1.82-3.48 0-2.83 2.06-5.43 5.94-5.43 3.12 0 5.54 2.22 5.54 5.19 0 3.1-1.95 5.59-4.66 5.59-.91 0-1.77-.47-2.06-1.03l-.56 2.14c-.2 1.01-.75 2.28-1.12 3.08A12 12 0 1 0 12 0z" />
    </svg>
  );
}

const REAL_PLATFORM_ICONS: Record<Platform, (props: { className?: string }) => React.JSX.Element> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  twitter: XIcon,
  reddit: RedditIcon,
  youtube: YouTubeIcon,
  facebook: FacebookIcon,
  pinterest: PinterestIcon,
  unknown: TikTokIcon,
};

const DISPLAY_PLATFORMS: Platform[] = [
  "tiktok",
  "instagram",
  "twitter",
  "reddit",
  "youtube",
  "facebook",
  "pinterest",
];

export default function PlatformBadges({
  activePlatform,
  onSelectPlatform,
}: PlatformBadgesProps) {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
        {DISPLAY_PLATFORMS.map((platformKey) => {
          const meta = PLATFORM_CONFIG[platformKey];
          const isActive = activePlatform === platformKey;
          const IconComponent = REAL_PLATFORM_ICONS[platformKey];

          return (
            <button
              key={platformKey}
              type="button"
              onClick={() => onSelectPlatform?.(platformKey)}
              className={`group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${
                isActive
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.18)] scale-[1.02]"
                  : "bg-[#111218]/90 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200"
              }`}
            >
              <span
                className={`transition-colors ${
                  isActive
                    ? "text-black"
                    : "text-neutral-400 group-hover:text-white"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </span>
              <span>{meta.name}</span>
              {platformKey === "tiktok" && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase tracking-wider ${
                    isActive
                      ? "bg-black/10 text-black"
                      : "bg-pink-500/15 text-pink-300 border border-pink-500/30"
                  }`}
                >
                  HD NO-WM
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
