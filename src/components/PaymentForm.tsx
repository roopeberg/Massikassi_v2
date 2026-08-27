"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
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

const FIELD =
  "h-12 w-full rounded-2xl border border-line bg-surface-3 px-4 text-[15px] text-ink placeholder:text-ink-muted";
const LABEL = "block text-[13px] font-medium text-ink-muted";

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
    return `inline-flex h-11 cursor-pointer items-center gap-2 rounded-full py-0 pr-4 pl-2 text-[14.5px] transition-colors select-none ${
      checked ? "bg-accent font-semibold text-on-accent" : "bg-surface-3 text-ink-soft"
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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[22px] border border-line bg-surface p-6">
      <h3 className="font-display text-xl font-semibold">{initial ? "Muokkaa maksua" : "Uusi maksu"}</h3>

      {error && (
        <p className="rounded-2xl bg-negative-wash px-4 py-3 text-sm font-medium text-negative">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="space-y-1.5">
          <label className={LABEL} htmlFor="payment-description">
            Kuvaus
          </label>
          <input
            id="payment-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Esim. Ruokakauppa"
            className={FIELD}
          />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL} htmlFor="payment-amount">
            Summa (€)
          </label>
          <input
            id="payment-amount"
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className={`${FIELD} font-display text-lg font-bold tabular-nums`}
          />
        </div>
      </div>

      <fieldset>
        <legend className={LABEL}>Kuka maksoi</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {users.map((u) => (
            <label key={u.id} className={chipClass(payerIds.has(u.id))}>
              <input
                type="checkbox"
                className="sr-only"
                checked={payerIds.has(u.id)}
                onChange={() => toggle(payerIds, setPayerIds, u.id)}
              />
              <Avatar name={u.name} size={28} />
              {u.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={`${LABEL} flex items-center gap-3`}>
          Kenen kesken jaetaan
          <button
            type="button"
            className="font-semibold text-accent-ink underline underline-offset-2"
            onClick={() => setSharerIds(sharerIds.size === users.length ? new Set() : new Set(users.map((u) => u.id)))}
          >
            {sharerIds.size === users.length ? "Tyhjennä" : "Valitse kaikki"}
          </button>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {users.map((u) => (
            <label key={u.id} className={chipClass(sharerIds.has(u.id))}>
              <input
                type="checkbox"
                className="sr-only"
                checked={sharerIds.has(u.id)}
                onChange={() => toggle(sharerIds, setSharerIds, u.id)}
              />
              <Avatar name={u.name} size={28} />
              {u.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <span className={LABEL}>
          GIF (valinnainen, max {MAX_GIF_MB}MB, {MAX_GIF_DIMENSION}×{MAX_GIF_DIMENSION}px)
        </span>
        {initial?.pictureFilename && !gifRemoved && !gif && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded GIF, not a static asset */}
            <img src={`/api/uploads/${initial.pictureFilename}`} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <button type="button" onClick={() => setGifRemoved(true)} className="text-sm font-medium text-negative underline">
              Poista GIF
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/gif"
          onChange={handleGifChange}
          className="block w-full text-sm text-ink-muted file:mr-3 file:h-11 file:rounded-full file:border-0 file:bg-surface-3 file:px-4 file:text-sm file:font-semibold file:text-ink"
        />
        {gif && (
          <p className="text-xs text-ink-muted">
            {gif.name} ({(gif.size / 1024).toFixed(0)} KB)
          </p>
        )}
        {gifError && <p className="text-xs text-negative">{gifError}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-full bg-btn-bg px-6 text-[15px] font-bold text-btn-fg disabled:opacity-50"
        >
          Tallenna
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-full border border-line px-6 text-[15px] font-medium text-ink-soft"
        >
          Peruuta
        </button>
      </div>
    </form>
  );
}
