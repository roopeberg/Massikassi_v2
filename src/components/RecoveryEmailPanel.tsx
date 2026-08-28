"use client";

import { useState } from "react";

/**
 * Lets anyone with the event link attach a recovery email — deliberately no
 * different from every other capability on this page (there's no
 * per-participant auth to gate it behind). The address itself is never
 * shown back, even to this same browser: the backend only ever stores an
 * HMAC of it (lib/recovery-email.ts) and this component only ever learns
 * "verified: yes/no", never which address.
 */
export function RecoveryEmailPanel({
  hash,
  initialVerified,
}: {
  hash: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "already-verified" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/events/${hash}/recovery-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      if (data.status === "already-verified") {
        setStatus("already-verified");
        setVerified(true);
      } else {
        setStatus("sent");
      }
      setEmail("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[22px] bg-[#1a1e2a] p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-bricolage)] text-sm font-semibold">Palautus sähköpostilla</h2>

      {verified && status !== "sent" && (
        <p className="mt-2 text-sm text-[#4fd39a]">Tälle tapahtumalle on liitetty palautussähköposti.</p>
      )}

      {status === "sent" && (
        <p className="mt-2 text-sm text-[#9aa1b0]">
          Vahvistuslinkki lähetetty — osoite liitetään vasta kun linkkiä klikataan.
        </p>
      )}
      {status === "already-verified" && (
        <p className="mt-2 text-sm text-[#4fd39a]">Tämä osoite on jo vahvistettu tälle tapahtumalle.</p>
      )}
      {status === "error" && <p className="mt-2 text-sm text-[#ff9d84]">Jotain meni pieleen, yritä uudelleen.</p>}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 text-sm text-[#f5b544] underline"
        >
          {verified ? "+ lisää toinen osoite" : "Liitä sähköposti"}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="oma@osoite.fi"
            className="rounded-xl bg-[#efeae0] px-2 py-1.5 text-sm text-[#12141c] outline-none focus:ring-2 focus:ring-[#f5b544]"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#f5b544] px-3 py-1.5 text-sm font-bold text-[#12141c] hover:bg-[#ffc95f] disabled:opacity-50"
            >
              Lähetä vahvistuslinkki
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-[#9aa1b0] underline">
              Peruuta
            </button>
          </div>
        </form>
      )}

      <p className="mt-3 text-xs text-[#6b7080]">
        Osoitetta ei tallenneta selväkielisenä, eikä sitä näytetä täällä jälkikäteen.
      </p>
    </div>
  );
}
