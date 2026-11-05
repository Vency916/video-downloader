# VortexDL — Next.js Multi-Platform HD Video Downloader (No Watermark)

A full-stack Next.js (App Router + TypeScript + Tailwind CSS) social media video downloader that extracts **1080p HD TikTok videos without watermark**, original MP3 audio tracks, TikTok photo carousel slideshows, and videos from **Instagram Reels, X (Twitter), Reddit, Pinterest, YouTube, and Facebook**.

## Features

- **TikTok 1080p Full HD (No Watermark):** Extracts raw `hdplay` (1080p) and `play` (720p) streams before username watermarks are overlaid, plus watermarked and MP3 audio options.
- **TikTok Photo Slideshows:** Automatically detects photo carousels and provides individual HD image downloads.
- **Multi-Platform Hybrid Engine:**
  - **TikTok:** Direct TikWM HD API (`hd=1`) + Direct Web Rehydration scraper fallback.
  - **X (Twitter):** Direct syndication / `vxtwitter` MP4 extraction.
  - **Reddit:** Direct `v.redd.it` DASH HD MP4 extraction via Reddit JSON API.
  - **Instagram Reels & Pinterest:** Direct embed/pin stream extraction.
  - **Universal `yt-dlp` & Cobalt Fallback:** Automatically uses `yt-dlp` (if installed on the system) or `COBALT_API_URL` (if set in `.env.local`) for 1,000+ platforms including YouTube and Facebook.
- **HMAC-Signed Streaming Download Proxy (`/api/download`):** Streams video bytes directly from the upstream CDN to the browser with `Content-Disposition: attachment` and proper `Referer`/`User-Agent` headers.
- **Batch Mode & Local History:** Paste multiple links at once or revisit recent extractions from `localStorage`.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

