import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-errors";
import { createEvent } from "@/lib/repo";
import { createEventSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = createEventSchema.parse(await request.json());
    // Honeypot: bots that fill every field will trip this and get a
    // silent no-op success instead of a hint that they were caught.
    if (body.business) {
      return NextResponse.json({ hash: null }, { status: 200 });
    }

    const event = await createEvent(body);
    return NextResponse.json({ hash: event.hash }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
