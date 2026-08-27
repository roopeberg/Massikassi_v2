"use client";

import { useState } from "react";
import { MAX_GIF_BYTES, MAX_GIF_DIMENSION } from "@/lib/gif-constraints";
import type { EventPayment, EventUser } from "@/lib/types";

export interface PaymentFormValues {
  description: string;
  amount: number;
  dues: { id: number; payer: boolean }[];
  /** undefined = leave as-is, null = remove, File = replace/attach. */
  gif?: File | null;
}

const MAX_GIF_MB = MAX_GIF_BYTES / 1024 / 1024;

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
  const [gif, setGif] = useState<File | null>(null);
  const [gifRemoved, setGifRemoved] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);

  function handleGifChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setGifError(null);
    setGif(null);
    if (!file) return;

    if (file.type !== "image/gif") {
      setGifError("Vain GIF-tiedostot käyvät.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_GIF_BYTES) {
      setGifError(`GIF on liian iso (max ${MAX_GIF_MB}MB).`);
      e.target.value = "";
      return;
    }

    // Dimension check needs decoding the image — the server re-checks this
    // authoritatively regardless, this is just faster feedback.
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > MAX_GIF_DIMENSION || img.height > MAX_GIF_DIMENSION) {
        setGifError(`GIF on liian suurikokoinen (max ${MAX_GIF_DIMENSION}×${MAX_GIF_DIMENSION}px).`);
        e.target.value = "";
        return;
      }
      setGif(file);
      setGifRemoved(false);
    };
    img.src = url;
  }

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
      checked ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 active:bg-slate-100"
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
      gif: gif ?? (gifRemoved ? null : undefined),
    });
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

      <div>
        <label className="block text-xs font-medium text-slate-600">
          GIF (valinnainen, max {MAX_GIF_MB}MB, {MAX_GIF_DIMENSION}×{MAX_GIF_DIMENSION}px)
        </label>
        {initial?.pictureFilename && !gifRemoved && !gif && (
          <div className="mt-1 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded GIF, not a static asset */}
            <img src={`/api/uploads/${initial.pictureFilename}`} alt="" className="h-16 w-16 rounded object-cover" />
            <button type="button" onClick={() => setGifRemoved(true)} className="text-sm text-red-600 underline">
              Poista GIF
            </button>
          </div>
        )}
        <input type="file" accept="image/gif" onChange={handleGifChange} className="mt-1 block text-sm" />
        {gif && <p className="mt-1 text-xs text-slate-500">{gif.name} ({(gif.size / 1024).toFixed(0)} KB)</p>}
        {gifError && <p className="mt-1 text-xs text-red-700">{gifError}</p>}
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-slate-600">Kuka maksoi</legend>
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
