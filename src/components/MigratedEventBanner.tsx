"use client";

import { useState } from "react";
import { RetentionSelect } from "./RetentionSelect";

/**
 * Shown on an event imported by scripts/migrate-legacy-data.ts, for as long
 * as nobody has actively confirmed/changed the 12-month retention it got
 * auto-set to on import (events.migratedAt — cleared server-side the moment
 * someone does, in repo.updateEvent). "Piilota" only hides it for this
 * visit; it comes back next time until the retention actually changes.
 */
export function MigratedEventBanner({
  hash,
  expiresAt,
  onChanged,
}: {
  hash: string;
  expiresAt: Date | null;
  onChanged: (expiresAt: Date | null) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [retentionChoice, setRetentionChoice] = useState("12");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const retentionMonths = retentionChoice === "forever" ? null : Number(retentionChoice);
      const res = await fetch(`/api/events/${hash}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionMonths }),
      });
      if (!res.ok) {
        setError("Muutos epäonnistui.");
        return;
      }
      const data = await res.json();
      onChanged(data.expiresAt ? new Date(data.expiresAt) : null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[22px] border border-[#f5b544]/30 bg-[#f5b544]/10 p-4 text-sm text-[#f4f2ee]">
      <p>
        Tämä tapahtuma on tuotu vanhasta massikassista. Nykyään tapahtumilla on säilytysaika-asetus, ja
        tälle se asetettiin automaattisesti{" "}
        {expiresAt ? `muotoon ${new Date(expiresAt).toLocaleDateString("fi-FI")} (12 kk)` : "—"}. Voit
        muuttaa tätä halutessasi 1-12 kk:een tai ikuiseksi:
      </p>
      {error && <p className="mt-2 text-[#ff9d84]">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RetentionSelect value={retentionChoice} onChange={setRetentionChoice} />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#f5b544] px-3 py-1.5 text-sm font-bold text-[#12141c] hover:bg-[#ffc95f] disabled:opacity-50"
        >
          Tallenna
        </button>
        <button type="button" onClick={() => setDismissed(true)} className="text-sm text-[#f5b544] underline">
          Piilota
        </button>
      </div>
    </div>
  );
}
