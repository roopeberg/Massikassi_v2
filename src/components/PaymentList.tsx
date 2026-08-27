"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { PencilIcon, TrashIcon } from "./icons";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import type { EventPayment, EventUser } from "@/lib/types";

function formatAmount(amount: number) {
  return amount.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "16.8." — the phone artboard drops the clock time, the desktop one keeps it. */
function formatDay(date: Date) {
  return new Date(date).toLocaleDateString("fi-FI", { day: "numeric", month: "numeric" });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
}

function PaymentRow({
  payment,
  users,
  onEdit,
  onDelete,
}: {
  payment: EventPayment;
  users: EventUser[];
  onEdit: (values: PaymentFormValues) => Promise<string | null>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Phone only: the artboard keeps rows compact and shows Muokkaa/Poista on
  // the opened one. On desktop the round icon buttons are always visible, so
  // this state is ignored there.
  const [open, setOpen] = useState(false);

  if (editing) {
    return (
      <li>
        <PaymentForm
          users={users}
          initial={payment}
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            const error = await onEdit(values);
            if (!error) setEditing(false);
            return error;
          }}
        />
      </li>
    );
  }

  const payers = payment.sharers.filter((s) => s.payer);
  const sharers = payment.sharers.filter((s) => !s.payer);
  // "koko porukka" when everyone shares — shorter than listing every name, and
  // that's the common case for a trip.
  const sharedBy =
    sharers.length > 0 && sharers.length === users.length
      ? "koko porukka"
      : sharers.map((s) => s.name).join(", ");

  const deleteRow = async () => {
    setDeleting(true);
    await onDelete();
  };

  return (
    <li className="rounded-[20px] border border-line bg-surface p-4 sm:flex sm:items-center sm:gap-5 sm:rounded-[22px] sm:p-5 sm:px-6">
      {/* Phone: tapping the row reveals its actions, so the row itself is the
          button. Desktop: the actions are always visible as the icon buttons
          beside it, so the row goes inert (pointer-events-none) instead. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 text-left sm:pointer-events-none sm:flex-1 sm:gap-5"
      >
        {payment.pictureFilename ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded GIF, not a static asset
          <img
            src={`/api/uploads/${payment.pictureFilename}`}
            alt=""
            className="h-[38px] w-[38px] shrink-0 rounded-full object-cover sm:h-[46px] sm:w-[46px]"
          />
        ) : (
          <Avatar name={payers[0]?.name ?? "?"} className="[--sz:38px] sm:[--sz:46px]" />
        )}

        <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1.5">
          <span className="truncate text-[15px] font-medium sm:text-[17px]">{payment.description}</span>
          <span className="truncate text-xs text-ink-muted sm:text-[13px]">
            {payers.map((p) => p.name).join(" & ")}
            <span className="hidden sm:inline"> maksoi</span> ·<span className="hidden sm:inline"> jaettu:</span>{" "}
            {sharedBy} · {formatDay(payment.created)}
            <span className="hidden sm:inline"> klo {formatTime(payment.created)}</span>
          </span>
        </span>

        <span className="font-display text-xl font-extrabold tracking-[-0.02em] tabular-nums sm:text-[26px]">
          {formatAmount(payment.amount)} €
        </span>

      </button>

      {/* Desktop actions — round icon buttons beside the row. */}
      <div className="hidden shrink-0 gap-2 sm:flex">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Muokkaa: ${payment.description}`}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-ink-soft transition-colors hover:text-ink"
        >
          <PencilIcon className="h-[17px] w-[17px]" />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={deleteRow}
          aria-label={`Poista: ${payment.description}`}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-negative-wash text-negative disabled:opacity-50"
        >
          <TrashIcon className="h-[17px] w-[17px]" />
        </button>
      </div>

      {/* Phone actions — full-width labelled pills under the opened row. */}
      {open && (
        <div className="mt-3.5 flex gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-surface-3 text-[13px] text-ink-soft"
          >
            <PencilIcon className="h-[15px] w-[15px]" />
            Muokkaa
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={deleteRow}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-negative-wash text-[13px] text-negative disabled:opacity-50"
          >
            <TrashIcon className="h-[15px] w-[15px]" />
            Poista
          </button>
        </div>
      )}
    </li>
  );
}

export function PaymentList({
  payments,
  users,
  total,
  onEdit,
  onDelete,
}: {
  payments: EventPayment[];
  users: EventUser[];
  total: number;
  onEdit: (id: number, values: PaymentFormValues) => Promise<string | null>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg font-semibold sm:text-[22px]">Maksut</h2>
        <span className="text-[12.5px] text-ink-muted sm:text-[13.5px]">
          <span className="hidden sm:inline">Yhteensä </span>
          <span className="font-bold text-ink tabular-nums">
            {total.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
          <span className="sm:hidden"> yht.</span>
        </span>
      </div>

      {payments.length === 0 ? (
        <p className="rounded-[22px] border border-line bg-surface p-6 text-sm text-ink-muted">
          Ei vielä maksuja. Lisää ensimmäinen ylhäältä.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              users={users}
              onEdit={(values) => onEdit(payment.id, values)}
              onDelete={() => onDelete(payment.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
