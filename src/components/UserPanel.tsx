"use client";

import { useState } from "react";
import { avatarColors, initials } from "@/lib/avatar";
import type { EventUser } from "@/lib/types";

export function UserPanel({
  hash,
  users,
  onUserAdded,
}: {
  hash: string;
  users: EventUser[];
  onUserAdded: (user: EventUser) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${hash}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.status === 409) {
        setError("Käyttäjä on jo olemassa.");
        return;
      }
      if (!res.ok) {
        setError("Käyttäjän lisäys epäonnistui.");
        return;
      }
      const user = await res.json();
      onUserAdded(user);
      setName("");
    } catch {
      setError("Verkkovirhe.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[22px] bg-[#1a1e2a] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-bricolage)] text-lg font-semibold sm:text-xl">Osallistujat</h2>
        <span className="text-[13px] text-[#8a8f9d]">{users.length}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {users.map((u, i) => {
          const { bg, text } = avatarColors(i);
          return (
            <div key={u.id} className="flex h-11 items-center gap-2 rounded-full bg-[#242a38] py-0 pr-4 pl-1.5">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: bg, color: text }}
              >
                {initials(u.name)}
              </div>
              <span className="text-sm">{u.name}</span>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Uusi nimi"
          required
          className="h-12 min-w-0 flex-1 rounded-full bg-[#242a38] px-4 text-sm text-[#f4f2ee] outline-none placeholder:text-[#6b7080] focus:ring-2 focus:ring-[#f5b544]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-12 shrink-0 rounded-full bg-[#f4f2ee] px-5 text-sm font-bold text-[#12141c] hover:bg-white disabled:opacity-50"
        >
          Lisää
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-[#ff9d84]">{error}</p>}
    </div>
  );
}
