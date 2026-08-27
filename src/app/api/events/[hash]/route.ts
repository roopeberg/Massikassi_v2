import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { getEventInfo, updateEventName } from "@/lib/repo";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import { updateEventSchema } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const info = await getEventInfo(hash);
    return NextResponse.json(info);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const limit = rateLimit(`events:update:${clientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash } = await params;
    const body = updateEventSchema.parse(await request.json());
    const updated = await updateEventName(hash, body.name);
    return NextResponse.json({ name: updated.name });
  } catch (error) {
    return handleApiError(error);
  }
}
