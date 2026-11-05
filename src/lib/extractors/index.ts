import { detectPlatform, extractUrlFromText } from "../platform-detector";
import { MediaResult } from "../types";
import {
  extractInstagram,
  extractPinterest,
  extractReddit,
  extractTwitter,
  extractViaCobalt,
} from "./social-multi";
import { extractTikTok } from "./tiktok";
import { extractWithYtDlp } from "./ytdlp";

/**
 * Main extraction orchestrator:
 * 1. Sanitizes and extracts the clean URL from pasted text
 * 2. Detects platform
 * 3. Runs dedicated platform HD no-watermark extractor
 * 4. Automatically falls back to Cobalt (if configured) or yt-dlp (if installed locally)
 */
export async function extractMedia(rawInput: string): Promise<MediaResult> {
  const cleanUrl = extractUrlFromText(rawInput);
  if (!cleanUrl) {
    throw new Error("Please enter a valid video URL starting with https://");
  }

  const platform = detectPlatform(cleanUrl);
  const errors: string[] = [];

  // 1. Platform-Specific Direct Extractors (Zero external binary required)
  try {
    switch (platform) {
      case "tiktok":
        return await extractTikTok(cleanUrl);
      case "twitter":
        return await extractTwitter(cleanUrl);
      case "reddit":
        return await extractReddit(cleanUrl);
      case "instagram":
        return await extractInstagram(cleanUrl);
      case "pinterest":
        return await extractPinterest(cleanUrl);
      default:
        break;
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  // 2. Secondary Fallback: Cobalt API (if COBALT_API_URL is configured in environment)
  if (process.env.COBALT_API_URL) {
    try {
      return await extractViaCobalt(cleanUrl, platform);
    } catch (err) {
      errors.push(
        `Cobalt: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 3. Universal Fallback: Local yt-dlp binary (supports YouTube, Facebook, Instagram, TikTok, 1000+ sites)
  try {
    return await extractWithYtDlp(cleanUrl, platform);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("ENOENT")) {
      errors.push(`yt-dlp: ${msg}`);
    } else if (platform === "youtube" || platform === "facebook") {
      errors.push(
        `For ${platform.toUpperCase()} extraction, install yt-dlp on your machine (e.g. "winget install yt-dlp") or set COBALT_API_URL in .env.local.`
      );
    }
  }

  throw new Error(
    errors[0] ||
      "Unable to extract media from this link. Make sure the video is public and the URL is valid."
  );
}

