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
    const errorMessage = await onSubmit({ description: description.trim(), amount: parsedAmount, dues });
    setSubmitting(false);
    if (errorMessage) setError(errorMessage);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">{initial ? "Muokkaa maksua" : "Uusi maksu"}</h3>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-slate-600">Kuvaus</label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Esim. Ruokakauppa"
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Summa</label>
        <input
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-32 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-slate-600">Kuka maksoi</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={payerIds.has(u.id)}
                onChange={() => toggle(payerIds, setPayerIds, u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 text-xs font-medium text-slate-600">
          Kenen kesken jaetaan
          <button
            type="button"
            className="text-slate-500 underline"
            onClick={() => setSharerIds(sharerIds.size === users.length ? new Set() : new Set(users.map((u) => u.id)))}
          >
            {sharerIds.size === users.length ? "Tyhjennä" : "Valitse kaikki"}
          </button>
        </legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {users.map((u) => (
            <label key={u.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
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
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Tallenna
        </button>
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Peruuta
        </button>
      </div>
    </form>
  );
}
