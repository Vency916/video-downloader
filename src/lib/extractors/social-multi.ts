import { MediaFormat, MediaResult, Platform, SlideImage } from "../types";
import { createDownloadUrl } from "../url-signer";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const BOT_USER_AGENT = "TelegramBot (like TwitterBot)";

/**
 * Extracts X (Twitter) videos and GIFs in highest bitrate MP4.
 */
export async function extractTwitter(url: string): Promise<MediaResult> {
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/i);
  if (!match) {
    throw new Error("Invalid X/Twitter status URL. Expected format: https://x.com/user/status/123456");
  }

  const [, username, statusId] = match;
  const baseFilename = `x-${username}-${statusId}`;

  // Attempt 1: Direct vxTwitter API with Bot User-Agent (bypasses standard 403)
  try {
    const apiUrl = `https://api.vxtwitter.com/${username}/status/${statusId}`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": BOT_USER_AGENT,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.media_extended) {
        const mediaList = data.media_extended || [];
        const videoMedia = mediaList.filter(
          (m: { type?: string; url?: string }) =>
            m.type === "video" || m.type === "gif"
        );

        const formats: MediaFormat[] = [];
        const images: SlideImage[] = [];

        videoMedia.forEach(
          (
            v: {
              url: string;
              thumbnail_url?: string;
              duration_millis?: number;
              size?: { width?: number; height?: number };
            },
            idx: number
          ) => {
            const resolution =
              v.size?.width && v.size?.height
                ? `${v.size.width}x${v.size.height} HD`
                : "HD MP4";
            formats.push({
              id: `twitter-hd-${idx}`,
              label:
                videoMedia.length > 1
                  ? `Video #${idx + 1} (${resolution})`
                  : `HD Video (No Watermark)`,
              quality: resolution,
              ext: "mp4",
              url: v.url,
              downloadUrl: createDownloadUrl({
                url: v.url,
                filename: `${baseFilename}-${idx + 1}-HD`,
                ext: "mp4",
              }),
              hasWatermark: false,
              isHd: true,
            });
          }
        );

        mediaList
          .filter((m: { type?: string }) => m.type === "image")
          .forEach((img: { url: string }, idx: number) => {
            images.push({
              index: idx + 1,
              url: img.url,
              downloadUrl: createDownloadUrl({
                url: img.url,
                filename: `${baseFilename}-img-${idx + 1}`,
                ext: "jpg",
              }),
            });
          });

        if (formats.length > 0 || images.length > 0) {
          const firstMedia = videoMedia[0] || mediaList[0] || {};
          const durationSeconds = firstMedia.duration_millis
            ? Math.round(firstMedia.duration_millis / 1000)
            : undefined;

          return {
            id: statusId,
            platform: "twitter",
            originalUrl: url,
            title: data.text || `X Video by @${data.user_screen_name || username}`,
            author: {
              name: data.user_name || username,
              handle: `@${data.user_screen_name || username}`,
              avatar: data.user_profile_image_url,
            },
            thumbnail:
              firstMedia.thumbnail_url ||
              firstMedia.url ||
              data.user_profile_image_url ||
              "",
            durationSeconds,
            stats: {
              likes: data.likes,
              shares: data.retweets,
              comments: data.replies,
            },
            formats,
            images: images.length > 0 ? images : undefined,
            extractorUsed: "X/Twitter Direct Engine",
            extractedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch {
    // Continue to fallback
  }

  // Attempt 2: VKr Multi-Media Resolver
  try {
    const vkrRes = await fetch(
      `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": USER_AGENT }, cache: "no-store" }
    );
    if (vkrRes.ok) {
      const vkrData = await vkrRes.json();
      if (
        vkrData.success &&
        vkrData.data?.downloads &&
        vkrData.data.downloads.length > 0
      ) {
        const formats: MediaFormat[] = vkrData.data.downloads
          .filter((d: { url?: string }) => !!d.url)
          .map((d: { url: string; quality?: string; ext?: string }, idx: number) => ({
            id: `vkr-twitter-${idx}`,
            label: d.quality ? `${d.quality.toUpperCase()} MP4` : `HD Video`,
            quality: d.quality ? `${d.quality.toUpperCase()} HD` : "HD MP4",
            ext: (d.ext === "mp4" ? "mp4" : "mp4") as "mp4",
            url: d.url,
            downloadUrl: createDownloadUrl({
              url: d.url,
              filename: `${baseFilename}-HD`,
              ext: "mp4",
            }),
            hasWatermark: false,
            isHd: true,
          }));

        if (formats.length > 0) {
          return {
            id: statusId,
            platform: "twitter",
            originalUrl: url,
            title: vkrData.data.title || `X Video by @${username}`,
            author: {
              name: username,
              handle: `@${username}`,
            },
            thumbnail: vkrData.data.thumbnail || "",
            formats,
            extractorUsed: "X Multi-Resolver Engine",
            extractedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch {
    // Fall through
  }

  throw new Error(
    "X (Twitter) restricts access to this post. Ensure the tweet is public and does not contain age-restricted or sensitive content."
  );
}

/**
 * Extracts Facebook video posts and reels in HD/SD without watermarks.
 */
export async function extractFacebook(url: string): Promise<MediaResult> {
  const cleanUrl = url.split("?")[0];
  const idMatch = url.match(/(?:videos|reel|watch)\/([0-9]+)/i) || url.match(/v=([0-9]+)/i);
  const videoId = idMatch ? idMatch[1] : String(Date.now()).slice(-8);
  const baseFilename = `facebook-video-${videoId}`;

  try {
    const apiUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (
        json.success &&
        json.data &&
        Array.isArray(json.data.downloads) &&
        json.data.downloads.length > 0
      ) {
        const downloads = json.data.downloads;
        const formats: MediaFormat[] = [];

        downloads.forEach((d: { url: string; quality?: string; format_id?: string }, idx: number) => {
          if (!d.url) return;
          const isHd = d.quality?.toLowerCase() === "hd" || d.format_id?.toLowerCase() === "hd" || idx === 0;
          formats.push({
            id: `fb-${d.format_id || idx}`,
            label: isHd ? "HD Video (Best Quality)" : "Standard Quality Video",
            quality: isHd ? "720p/1080p HD" : "480p SD",
            ext: "mp4",
            url: d.url,
            downloadUrl: createDownloadUrl({
              url: d.url,
              filename: `${baseFilename}-${isHd ? "HD" : "SD"}`,
              ext: "mp4",
            }),
            hasWatermark: false,
            isHd,
          });
        });

        if (formats.length > 0) {
          return {
            id: videoId,
            platform: "facebook",
            originalUrl: url,
            title: json.data.title || `Facebook Video (${videoId})`,
            author: {
              name: "Facebook Creator",
              handle: "@facebook",
            },
            thumbnail: json.data.thumbnail || "",
            formats,
            extractorUsed: "Facebook Direct Stream Engine",
            extractedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch (err) {
    console.warn("Facebook direct extractor error:", err);
  }

  throw new Error(
    "Could not extract downloadable video stream from this Facebook link. Ensure the video is public and accessible to everyone."
  );
}

/**
 * Extracts YouTube videos & Shorts.
 */
export async function extractYouTube(url: string): Promise<MediaResult> {
  const match =
    url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/i);
  const videoId = match ? match[1] : String(Date.now()).slice(-8);
  const baseFilename = `youtube-${videoId}`;

  // Attempt 1: Multi-Resolver Engine
  try {
    const apiUrl = `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (
        json.success &&
        json.data &&
        Array.isArray(json.data.downloads) &&
        json.data.downloads.length > 0
      ) {
        const formats: MediaFormat[] = json.data.downloads
          .filter((d: { url?: string }) => !!d.url)
          .map((d: { url: string; quality?: string; format_id?: string }, idx: number) => ({
            id: `yt-stream-${idx}`,
            label: d.quality ? `Video (${d.quality})` : `HD Video`,
            quality: d.quality || "720p HD",
            ext: "mp4",
            url: d.url,
            downloadUrl: createDownloadUrl({
              url: d.url,
              filename: `${baseFilename}-HD`,
              ext: "mp4",
            }),
            hasWatermark: false,
            isHd: true,
          }));

        if (formats.length > 0) {
          return {
            id: videoId,
            platform: "youtube",
            originalUrl: url,
            title: json.data.title || `YouTube Video #${videoId}`,
            author: {
              name: "YouTube Creator",
              handle: "@youtube",
            },
            thumbnail:
              json.data.thumbnail ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            formats,
            extractorUsed: "YouTube Multi-Stream Engine",
            extractedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch {
    // Continue
  }

  throw new Error(
    "YouTube blocks serverless cloud IP addresses on Vercel. To enable unlimited YouTube downloads in production, configure COBALT_API_URL in your Vercel Environment Variables, or run locally using npm run dev."
  );
}

/**
 * Extracts Reddit videos (v.redd.it / reddit.com/r/...) via Reddit's JSON endpoint.
 */
export async function extractReddit(url: string): Promise<MediaResult> {
  const finalRes = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    headers: { "User-Agent": USER_AGENT },
  }).catch(() => null);

  const resolvedUrl = finalRes?.url || url;
  const cleanUrl = resolvedUrl.split("?")[0].replace(/\/$/, "");
  const jsonUrl = `${cleanUrl}.json`;

  const res = await fetch(jsonUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; VortexVideoDownloader/1.0; +https://localhost)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Reddit API responded with HTTP ${res.status}`);
  }

  const data = await res.json();
  const post =
    data?.[0]?.data?.children?.[0]?.data ||
    data?.data?.children?.[0]?.data;

  if (!post) {
    throw new Error("Could not parse Reddit post metadata.");
  }

  const redditVideo =
    post.secure_media?.reddit_video ||
    post.media?.reddit_video ||
    post.crosspost_parent_list?.[0]?.secure_media?.reddit_video;

  if (!redditVideo || !redditVideo.fallback_url) {
    throw new Error("This Reddit post does not contain a hosted Reddit video.");
  }

  const fallbackUrl: string = redditVideo.fallback_url.split("?")[0];
  const postId = post.id || String(Date.now());
  const baseFilename = `reddit-${post.subreddit || "video"}-${postId}`;

  const formats: MediaFormat[] = [
    {
      id: "reddit-hd",
      label: `HD Video (${redditVideo.height || 720}p)`,
      quality: `${redditVideo.height || 720}p HD`,
      ext: "mp4",
      url: fallbackUrl,
      downloadUrl: createDownloadUrl({
        url: fallbackUrl,
        filename: `${baseFilename}-HD`,
        ext: "mp4",
      }),
      hasWatermark: false,
      isHd: true,
    },
  ];

  if (redditVideo.height && redditVideo.height >= 720) {
    const sdUrl = fallbackUrl.replace(/DASH_\d+\.mp4/, "DASH_480.mp4");
    if (sdUrl !== fallbackUrl) {
      formats.push({
        id: "reddit-sd",
        label: "Standard Video (480p)",
        quality: "480p",
        ext: "mp4",
        url: sdUrl,
        downloadUrl: createDownloadUrl({
          url: sdUrl,
          filename: `${baseFilename}-480p`,
          ext: "mp4",
        }),
        hasWatermark: false,
      });
    }
  }

  const rawThumb =
    post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") ||
    post.thumbnail ||
    "";

  return {
    id: postId,
    platform: "reddit",
    originalUrl: url,
    title: post.title || `Reddit Video in r/${post.subreddit}`,
    author: {
      name: `u/${post.author || "redditor"}`,
      handle: `r/${post.subreddit || "reddit"}`,
    },
    thumbnail: rawThumb.startsWith("http") ? rawThumb : "",
    durationSeconds: redditVideo.duration,
    stats: {
      likes: post.ups,
      comments: post.num_comments,
    },
    formats,
    extractorUsed: "Reddit Direct Media Engine",
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Extracts Instagram Reels / Posts.
 */
export async function extractInstagram(url: string): Promise<MediaResult> {
  const match = url.match(
    /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (!match) {
    throw new Error(
      "Invalid Instagram URL. Please paste a direct Instagram Reel or Post link (e.g. https://www.instagram.com/reel/...)."
    );
  }

  const shortcode = match[1];
  const baseFilename = `instagram-reel-${shortcode}`;

  // Attempt 1: Embed scraper
  try {
    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
    const res = await fetch(embedUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (res.ok) {
      const html = await res.text();
      const videoUrlMatch =
        html.match(/"video_url"\s*:\s*"([^"]+)"/) ||
        html.match(/property="og:video"\s+content="([^"]+)"/);

      if (videoUrlMatch && videoUrlMatch[1]) {
        const rawVideoUrl = videoUrlMatch[1]
          .replace(/\\u0026/g, "&")
          .replace(/\\\//g, "/")
          .replace(/&amp;/g, "&");

        const thumbMatch =
          html.match(/"display_url"\s*:\s*"([^"]+)"/) ||
          html.match(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/);
        const thumbnail = thumbMatch?.[1]
          ? thumbMatch[1]
              .replace(/\\u0026/g, "&")
              .replace(/\\\//g, "/")
              .replace(/&amp;/g, "&")
          : "";

        const userMatch = html.match(/"username"\s*:\s*"([^"]+)"/);
        const username = userMatch?.[1] || "instagram_creator";

        return {
          id: shortcode,
          platform: "instagram",
          originalUrl: url,
          title: `Instagram Reel by @${username} (${shortcode})`,
          author: {
            name: username,
            handle: `@${username}`,
          },
          thumbnail,
          formats: [
            {
              id: "ig-hd-nowm",
              label: "HD Reel (No Watermark)",
              quality: "1080p HD",
              ext: "mp4",
              url: rawVideoUrl,
              downloadUrl: createDownloadUrl({
                url: rawVideoUrl,
                filename: `${baseFilename}-HD`,
                ext: "mp4",
                headers: {
                  Referer: "https://www.instagram.com/",
                },
              }),
              hasWatermark: false,
              isHd: true,
            },
          ],
          extractorUsed: "Instagram Embed Stream Extractor",
          extractedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // Attempt 2: VKr Multi-Media Resolver
  try {
    const vkrRes = await fetch(
      `https://vkrdownloader.org/server/?api_key=vkrdownloader&vkr=${encodeURIComponent(url)}`,
      { headers: { "User-Agent": USER_AGENT }, cache: "no-store" }
    );
    if (vkrRes.ok) {
      const vkrData = await vkrRes.json();
      if (
        vkrData.success &&
        vkrData.data?.downloads &&
        vkrData.data.downloads.length > 0
      ) {
        const formats: MediaFormat[] = vkrData.data.downloads
          .filter((d: { url?: string }) => !!d.url)
          .map((d: { url: string; quality?: string }, idx: number) => ({
            id: `vkr-ig-${idx}`,
            label: "HD Reel (No Watermark)",
            quality: "HD MP4",
            ext: "mp4",
            url: d.url,
            downloadUrl: createDownloadUrl({
              url: d.url,
              filename: `${baseFilename}-HD`,
              ext: "mp4",
            }),
            hasWatermark: false,
            isHd: true,
          }));

        if (formats.length > 0) {
          return {
            id: shortcode,
            platform: "instagram",
            originalUrl: url,
            title: vkrData.data.title || `Instagram Reel (${shortcode})`,
            author: {
              name: "Instagram Creator",
              handle: "@instagram",
            },
            thumbnail: vkrData.data.thumbnail || "",
            formats,
            extractorUsed: "Instagram Multi-Resolver",
            extractedAt: new Date().toISOString(),
          };
        }
      }
    }
  } catch {
    // Continue
  }

  throw new Error(
    "Instagram blocked serverless cloud access for this Reel. Set COBALT_API_URL in your Vercel Environment Variables, or run locally using npm run dev."
  );
}

/**
 * Extracts Pinterest Video Pins directly from the Pin page JSON metadata.
 */
export async function extractPinterest(url: string): Promise<MediaResult> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Pinterest responded with HTTP ${res.status}`);
  }

  const html = await res.text();
  const mp4Match = html.match(/https:\/\/v1\.pinimg\.com\/videos\/[^\s"'\\]+\.mp4/);
  if (!mp4Match) {
    throw new Error("No direct MP4 video stream found on this Pinterest Pin.");
  }

  const videoUrl = mp4Match[0];
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const thumbMatch = html.match(/https:\/\/i\.pinimg\.com\/originals\/[^\s"'\\]+\.(?:jpg|png)/);
  const pinId = String(Date.now()).slice(-6);

  return {
    id: pinId,
    platform: "pinterest",
    originalUrl: url,
    title: titleMatch?.[1]?.replace(/\s*\|\s*Pinterest/i, "").trim() || "Pinterest Video Pin",
    author: {
      name: "Pinterest Creator",
      handle: "@pinterest",
    },
    thumbnail: thumbMatch?.[0] || "",
    formats: [
      {
        id: "pinterest-hd",
        label: "HD Video (No Watermark)",
        quality: "HD MP4",
        ext: "mp4",
        url: videoUrl,
        downloadUrl: createDownloadUrl({
          url: videoUrl,
          filename: `pinterest-video-${pinId}-HD`,
          ext: "mp4",
        }),
        hasWatermark: false,
        isHd: true,
      },
    ],
    extractorUsed: "Pinterest Direct Pin Engine",
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Optional Cobalt API Adapter (supports YouTube, Instagram, Facebook, TikTok, Reddit, etc.)
 */
export async function extractViaCobalt(
  url: string,
  platform: Platform
): Promise<MediaResult> {
  const cobaltEndpoint = process.env.COBALT_API_URL;
  if (!cobaltEndpoint) {
    throw new Error("COBALT_API_URL is not configured");
  }

  const res = await fetch(cobaltEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(process.env.COBALT_API_KEY
        ? { Authorization: `Api-Key ${process.env.COBALT_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      url,
      videoQuality: "1080",
      filenameStyle: "pretty",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Cobalt API returned status ${res.status}`);
  }

  const data = await res.json();
  if (data.status === "error" || !data.url) {
    throw new Error(data.error?.code || "Cobalt could not extract media");
  }

  const id = String(Date.now()).slice(-8);
  const baseFilename = `${platform}-${id}-HD`;

  return {
    id,
    platform,
    originalUrl: url,
    title: data.filename || `${platform.toUpperCase()} HD Video`,
    author: {
      name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Creator`,
      handle: `@${platform}`,
    },
    thumbnail: "",
    formats: [
      {
        id: `${platform}-cobalt-hd`,
        label: "HD Video (No Watermark)",
        quality: "1080p HD",
        ext: "mp4",
        url: data.url,
        downloadUrl: createDownloadUrl({
          url: data.url,
          filename: baseFilename,
          ext: "mp4",
        }),
        hasWatermark: false,
        isHd: true,
      },
    ],
    extractorUsed: "Cobalt Media Engine",
    extractedAt: new Date().toISOString(),
  };
}
