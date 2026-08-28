"use client";

import { useState } from "react";

export function RecoveryRequestForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Always the same message on submit, match or not — the backend never
  // reveals which via response shape or content, so neither does this form.
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // A network error here still shows the same generic confirmation —
      // there's nothing more specific to tell the user that wouldn't also
      // risk implying something about whether the address matched.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[28px] bg-[#fbf7f0] p-8 text-[#12141c] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85)]">
        <div className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold tracking-tight">
          Tarkista sähköpostisi
        </div>
        <p className="mt-3 text-sm text-[#4b5060]">
          Jos osoitteeseen liittyviä tapahtumia löytyi, lähetimme palautuslinkin sähköpostiin. Linkki toimii
          kerran ja vanhenee 45 minuutissa.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] bg-[#fbf7f0] p-8 text-[#12141c] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.85)]"
    >
      <div className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold tracking-tight">
        Palauta tapahtumasi
      </div>
      <p className="mt-2 text-sm text-[#6b7080]">
        Jos olet liittänyt sähköpostiosoitteen johonkin tapahtumaan palautusta varten, saat sen kautta
        linkin takaisin.
      </p>

      <div className="mt-6 flex flex-col gap-1.5">
        <label htmlFor="recovery-email" className="text-xs font-medium text-[#4b5060]">
          Sähköpostiosoite
        </label>
        <input
          id="recovery-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="oma@osoite.fi"
          className="h-[52px] w-full rounded-2xl bg-[#efeae0] px-4 text-[15px] text-[#12141c] placeholder:text-[#9aa1b0] focus:outline-2 focus:outline-[#f5b544]"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[#12141c] text-base font-bold text-[#fbf7f0] hover:bg-[#1e2230] disabled:opacity-50"
      >
        {submitting ? "Lähetetään..." : "Lähetä palautuslinkki"}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-[#8a8f9d]">
        Emme kerro tässä, löytyikö osoite vai ei — vain sähköposti paljastaa sen, jos siihen on jotain
        liitetty.
      </p>
    </form>
  );
}
