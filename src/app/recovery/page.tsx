import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryRequestForm } from "@/components/RecoveryRequestForm";

export const metadata: Metadata = {
  title: "Palauta tapahtuma — massikassi",
  robots: { index: false, follow: false },
};

export default function RecoveryPage() {
  return (
    <main className="flex-1 bg-canvas font-sans text-ink">
      <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
        <Link href="/" className="mb-10 flex w-fit items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-accent">
            <span className="font-display text-sm font-extrabold text-on-accent">m</span>
          </div>
          <span className="font-display text-base font-semibold tracking-tight">massikassi</span>
        </Link>
        <RecoveryRequestForm />
      </div>
    </main>
  );
}
