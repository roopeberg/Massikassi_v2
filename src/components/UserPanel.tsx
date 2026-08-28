"use client";

import { useState } from "react";
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
    <div className="rounded-2xl bg-[#1a1e2a] p-4">
      <h2 className="font-[family-name:var(--font-bricolage)] text-sm font-semibold">Käyttäjät</h2>
      <ul className="mt-2 space-y-1 text-sm text-[#f4f2ee]">
        {users.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Uusi nimi"
          required
          className="min-w-0 flex-1 rounded-xl bg-[#efeae0] px-2 py-1.5 text-sm text-[#12141c] outline-none focus:ring-2 focus:ring-[#f5b544]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#f5b544] px-3 py-1.5 text-sm font-bold text-[#12141c] hover:bg-[#ffc95f] disabled:opacity-50"
        >
          Lisää
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-[#ff9d84]">{error}</p>}
    </div>
  );
}
