import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventClient } from "@/components/EventClient";
import { NotFoundError, getEventInfo } from "@/lib/repo";

// Always dynamic: this is per-event live data, never a static page.
export const dynamic = "force-dynamic";

// The hash is the only access control this page has — never let it end up
// indexed or cached by a crawler. (X-Robots-Tag on this path is also set in
// next.config.ts, which covers the JSON API responses too.)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
