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
    <div className="rounded-2xl bg-[#1a1e2a] p-4">
      <h2 className="font-[family-name:var(--font-bricolage)] text-sm font-semibold">Tapahtuman elinikä</h2>
      <p className="mt-2 text-sm text-[#b6bcc9]">{formatRetention(expiresAt)}</p>

      {!editingRetention ? (
        <button type="button" onClick={() => setEditingRetention(true)} className="mt-2 text-sm text-[#f5b544] underline">
          Muuta
        </button>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <RetentionSelect value={retentionChoice} onChange={setRetentionChoice} />
          <button
            type="button"
            onClick={saveRetention}
            disabled={savingRetention}
            className="rounded-full bg-[#f5b544] px-3 py-1.5 text-sm font-bold text-[#12141c] hover:bg-[#ffc95f] disabled:opacity-50"
          >
            Tallenna
          </button>
          <button type="button" onClick={() => setEditingRetention(false)} className="text-sm text-[#9aa1b0] underline">
            Peruuta
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-white/10 pt-4">
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-[#ff9d84] underline"
          >
            Poista tapahtuma kokonaan
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[#ff9d84]">
              Tämä poistaa tapahtuman ja kaikki sen käyttäjät ja maksut pysyvästi. Ei voi perua. Kirjoita
              tapahtuman nimi (<span className="font-medium">{eventName}</span>) vahvistaaksesi.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-xl bg-[#efeae0] px-2 py-1.5 text-sm text-[#12141c] outline-none focus:ring-2 focus:ring-[#f2653f]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={confirmText !== eventName || deleting}
                onClick={handleDelete}
                className="rounded-full bg-[#f2653f] px-3 py-2 text-sm font-bold text-[#12141c] hover:bg-[#ff7a52] disabled:opacity-40"
              >
                {deleting ? "Poistetaan..." : "Poista pysyvästi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setConfirmText("");
                }}
                className="rounded-full px-3 py-2 text-sm text-[#9aa1b0] hover:bg-white/5"
              >
                Peruuta
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-[#ff9d84]">{error}</p>}
    </div>
  );
}
