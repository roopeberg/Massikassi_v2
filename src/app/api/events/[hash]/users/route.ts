import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { addUserToEvent } from "@/lib/repo";
import { addUserSchema } from "@/lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await params;
    const body = addUserSchema.parse(await request.json());
    const user = await addUserToEvent(hash, body.name);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
