import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { deleteEvent, getEventInfo, updateEvent } from "@/lib/repo";
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
    const updated = await updateEvent(hash, body);
    return NextResponse.json({ name: updated.name, expiresAt: updated.expiresAt });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  // Deliberately stricter than the other mutation limits (5/10min, same as
  // event creation) — deleting an entire event is irreversible.
  const limit = rateLimit(`events:delete:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash } = await params;
    await deleteEvent(hash);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
