"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
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
    <section className="rounded-[22px] border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Osallistujat</h2>
        <span className="text-[13px] text-ink-muted">{users.length}</span>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex h-11 items-center gap-2 rounded-full bg-surface-3 py-0 pr-4 pl-2 text-[14.5px]"
          >
            <Avatar name={u.name} size={28} />
            {u.name}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Uusi nimi"
          required
          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface-3 px-4.5 text-[14.5px] text-ink placeholder:text-ink-muted"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-12 shrink-0 rounded-full bg-btn-alt-bg px-5.5 text-[14.5px] font-bold text-btn-alt-fg disabled:opacity-50"
        >
          Lisää
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-negative">{error}</p>}
    </section>
  );
}
