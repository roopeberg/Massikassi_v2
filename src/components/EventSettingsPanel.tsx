"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RetentionSelect } from "./RetentionSelect";

function formatRetention(expiresAt: Date | null) {
  if (!expiresAt) return "Tapahtuma säilyy ikuisesti.";
  return `Tapahtuma säilyy ${new Date(expiresAt).toLocaleDateString("fi-FI")} asti.`;
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
  const [retentionChoice, setRetentionChoice] = useState(expiresAt ? "3" : "forever");
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
    <section className="rounded-[22px] border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-semibold">Tapahtuman elinikä</h2>
      <p className="mt-3 text-sm text-ink-muted">{formatRetention(expiresAt)}</p>

      {!editingRetention ? (
        <button
          type="button"
          onClick={() => setEditingRetention(true)}
          className="mt-3 text-sm font-medium text-accent-ink underline underline-offset-2"
        >
          Muuta
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RetentionSelect value={retentionChoice} onChange={setRetentionChoice} />
          <button
            type="button"
            onClick={saveRetention}
            disabled={savingRetention}
            className="h-11 rounded-full bg-btn-bg px-5 text-sm font-bold text-btn-fg disabled:opacity-50"
          >
            Tallenna
          </button>
          <button
            type="button"
            onClick={() => setEditingRetention(false)}
            className="h-11 rounded-full border border-line px-5 text-sm font-medium text-ink-soft"
          >
            Peruuta
          </button>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-5">
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm font-medium text-negative underline underline-offset-2"
          >
            Poista tapahtuma kokonaan
          </button>
        ) : (
          <div className="space-y-3">
            <p className="rounded-2xl bg-negative-wash px-4 py-3 text-sm text-negative">
              Tämä poistaa tapahtuman ja kaikki sen käyttäjät ja maksut pysyvästi. Ei voi perua. Kirjoita
              tapahtuman nimi (<span className="font-bold">{eventName}</span>) vahvistaaksesi.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              aria-label="Vahvista tapahtuman nimi"
              className="h-12 w-full rounded-2xl border border-line bg-surface-3 px-4 text-sm text-ink"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={confirmText !== eventName || deleting}
                onClick={handleDelete}
                className="h-12 rounded-full bg-negative-fill px-5 text-sm font-bold text-canvas disabled:opacity-40"
              >
                {deleting ? "Poistetaan..." : "Poista pysyvästi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setConfirmText("");
                }}
                className="h-12 rounded-full border border-line px-5 text-sm font-medium text-ink-soft"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-negative">{error}</p>}
    </section>
  );
}
