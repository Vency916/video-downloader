export type Platform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "twitter"
  | "facebook"
  | "reddit"
  | "pinterest"
  | "unknown";

export interface MediaFormat {
  id: string;
  label: string;
  quality: string; // e.g. "1080p HD", "720p", "Original Audio", "Watermarked"
  ext: "mp4" | "mp3" | "m4a" | "webm" | "jpg";
  url: string; // Direct upstream URL
  downloadUrl: string; // Proxied /api/download URL for instant browser file save
  sizeBytes?: number;
  hasWatermark?: boolean;
  isAudioOnly?: boolean;
  isHd?: boolean;
  headers?: Record<string, string>;
}

export interface SlideImage {
  index: number;
  url: string;
  downloadUrl: string;
}

export interface MediaResult {
  id: string;
  platform: Platform;
  originalUrl: string;
  title: string;
  author: {
    name: string;
    handle: string;
    avatar?: string;
  };
  thumbnail: string;
  durationSeconds?: number;
  stats?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  formats: MediaFormat[];
  images?: SlideImage[]; // For TikTok / IG photo slideshows
  extractorUsed: string;
  extractedAt: string;
}

export interface ExtractResponse {
  success: boolean;
  data?: MediaResult;
  error?: string;
}

