"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RetentionSelect } from "./RetentionSelect";

const fieldClass =
  "h-[52px] w-full rounded-2xl bg-[var(--paper-input-bg)] px-4 text-[15px] text-[var(--paper-fg)] placeholder:text-[var(--paper-subtle)] focus:outline-2 focus:outline-accent";

export function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [editingRetention, setEditingRetention] = useState(false);
  const [retentionChoice, setRetentionChoice] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const businessRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          userName,
          retentionMonths: retentionChoice === "forever" ? null : Number(retentionChoice),
          business: businessRef.current?.value ?? "",
        }),
      });
      if (!res.ok) {
        setError("Tarkista tiedot ja yritä uudelleen.");
        return;
      }
      const data = await res.json();
      if (!data.hash) {
        setError("Tapahtuman luonti epäonnistui.");
        return;
      }
      router.push(`/event/${data.hash}`);
    } catch {
      setError("Verkkovirhe. Yritä uudelleen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id="luo-tapahtuma"
      onSubmit={handleSubmit}
      className="rounded-[28px] bg-[var(--paper-bg)] p-8 text-[var(--paper-fg)] shadow-[var(--card-shadow)]"
    >
      <div className="font-display text-2xl font-semibold tracking-tight">Aloita tästä</div>
      <p className="mt-2 text-sm text-[var(--paper-muted)]">
        Tapahtuma syntyy heti — linkin voit jakaa vaikka WhatsAppissa.
      </p>

      {error && <p className="mt-4 rounded-xl bg-negative-wash px-3 py-2 text-sm text-negative">{error}</p>}

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-name" className="text-xs font-medium text-[var(--paper-muted)]">
            Tapahtuman nimi
          </label>
          <input
            id="event-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Esim. Mökkiviikonloppu"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-name" className="text-xs font-medium text-[var(--paper-muted)]">
            Oma nimesi
          </label>
          <input
            id="user-name"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Etunimi tai nimimerkki"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-[var(--paper-muted)]">
        {!editingRetention ? (
          <p>
            {retentionChoice === "forever" ? "Tapahtuma säilytetään ikuisesti." : `Tapahtuma säilytetään ${retentionChoice} kk.`}{" "}
            <button type="button" onClick={() => setEditingRetention(true)} className="underline">
              Muuta
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <RetentionSelect value={retentionChoice} onChange={setRetentionChoice} />
            <button type="button" onClick={() => setEditingRetention(false)} className="underline">
              Valmis
            </button>
          </div>
        )}
      </div>

      {/* Honeypot: hidden from real users via CSS, bots tend to fill every field they see in the DOM. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="business">Company</label>
        <input id="business" name="business" ref={businessRef} tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[var(--paper-fg)] text-base font-bold text-[var(--paper-bg)] hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Luodaan..." : "Luo tapahtuma"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--paper-subtle)]">
        Ei rekisteröitymistä. Tapahtumaan pääsee vain sen linkin kautta — säilytä se.
      </p>
    </form>
  );
}
