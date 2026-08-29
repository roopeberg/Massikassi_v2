import type { Metadata } from "next";
import Link from "next/link";
import { confirmRecoveryEmail } from "@/lib/recovery-repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vahvista sähköposti — massikassi",
  robots: { index: false, follow: false },
};

// Not rate-limited, same reasoning as recovery/[token]: 256 random bits.
export default async function ConfirmTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await confirmRecoveryEmail(token);

  return (
    <main className="flex-1 bg-canvas font-sans text-ink">
      <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
        <Link href="/" className="mb-10 flex w-fit items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-accent">
            <span className="font-display text-sm font-extrabold text-on-accent">m</span>
          </div>
          <span className="font-display text-base font-semibold tracking-tight">massikassi</span>
        </Link>

        {result === null ? (
          <div className="rounded-[22px] bg-surface p-6">
            <h1 className="font-display text-xl font-semibold">Linkki ei kelpaa</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Tämä vahvistuslinkki on jo käytetty tai vanhentunut. Voit liittää sähköpostin uudelleen
              tapahtuman asetuksista.
            </p>
          </div>
        ) : (
          <div className="rounded-[22px] bg-surface p-6">
            <h1 className="font-display text-xl font-semibold">Sähköposti vahvistettu</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Osoite on nyt liitetty tapahtumaan <span className="text-ink">{result.name}</span> palautusta
              varten.
            </p>
            <Link
              href={`/event/${result.hash}`}
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-on-accent hover:bg-accent-hover"
            >
              Takaisin tapahtumaan
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
