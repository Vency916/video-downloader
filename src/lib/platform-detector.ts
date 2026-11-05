import { Platform } from "./types";

export interface PlatformMeta {
  id: Platform;
  name: string;
  badgeColor: string;
  accentGradient: string;
  placeholder: string;
  domains: string[];
}

export const PLATFORM_CONFIG: Record<Platform, PlatformMeta> = {
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    badgeColor: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    accentGradient: "from-pink-500 via-rose-500 to-cyan-400",
    placeholder: "https://www.tiktok.com/@user/video/... or https://vm.tiktok.com/...",
    domains: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    accentGradient: "from-purple-500 via-pink-500 to-orange-400",
    placeholder: "https://www.instagram.com/reel/...",
    domains: ["instagram.com", "instagr.am"],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
    accentGradient: "from-red-600 to-rose-500",
    placeholder: "https://www.youtube.com/shorts/... or https://youtu.be/...",
    domains: ["youtube.com", "youtu.be", "music.youtube.com"],
  },
  twitter: {
    id: "twitter",
    name: "X (Twitter)",
    badgeColor: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    accentGradient: "from-sky-400 to-blue-600",
    placeholder: "https://x.com/user/status/... or https://twitter.com/...",
    domains: ["twitter.com", "x.com", "t.co"],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    accentGradient: "from-blue-500 to-indigo-600",
    placeholder: "https://www.facebook.com/reel/... or https://fb.watch/...",
    domains: ["facebook.com", "fb.watch", "fb.com"],
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    accentGradient: "from-orange-500 to-amber-500",
    placeholder: "https://www.reddit.com/r/.../comments/...",
    domains: ["reddit.com", "redd.it", "v.redd.it"],
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    accentGradient: "from-rose-600 to-red-500",
    placeholder: "https://www.pinterest.com/pin/...",
    domains: ["pinterest.com", "pin.it"],
  },
  unknown: {
    id: "unknown",
    name: "Social Video",
    badgeColor: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    accentGradient: "from-violet-500 via-fuchsia-500 to-cyan-400",
    placeholder: "Paste TikTok, Instagram, X, YouTube, Reddit, or Facebook link...",
    domains: [],
  },
};

/**
 * Extracts the first valid https:// or http:// URL from arbitrary pasted text
 * (e.g. mobile share text like "7.45 复制打开抖音... https://vm.tiktok.com/ZMxxx/").
 */
export function extractUrlFromText(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlRegex = /https?:\/\/[^\s"'<>]+/i;
  const match = trimmed.match(urlRegex);
  if (match) {
    // Strip trailing punctuation sometimes copied from messages
    return match[0].replace(/[.,;!?)]+$/, "");
  }

  // Handle domain without protocol if user typed tiktok.com/...
  if (/^(www\.|vm\.|vt\.)?(tiktok|instagram|youtube|youtu\.be|twitter|x|facebook|fb\.watch|reddit|pinterest)\./i.test(trimmed)) {
    return `https://${trimmed.split(/\s+/)[0]}`;
  }

  return null;
}

/**
 * Detects which social platform a URL belongs to.
 */
export function detectPlatform(rawInput: string): Platform {
  const extracted = extractUrlFromText(rawInput);
  if (!extracted) return "unknown";

  try {
    const parsed = new URL(extracted);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    for (const [platformKey, meta] of Object.entries(PLATFORM_CONFIG)) {
      if (platformKey === "unknown") continue;
      if (
        meta.domains.some(
          (domain) => host === domain || host.endsWith(`.${domain}`)
        )
      ) {
        return platformKey as Platform;
      }
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Formats file size in bytes into human-readable MB/KB.
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

/**
 * Formats duration in seconds to MM:SS.
 */
export function formatDuration(seconds?: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

