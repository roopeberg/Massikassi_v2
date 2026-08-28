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
    <main className="flex-1 bg-[#12141c] font-[family-name:var(--font-space-grotesk)] text-[#f4f2ee]">
      <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
        <Link href="/" className="mb-10 flex w-fit items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#f5b544]">
            <span className="font-[family-name:var(--font-bricolage)] text-sm font-extrabold text-[#12141c]">m</span>
          </div>
          <span className="font-[family-name:var(--font-bricolage)] text-base font-semibold tracking-tight">
            massikassi
          </span>
        </Link>

        {result === null ? (
          <div className="rounded-[22px] bg-[#1a1e2a] p-6">
            <h1 className="font-[family-name:var(--font-bricolage)] text-xl font-semibold">
              Linkki ei kelpaa
            </h1>
            <p className="mt-2 text-sm text-[#9aa1b0]">
              Tämä vahvistuslinkki on jo käytetty tai vanhentunut. Voit liittää sähköpostin uudelleen
              tapahtuman asetuksista.
            </p>
          </div>
        ) : (
          <div className="rounded-[22px] bg-[#1a1e2a] p-6">
            <h1 className="font-[family-name:var(--font-bricolage)] text-xl font-semibold">
              Sähköposti vahvistettu
            </h1>
            <p className="mt-2 text-sm text-[#9aa1b0]">
              Osoite on nyt liitetty tapahtumaan <span className="text-[#f4f2ee]">{result.name}</span>{" "}
              palautusta varten.
            </p>
            <Link
              href={`/event/${result.hash}`}
              className="mt-4 inline-block rounded-full bg-[#f5b544] px-5 py-2.5 text-sm font-bold text-[#12141c] hover:bg-[#ffc95f]"
            >
              Takaisin tapahtumaan
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
