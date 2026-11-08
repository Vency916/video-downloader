import { detectPlatform, extractUrlFromText } from "../platform-detector";
import { MediaResult } from "../types";
import {
  extractFacebook,
  extractInstagram,
  extractPinterest,
  extractReddit,
  extractTwitter,
  extractViaCobalt,
  extractYouTube,
} from "./social-multi";
import { extractTikTok } from "./tiktok";
import { extractWithYtDlp } from "./ytdlp";

/**
 * Main extraction orchestrator:
 * 1. Sanitizes and extracts the clean URL from pasted text
 * 2. Detects platform
 * 3. Runs dedicated platform HD no-watermark extractor
 * 4. Automatically falls back to Cobalt (if configured) or local yt-dlp (if installed locally)
 */
export async function extractMedia(rawInput: string): Promise<MediaResult> {
  const cleanUrl = extractUrlFromText(rawInput);
  if (!cleanUrl) {
    throw new Error("Please enter a valid video URL starting with https://");
  }

  const platform = detectPlatform(cleanUrl);
  const errors: string[] = [];

  // 1. Platform-Specific Direct Cloud Extractors
  try {
    switch (platform) {
      case "tiktok":
        return await extractTikTok(cleanUrl);
      case "twitter":
        return await extractTwitter(cleanUrl);
      case "reddit":
        return await extractReddit(cleanUrl);
      case "facebook":
        return await extractFacebook(cleanUrl);
      case "youtube":
        return await extractYouTube(cleanUrl);
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

  // 2. Secondary Fallback: Cobalt API (if COBALT_API_URL is configured)
  if (process.env.COBALT_API_URL) {
    try {
      return await extractViaCobalt(cleanUrl, platform);
    } catch (err) {
      errors.push(
        `Cobalt: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // 3. Local Binary Fallback: Local yt-dlp (works in local dev environments)
  try {
    return await extractWithYtDlp(cleanUrl, platform);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("ENOENT")) {
      errors.push(`yt-dlp: ${msg}`);
    }
  }

  throw new Error(
    errors[0] ||
      "Unable to extract media from this link. Make sure the video is public and the URL is valid."
  );
}
