"use client";

import { useState } from "react";
import type { EventPayment, EventUser } from "@/lib/types";

export interface PaymentFormValues {
  description: string;
  amount: number;
  dues: { id: number; payer: boolean }[];
}

export function PaymentForm({
  users,
  initial,
  onCancel,
  onSubmit,
}: {
  users: EventUser[];
  initial?: EventPayment;
  onCancel: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<string | null>;
}) {
  const initialPayerIds = new Set(initial?.sharers.filter((s) => s.payer).map((s) => s.id) ?? []);
  const initialSharerIds = new Set(initial?.sharers.filter((s) => !s.payer).map((s) => s.id) ?? []);

  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [payerIds, setPayerIds] = useState<Set<number>>(initialPayerIds);
  const [sharerIds, setSharerIds] = useState<Set<number>>(initialSharerIds);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(set: Set<number>, setSet: (s: Set<number>) => void, id: number) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  // Chip-style selectable pill instead of a bare checkbox — a name-length
  // label is too small a tap target on a phone, this is the whole pill.
  function chipClass(checked: boolean) {
    return `inline-flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
      checked ? "border-accent bg-accent text-on-accent" : "border-line text-ink active:bg-surface-3"
    }`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (payerIds.size === 0) {
      setError("Valitse ainakin yksi maksaja.");
      return;
    }
    if (sharerIds.size === 0) {
      setError("Valitse ainakin yksi jakaja.");
      return;
    }
    const parsedAmount = Number(amount.replace(",", "."));
    if (!(parsedAmount > 0)) {
      setError("Anna summa numeroina, esim. 42.50.");
      return;
    }

    const dues = [
      ...Array.from(payerIds).map((id) => ({ id, payer: true })),
      ...Array.from(sharerIds).map((id) => ({ id, payer: false })),
    ];

    setSubmitting(true);
    const errorMessage = await onSubmit({
      description: description.trim(),
      amount: parsedAmount,
      dues,
    });
    setSubmitting(false);
    if (errorMessage) setError(errorMessage);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[20px] bg-surface p-5 sm:p-6">
      <h3 className="font-display text-sm font-semibold">{initial ? "Muokkaa maksua" : "Uusi maksu"}</h3>
      {error && <p className="rounded-xl bg-negative-wash px-3 py-2 text-sm text-negative">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-ink-soft">Kuvaus</label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Esim. Ruokakauppa"
          className="mt-1 w-full rounded-xl bg-[var(--paper-input-bg)] px-2 py-1.5 text-sm text-[var(--paper-fg)] outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft">Summa</label>
        <input
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-32 rounded-xl bg-[var(--paper-input-bg)] px-2 py-1.5 text-sm text-[var(--paper-fg)] outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-ink-soft">Kuka maksoi</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {users.map((u) => (
            <label key={u.id} className={chipClass(payerIds.has(u.id))}>
              <input
                type="checkbox"
                className="sr-only"
                checked={payerIds.has(u.id)}
                onChange={() => toggle(payerIds, setPayerIds, u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          Kenen kesken jaetaan
          <button
            type="button"
            className="text-accent-ink underline"
            onClick={() => setSharerIds(sharerIds.size === users.length ? new Set() : new Set(users.map((u) => u.id)))}
          >
            {sharerIds.size === users.length ? "Tyhjennä" : "Valitse kaikki"}
          </button>
        </legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {users.map((u) => (
            <label key={u.id} className={chipClass(sharerIds.has(u.id))}>
              <input
                type="checkbox"
                className="sr-only"
                checked={sharerIds.has(u.id)}
                onChange={() => toggle(sharerIds, setSharerIds, u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          Tallenna
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-ink-soft hover:bg-surface-3">
          Peruuta
        </button>
      </div>
    </form>
  );
}
