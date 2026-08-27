import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { addPayment } from "@/lib/repo";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import { paymentSchema } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const limit = rateLimit(`payments:add:${clientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash } = await params;
    const body = paymentSchema.parse(await request.json());
    const payment = await addPayment(hash, body);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
