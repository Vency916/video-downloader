import { execFile } from "child_process";
import { promisify } from "util";
import { MediaFormat, MediaResult, Platform } from "../types";
import { createDownloadUrl } from "../url-signer";

const execFileAsync = promisify(execFile);

interface YtDlpFormat {
  format_id: string;
  ext: string;
  url: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  filesize?: number;
  filesize_approx?: number;
  format_note?: string;
  http_headers?: Record<string, string>;
}

/**
 * Fallback/Universal Extractor using local `yt-dlp` binary if available on the host.
 * Supports 1,000+ platforms including YouTube, Instagram, Facebook, TikTok, X, Twitch, Vimeo.
 */
export async function extractWithYtDlp(
  url: string,
  platform: Platform
): Promise<MediaResult> {
  const { stdout } = await execFileAsync(
    "yt-dlp",
    ["--dump-json", "--no-playlist", "--no-warnings", url],
    { timeout: 25000, maxBuffer: 15 * 1024 * 1024 }
  );

  const info = JSON.parse(stdout);
  const videoId = String(info.id || Date.now());
  const uploader = info.uploader || info.channel || "Creator";
  const handle = info.uploader_id ? `@${info.uploader_id}` : uploader;
  const baseFilename = `${platform}-${videoId}`;

  const rawFormats: YtDlpFormat[] = Array.isArray(info.formats)
    ? info.formats
    : [];

  // Select combined video+audio MP4 streams sorted by resolution descending
  const combinedMp4 = rawFormats
    .filter(
      (f) =>
        f.url &&
        f.ext === "mp4" &&
        f.vcodec &&
        f.vcodec !== "none" &&
        f.acodec &&
        f.acodec !== "none" &&
        !f.url.includes(".m3u8")
    )
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  const formats: MediaFormat[] = [];
  const seenHeights = new Set<number>();

  for (const fmt of combinedMp4) {
    const h = fmt.height || 720;
    if (seenHeights.has(h)) continue;
    seenHeights.add(h);

    const isHd = h >= 720;
    formats.push({
      id: `ytdlp-${fmt.format_id}`,
      label: isHd ? `HD Video (${h}p No Watermark)` : `Standard Video (${h}p)`,
      quality: `${h}p${isHd ? " HD" : ""}`,
      ext: "mp4",
      url: fmt.url,
      downloadUrl: createDownloadUrl({
        url: fmt.url,
        filename: `${baseFilename}-${h}p`,
        ext: "mp4",
        headers: fmt.http_headers,
      }),
      sizeBytes: fmt.filesize || fmt.filesize_approx,
      hasWatermark: false,
      isHd,
    });
  }

  // If yt-dlp returned a direct top-level url
  if (formats.length === 0 && info.url) {
    formats.push({
      id: "ytdlp-best",
      label: "HD Video (Best Quality)",
      quality: `${info.height ? `${info.height}p ` : ""}HD`,
      ext: "mp4",
      url: info.url,
      downloadUrl: createDownloadUrl({
        url: info.url,
        filename: `${baseFilename}-HD`,
        ext: "mp4",
      }),
      hasWatermark: false,
      isHd: true,
    });
  }

  // Audio-only format (M4A/MP3)
  const audioFormats = rawFormats
    .filter(
      (f) =>
        f.url &&
        (!f.vcodec || f.vcodec === "none") &&
        f.acodec &&
        f.acodec !== "none"
    )
    .sort((a, b) => (b.filesize || 0) - (a.filesize || 0));

  if (audioFormats.length > 0) {
    const bestAudio = audioFormats[0];
    formats.push({
      id: `ytdlp-audio-${bestAudio.format_id}`,
      label: "Original Audio Track",
      quality: "Audio (M4A/MP3)",
      ext: "m4a",
      url: bestAudio.url,
      downloadUrl: createDownloadUrl({
        url: bestAudio.url,
        filename: `${baseFilename}-audio`,
        ext: "m4a",
        headers: bestAudio.http_headers,
      }),
      sizeBytes: bestAudio.filesize || bestAudio.filesize_approx,
      isAudioOnly: true,
    });
  }

  if (formats.length === 0) {
    throw new Error("No direct downloadable MP4 stream found via yt-dlp.");
  }

  return {
    id: videoId,
    platform,
    originalUrl: url,
    title: info.title || info.description?.slice(0, 100) || `${platform} Video`,
    author: {
      name: uploader,
      handle,
    },
    thumbnail: info.thumbnail || "",
    durationSeconds: info.duration,
    stats: {
      views: info.view_count,
      likes: info.like_count,
      comments: info.comment_count,
    },
    formats,
    extractorUsed: "yt-dlp Universal Engine",
    extractedAt: new Date().toISOString(),
  };
}

