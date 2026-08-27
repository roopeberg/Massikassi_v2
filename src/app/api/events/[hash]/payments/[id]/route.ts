import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { deletePayment, editPayment } from "@/lib/repo";
import { clientIp, rateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";
import { paymentSchema } from "@/lib/validation";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ hash: string; id: string }> }) {
  const limit = rateLimit(`payments:edit:${clientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash, id } = await params;
    const body = paymentSchema.parse(await request.json());
    const payment = await editPayment(hash, Number(id), body, body.created);
    return NextResponse.json(payment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ hash: string; id: string }> }) {
  const limit = rateLimit(`payments:delete:${clientIp(request)}`, 30, 60 * 1000);
  if (!limit.ok) return tooManyRequestsResponse(limit.retryAfterSeconds);

  try {
    const { hash, id } = await params;
    await deletePayment(hash, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
