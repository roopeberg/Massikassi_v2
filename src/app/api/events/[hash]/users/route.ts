import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { addUserToEvent } from "@/lib/repo";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import { addUserSchema } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const limit = rateLimit(`users:add:${clientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash } = await params;
    const body = addUserSchema.parse(await request.json());
    const user = await addUserToEvent(hash, body.name);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
