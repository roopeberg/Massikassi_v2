import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { addPayment } from "@/lib/repo";
import { paymentSchema } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const body = paymentSchema.parse(await request.json());
    const payment = await addPayment(hash, body);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
