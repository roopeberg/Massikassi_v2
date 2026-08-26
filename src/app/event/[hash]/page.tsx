import { notFound } from "next/navigation";
import { EventClient } from "@/components/EventClient";
import { NotFoundError, getEventInfo } from "@/lib/repo";

// Always dynamic: this is per-event live data, never a static page.
export const dynamic = "force-dynamic";

async function loadEvent(hash: string) {
  try {
    return await getEventInfo(hash);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export default async function EventPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const event = await loadEvent(hash);
  return <EventClient hash={hash} initialEvent={event} />;
}
