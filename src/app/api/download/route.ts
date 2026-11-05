import { verifyDownloadToken } from "@/lib/url-signer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIME_MAP: Record<string, string> = {
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  webm: "video/webm",
  jpg: "image/jpeg",
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "Missing download token." },
      { status: 400 }
    );
  }

  const payload = verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired download link. Please re-extract the video." },
      { status: 403 }
    );
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "*/*",
      ...(payload.headers || {}),
    };

    const rangeHeader = req.headers.get("range");
    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    const upstreamRes = await fetch(payload.url, {
      headers: upstreamHeaders,
      redirect: "follow",
      cache: "no-store",
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        {
          error: `Upstream media CDN returned status ${upstreamRes.status}`,
        },
        { status: 502 }
      );
    }

    const contentType =
      MIME_MAP[payload.ext] ||
      upstreamRes.headers.get("content-type") ||
      "application/octet-stream";

    const fullFilename = `${payload.filename}.${payload.ext}`;
    const responseHeaders = new Headers();

    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${fullFilename}"; filename*=UTF-8''${encodeURIComponent(
        fullFilename
      )}`
    );
    responseHeaders.set("Cache-Control", "private, max-age=3600");

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Download proxy error:", err);
    return NextResponse.json(
      { error: "Failed to stream media from upstream CDN." },
      { status: 500 }
    );
  }
}
