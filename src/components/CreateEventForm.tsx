"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ name, userName, email, business: businessRef.current?.value ?? "" }),
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label htmlFor="event-name" className="block text-sm font-medium text-slate-700">
          Tapahtuman nimi
        </label>
        <input
          id="event-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Esim. Mökkiviikonloppu"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="user-name" className="block text-sm font-medium text-slate-700">
          Oma nimesi
        </label>
        <input
          id="user-name"
          required
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Etunimi tai nimimerkki"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Sähköposti (valinnainen)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jotta saat linkin talteen"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      {/* Honeypot: hidden from real users via CSS, bots tend to fill every field they see in the DOM. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="business">Company</label>
        <input id="business" name="business" ref={businessRef} tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Luodaan..." : "Luo tapahtuma"}
      </button>
    </form>
  );
}
