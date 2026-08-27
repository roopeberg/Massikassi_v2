"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RetentionSelect } from "./RetentionSelect";

/*
 * This card is deliberately the same warm "paper" in both themes, so its
 * insides stay literal cream-and-ink rather than going through the canvas
 * tokens. Only the card's own edge and shadow are theme-aware — see
 * --card-shadow in globals.css.
 */
const fieldClass =
  "h-[52px] w-full rounded-2xl bg-[#efeae0] px-4 text-[15px] text-[#12141c] placeholder:text-[#6f7482] focus:outline-2 focus:outline-[#8a5210]";

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
      /* color-scheme:light so the native controls inside this card (inputs,
         the select's dropdown) render light too — the card is cream even when
         the page around it is dark. */
      className="rounded-[28px] border border-line bg-[#fbf7f0] p-8 text-[#12141c] shadow-[var(--card-shadow)] [color-scheme:light]"
    >
      <div className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold tracking-tight">
        Aloita tästä
      </div>
      <p className="mt-2 text-sm text-[#6b7080]">Tapahtuma syntyy heti — linkin voit jakaa vaikka WhatsAppissa.</p>

      {error && <p className="mt-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="event-name" className="text-xs font-medium text-[#4b5060]">
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
          <label htmlFor="user-name" className="text-xs font-medium text-[#4b5060]">
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

      <div className="mt-4 text-sm text-[#6b7080]">
        {!editingRetention ? (
          <p>
            {retentionChoice === "forever" ? "Tapahtuma säilytetään ikuisesti." : `Tapahtuma säilytetään ${retentionChoice} kk.`}{" "}
            <button type="button" onClick={() => setEditingRetention(true)} className="underline">
              Muuta
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <RetentionSelect
              value={retentionChoice}
              onChange={setRetentionChoice}
              className="h-11 rounded-full border border-[#d9d3c6] bg-[#efeae0] px-4 text-sm text-[#12141c]"
            />
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
        className="mt-6 flex h-[58px] w-full items-center justify-center gap-2 rounded-full bg-[#12141c] text-base font-bold text-[#fbf7f0] hover:bg-[#1e2230] disabled:opacity-50"
      >
        {submitting ? "Luodaan..." : "Luo tapahtuma"}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-[#8a8f9d]">
        Ei rekisteröitymistä. Tapahtumaan pääsee vain sen linkin kautta — säilytä se.
      </p>
    </form>
  );
}
