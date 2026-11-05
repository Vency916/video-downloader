import { MediaFormat, MediaResult, Platform, SlideImage } from "../types";
import { createDownloadUrl } from "../url-signer";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Extracts X (Twitter) videos and GIFs in highest bitrate MP4 using vxtwitter / fxtwitter API.
 */
export async function extractTwitter(url: string): Promise<MediaResult> {
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/i);
  if (!match) {
    throw new Error("Invalid X/Twitter status URL. Expected format: https://x.com/user/status/123456");
  }

  const [, username, statusId] = match;
  const apiUrl = `https://api.vxtwitter.com/${username}/status/${statusId}`;

  const res = await fetch(apiUrl, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`X/Twitter resolver returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const mediaList = data.media_extended || [];
  const videoMedia = mediaList.filter(
    (m: { type?: string; url?: string }) =>
      m.type === "video" || m.type === "gif"
  );

  const formats: MediaFormat[] = [];
  const images: SlideImage[] = [];
  const baseFilename = `x-${data.user_screen_name || username}-${statusId}`;

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

  // Also include images if tweet contains photos
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

  if (formats.length === 0 && images.length === 0) {
    throw new Error("No downloadable video or media found in this X/Twitter post.");
  }

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
    extractorUsed: "X/Twitter Direct Syndication Engine",
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Extracts Reddit videos (v.redd.it / reddit.com/r/...) via Reddit's JSON endpoint.
 */
export async function extractReddit(url: string): Promise<MediaResult> {
  // Resolve short redd.it links first
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

  // Add standard 480p option if original is >= 720p
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
 * Extracts Instagram Reels / Posts via embed page scraping or configured Cobalt instance.
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

    // Look for escaped video_url in Instagram's embed JSON
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
      const baseFilename = `instagram-${username}-${shortcode}`;

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

  throw new Error(
    "Instagram blocked direct anonymous embed extraction for this Reel. Install yt-dlp locally or set COBALT_API_URL in .env.local for authenticated Instagram extraction."
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
 * Optional Cobalt API Adapter (if user configures COBALT_API_URL in .env.local)
 * Supports YouTube, Instagram, Facebook, TikTok, Reddit, Pinterest, etc.
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

