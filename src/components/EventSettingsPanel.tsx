"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDay } from "@/lib/format";
import { RetentionSelect } from "./RetentionSelect";

function formatRetention(expiresAt: Date | null) {
  if (!expiresAt) return "Tapahtuma säilyy ikuisesti.";
  return `Tapahtuma säilyy ${formatDay(expiresAt)} asti.`;
}

// Rough months-remaining, clamped to what RetentionSelect actually offers
// (1-12). Only used to pre-fill the edit dropdown with something close to
// the event's real retention instead of always defaulting to "3" — it's an
// estimate (doesn't know the originally-chosen length, just what's left),
// but "Tallenna" without touching the dropdown should roughly preserve the
// current expiry, not silently shorten a longer one down to 3 months.
function monthsRemaining(expiresAt: Date): string {
  const msPerMonth = 30 * 24 * 60 * 60 * 1000;
  const months = Math.round((expiresAt.getTime() - Date.now()) / msPerMonth);
  return String(Math.min(12, Math.max(1, months)));
}

export function EventSettingsPanel({
  hash,
  eventName,
  expiresAt,
  onExpiryChange,
}: {
  hash: string;
  eventName: string;
  expiresAt: Date | null;
  onExpiryChange: (expiresAt: Date | null) => void;
}) {
  const router = useRouter();
  const [editingRetention, setEditingRetention] = useState(false);
  const [retentionChoice, setRetentionChoice] = useState(expiresAt ? monthsRemaining(expiresAt) : "forever");
  const [savingRetention, setSavingRetention] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveRetention() {
    setSavingRetention(true);
    setError(null);
    try {
      const retentionMonths = retentionChoice === "forever" ? null : Number(retentionChoice);
      const res = await fetch(`/api/events/${hash}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retentionMonths }),
      });
      if (!res.ok) {
        setError("Voimassaolon muutos epäonnistui.");
        return;
      }
      const data = await res.json();
      onExpiryChange(data.expiresAt ? new Date(data.expiresAt) : null);
      setEditingRetention(false);
    } finally {
      setSavingRetention(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${hash}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Poisto epäonnistui.");
        setDeleting(false);
        return;
      }
      router.push("/");
    } catch {
      setError("Verkkovirhe.");
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-[22px] bg-surface p-5 sm:p-6">
      <h2 className="font-display text-sm font-semibold">Tapahtuman elinikä</h2>
      <p className="mt-2 text-sm text-ink-soft">{formatRetention(expiresAt)}</p>

      {!editingRetention ? (
        <button type="button" onClick={() => setEditingRetention(true)} className="mt-2 text-sm text-accent-ink underline">
          Muuta
        </button>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <RetentionSelect value={retentionChoice} onChange={setRetentionChoice} />
          <button
            type="button"
            onClick={saveRetention}
            disabled={savingRetention}
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-on-accent hover:bg-accent-hover disabled:opacity-50"
          >
            Tallenna
          </button>
          <button type="button" onClick={() => setEditingRetention(false)} className="text-sm text-ink-soft underline">
            Peruuta
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-4">
        {!confirmingDelete ? (
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-sm text-negative underline">
            Poista tapahtuma kokonaan
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-negative">
              Tämä poistaa tapahtuman ja kaikki sen käyttäjät ja maksut pysyvästi. Ei voi perua. Kirjoita
              tapahtuman nimi (<span className="font-medium">{eventName}</span>) vahvistaaksesi.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl bg-[var(--paper-input-bg)] px-2 py-1.5 text-sm text-[var(--paper-fg)] outline-none focus:ring-2 focus:ring-negative"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={confirmText !== eventName || deleting}
                onClick={handleDelete}
                className="rounded-full bg-negative-fill px-3 py-2 text-sm font-bold text-canvas hover:opacity-90 disabled:opacity-40"
              >
                {deleting ? "Poistetaan..." : "Poista pysyvästi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setConfirmText("");
                }}
                className="rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-surface-3"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-negative">{error}</p>}
    </div>
  );
}
