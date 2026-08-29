import type { Metadata } from "next";
import Link from "next/link";
import { resolveRecoveryToken } from "@/lib/recovery-repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Palautuslinkki — massikassi",
  robots: { index: false, follow: false },
};

// Not rate-limited: the token is 256 random bits, so guessing it isn't a
// remotely practical attack regardless of request rate — unlike the
// email-address-triggered endpoints elsewhere in this feature, which are.
export default async function RecoveryTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const events = await resolveRecoveryToken(token);

  return (
    <main className="flex-1 bg-canvas font-sans text-ink">
      <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
        <Link href="/" className="mb-10 flex w-fit items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-accent">
            <span className="font-display text-sm font-extrabold text-on-accent">m</span>
          </div>
          <span className="font-display text-base font-semibold tracking-tight">massikassi</span>
        </Link>

        {events === null ? (
          <div className="rounded-[22px] bg-surface p-6">
            <h1 className="font-display text-xl font-semibold">Linkki ei kelpaa</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Tämä palautuslinkki on jo käytetty tai vanhentunut. Linkki toimii vain kerran ja 45 minuuttia.
            </p>
            <Link href="/recovery" className="mt-4 inline-block text-sm text-accent-ink underline">
              Pyydä uusi linkki
            </Link>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[22px] bg-surface p-6">
            <h1 className="font-display text-xl font-semibold">Ei tapahtumia</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Tähän osoitteeseen liitetyt tapahtumat eivät enää löydy — ne on todennäköisesti poistettu.
            </p>
          </div>
        ) : (
          <div className="rounded-[22px] bg-surface p-6">
            <h1 className="font-display text-xl font-semibold">Tapahtumasi</h1>
            <ul className="mt-4 flex flex-col gap-2">
              {events.map((event) => (
                <li key={event.hash}>
                  <Link
                    href={`/event/${event.hash}`}
                    className="block rounded-2xl bg-surface-3 px-4 py-3 text-sm font-medium hover:opacity-80"
                  >
                    {event.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
