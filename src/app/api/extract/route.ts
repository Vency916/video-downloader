import { extractMedia } from "@/lib/extractors";
import { ExtractResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;

    if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
      return NextResponse.json<ExtractResponse>(
        {
          success: false,
          error: "Please paste a valid TikTok or social media video link.",
        },
        { status: 400 }
      );
    }

    const mediaResult = await extractMedia(rawUrl);

    return NextResponse.json<ExtractResponse>({
      success: true,
      data: mediaResult,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while extracting the video.";

    return NextResponse.json<ExtractResponse>(
      {
        success: false,
        error: message,
      },
      { status: 422 }
    );
  }
}
