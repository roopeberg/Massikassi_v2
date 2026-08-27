import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { InvalidGifError, saveGif } from "@/lib/gif";
import { clearPaymentPicture, setPaymentPicture } from "@/lib/repo";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ hash: string; id: string }> }) {
  const limit = rateLimit(`payments:picture:${clientIp(request)}`, 20, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash, id } = await params;

    const form = await request.formData();
    const file = form.get("gif");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let filename: string;
    try {
      filename = await saveGif(buffer);
    } catch (error) {
      if (error instanceof InvalidGifError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    await setPaymentPicture(hash, Number(id), filename);
    return NextResponse.json({ pictureFilename: filename }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ hash: string; id: string }> }) {
  const limit = rateLimit(`payments:picture:${clientIp(request)}`, 20, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash, id } = await params;
    await clearPaymentPicture(hash, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
