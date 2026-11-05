import crypto from "crypto";

export interface DownloadTokenPayload {
  url: string;
  filename: string;
  ext: string;
  headers?: Record<string, string>;
  exp: number;
}

const SECRET_KEY =
  process.env.DOWNLOAD_TOKEN_SECRET ||
  "vortex-hd-video-downloader-secret-key-2026";

/**
 * Creates a signed URL-safe token for /api/download so clients can stream
 * upstream CDN media with proper headers & filenames without exposing an open proxy.
 */
export function createDownloadUrl(params: {
  url: string;
  filename: string;
  ext: string;
  headers?: Record<string, string>;
}): string {
  const payload: DownloadTokenPayload = {
    url: params.url,
    filename: sanitizeFilename(params.filename),
    ext: params.ext,
    headers: params.headers,
    exp: Date.now() + 1000 * 60 * 60 * 4, // 4 hours validity
  };

  const dataB64 = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(dataB64)
    .digest("base64url");

  return `/api/download?token=${dataB64}.${sig}`;
}

/**
 * Verifies and decodes a download token from /api/download?token=...
 */
export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [dataB64, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(dataB64)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(
      Buffer.from(dataB64, "base64url").toString("utf-8")
    ) as DownloadTokenPayload;

    if (Date.now() > payload.exp) return null;
    if (!payload.url || !/^https?:\/\//i.test(payload.url)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function sanitizeFilename(name: string): string {
  const clean = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90)
    .trim();
  return clean || "video-download";
}

