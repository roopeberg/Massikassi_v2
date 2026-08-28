import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventClient } from "@/components/EventClient";
import { NotFoundError, getEventInfo } from "@/lib/repo";
import { hasVerifiedRecoveryEmail } from "@/lib/recovery-repo";

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
    const [event, recoveryEmailVerified] = await Promise.all([getEventInfo(hash), hasVerifiedRecoveryEmail(hash)]);
    return { ...event, hasVerifiedRecoveryEmail: recoveryEmailVerified };
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ hash: string }>;
  // ?kuka=Nimi — a personal link that pre-selects "Nimi" in the balance
  // summary so their own transfer surfaces first. Just a display default,
  // not authentication: anyone with the base event link can still open it
  // and pick any name themselves.
  searchParams: Promise<{ kuka?: string }>;
}) {
  const { hash } = await params;
  const { kuka } = await searchParams;
  const event = await loadEvent(hash);
  return <EventClient hash={hash} initialEvent={event} initialWho={kuka} />;
}
