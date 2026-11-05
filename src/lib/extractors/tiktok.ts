import { MediaFormat, MediaResult, SlideImage } from "../types";
import { createDownloadUrl } from "../url-signer";

const TIKWM_API = "https://www.tikwm.com/api/";

function resolveTikwmUrl(urlOrPath?: string): string {
  if (!urlOrPath) return "";
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    return urlOrPath;
  }
  return `https://www.tikwm.com${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;
}

/**
 * Extracts TikTok video in 1080p HD without watermark, 720p without watermark,
 * watermarked version, original MP3 audio, and photo carousel slideshows.
 */
export async function extractTikTok(url: string): Promise<MediaResult> {
  // Primary Adapter: TikWM HD API (supports hd=1 for 1080p H.264/ByteVC1 no-watermark)
  try {
    const body = new URLSearchParams({
      url,
      hd: "1",
    });

    const response = await fetch(TIKWM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: body.toString(),
      cache: "no-store",
    });

    if (response.ok) {
      const json = await response.json();
      if (json.code === 0 && json.data) {
        const d = json.data;
        const videoId = String(d.id || Date.now());
        const authorHandle = d.author?.unique_id || "tiktok_creator";
        const authorName = d.author?.nickname || authorHandle;
        const title =
          d.title?.trim() || `TikTok Video by @${authorHandle} (${videoId})`;
        const baseFilename = `tiktok-${authorHandle}-${videoId}`;

        const formats: MediaFormat[] = [];

        // 1. 1080p Full HD (No Watermark)
        const hdPlayUrl = resolveTikwmUrl(d.hdplay);
        const sdPlayUrl = resolveTikwmUrl(d.play);

        if (hdPlayUrl) {
          formats.push({
            id: "tiktok-hd-nowm",
            label: "Full HD (No Watermark)",
            quality: "1080p HD",
            ext: "mp4",
            url: hdPlayUrl,
            downloadUrl: createDownloadUrl({
              url: hdPlayUrl,
              filename: `${baseFilename}-1080p-HD`,
              ext: "mp4",
            }),
            sizeBytes: typeof d.hd_size === "number" ? d.hd_size : undefined,
            hasWatermark: false,
            isHd: true,
          });
        }

        // 2. Standard HD 720p (No Watermark)
        if (sdPlayUrl && sdPlayUrl !== hdPlayUrl) {
          formats.push({
            id: "tiktok-sd-nowm",
            label: hdPlayUrl ? "Standard HD (No Watermark)" : "HD (No Watermark)",
            quality: "720p",
            ext: "mp4",
            url: sdPlayUrl,
            downloadUrl: createDownloadUrl({
              url: sdPlayUrl,
              filename: `${baseFilename}-NoWatermark`,
              ext: "mp4",
            }),
            sizeBytes: typeof d.size === "number" ? d.size : undefined,
            hasWatermark: false,
            isHd: !hdPlayUrl,
          });
        }

        // 3. Watermarked version
        const wmPlayUrl = resolveTikwmUrl(d.wmplay);
        if (wmPlayUrl) {
          formats.push({
            id: "tiktok-wm",
            label: "Original (With Watermark)",
            quality: "Watermarked",
            ext: "mp4",
            url: wmPlayUrl,
            downloadUrl: createDownloadUrl({
              url: wmPlayUrl,
              filename: `${baseFilename}-Watermarked`,
              ext: "mp4",
            }),
            sizeBytes: typeof d.wm_size === "number" ? d.wm_size : undefined,
            hasWatermark: true,
            isHd: false,
          });
        }

        // 4. Original Audio (MP3)
        const musicUrl = resolveTikwmUrl(d.music || d.music_info?.play);
        if (musicUrl) {
          formats.push({
            id: "tiktok-audio",
            label: `Original Audio (${d.music_info?.title || "MP3"})`,
            quality: "MP3 Audio",
            ext: "mp3",
            url: musicUrl,
            downloadUrl: createDownloadUrl({
              url: musicUrl,
              filename: `${baseFilename}-audio`,
              ext: "mp3",
            }),
            isAudioOnly: true,
          });
        }

        // 5. Photo Carousel Slideshow (if TikTok post is a photo slideshow)
        let images: SlideImage[] | undefined;
        if (Array.isArray(d.images) && d.images.length > 0) {
          images = d.images.map((imgUrl: string, idx: number) => ({
            index: idx + 1,
            url: imgUrl,
            downloadUrl: createDownloadUrl({
              url: imgUrl,
              filename: `${baseFilename}-slide-${idx + 1}`,
              ext: "jpg",
            }),
          }));
        }

        return {
          id: videoId,
          platform: "tiktok",
          originalUrl: url,
          title,
          author: {
            name: authorName,
            handle: `@${authorHandle}`,
            avatar: resolveTikwmUrl(d.author?.avatar),
          },
          thumbnail: resolveTikwmUrl(d.origin_cover || d.cover),
          durationSeconds:
            typeof d.duration === "number" ? d.duration : undefined,
          stats: {
            views: d.play_count,
            likes: d.digg_count,
            comments: d.comment_count,
            shares: d.share_count,
          },
          formats,
          images,
          extractorUsed: "TikTok HD Direct Engine",
          extractedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("Primary TikWM extractor warning, trying fallback:", err);
  }

  // Fallback Adapter: Direct TikTok Web Page Rehydration Scraper
  return await extractTikTokDirectPage(url);
}

async function extractTikTokDirectPage(url: string): Promise<MediaResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TikTok page responded with status ${res.status}`);
  }

  const html = await res.text();
  const scriptMatch = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );

  if (!scriptMatch || !scriptMatch[1]) {
    throw new Error(
      "Could not extract TikTok video stream data. Please verify the link is a public TikTok video."
    );
  }

  const data = JSON.parse(scriptMatch[1]);
  const itemStruct =
    data?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;

  if (!itemStruct) {
    throw new Error(
      "TikTok video details not found. The video may be private or region-restricted."
    );
  }

  const videoId = String(itemStruct.id || Date.now());
  const authorHandle = itemStruct.author?.uniqueId || "tiktok_user";
  const baseFilename = `tiktok-${authorHandle}-${videoId}`;
  const playAddr = itemStruct.video?.playAddr;
  const downloadAddr = itemStruct.video?.downloadAddr;
  const cookieHeader = res.headers.get("set-cookie") || "";

  const formats: MediaFormat[] = [];

  if (playAddr) {
    formats.push({
      id: "tiktok-direct-nowm",
      label: "HD Video (No Watermark)",
      quality: `${itemStruct.video?.ratio || "1080p"} HD`,
      ext: "mp4",
      url: playAddr,
      downloadUrl: createDownloadUrl({
        url: playAddr,
        filename: `${baseFilename}-HD-NoWatermark`,
        ext: "mp4",
        headers: {
          Referer: "https://www.tiktok.com/",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      }),
      hasWatermark: false,
      isHd: true,
    });
  }

  if (downloadAddr && downloadAddr !== playAddr) {
    formats.push({
      id: "tiktok-direct-wm",
      label: "Original (Watermarked)",
      quality: "Watermarked",
      ext: "mp4",
      url: downloadAddr,
      downloadUrl: createDownloadUrl({
        url: downloadAddr,
        filename: `${baseFilename}-Watermarked`,
        ext: "mp4",
        headers: {
          Referer: "https://www.tiktok.com/",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      }),
      hasWatermark: true,
    });
  }

  if (itemStruct.music?.playUrl) {
    formats.push({
      id: "tiktok-direct-audio",
      label: `Audio (${itemStruct.music.title || "MP3"})`,
      quality: "MP3 Audio",
      ext: "mp3",
      url: itemStruct.music.playUrl,
      downloadUrl: createDownloadUrl({
        url: itemStruct.music.playUrl,
        filename: `${baseFilename}-audio`,
        ext: "mp3",
      }),
      isAudioOnly: true,
    });
  }

  return {
    id: videoId,
    platform: "tiktok",
    originalUrl: url,
    title: itemStruct.desc || `TikTok by @${authorHandle}`,
    author: {
      name: itemStruct.author?.nickname || authorHandle,
      handle: `@${authorHandle}`,
      avatar: itemStruct.author?.avatarThumb,
    },
    thumbnail: itemStruct.video?.originCover || itemStruct.video?.cover || "",
    durationSeconds: itemStruct.video?.duration,
    stats: {
      views: itemStruct.stats?.playCount,
      likes: itemStruct.stats?.diggCount,
      comments: itemStruct.stats?.commentCount,
      shares: itemStruct.stats?.shareCount,
    },
    formats,
    extractorUsed: "TikTok Web Rehydration Engine",
    extractedAt: new Date().toISOString(),
  };
}

