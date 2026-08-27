import { NextRequest, NextResponse } from "next/server";
import { isValidGifFilename, readGif } from "@/lib/gif";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const limit = rateLimit(`uploads:read:${clientIp(request)}`, 200, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const { filename } = await params;
  // Filenames are always our own randomUUID() + ".gif" — reject anything
  // else before it ever reaches the filesystem (no path traversal surface).
  if (!isValidGifFilename(filename)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const data = await readGif(filename);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/gif",
        // Filenames are random and never reused, so a cached copy never goes stale.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
