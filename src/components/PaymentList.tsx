"use client";

import { useState } from "react";
import { avatarColors, initials } from "@/lib/avatar";
import { formatDateTime, formatEuros } from "@/lib/format";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import { PencilIcon, TrashIcon } from "./icons";
import type { EventPayment, EventUser } from "@/lib/types";

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

  if (editing) {
    return (
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
    );
  }

  const payers = payment.sharers.filter((s) => s.payer);
  const sharers = payment.sharers.filter((s) => !s.payer);

  return (
    <li className="rounded-[20px] bg-surface p-4 sm:p-[22px_24px]">
      <div className="flex items-center gap-3 sm:gap-5">
        {payers.length > 0 && (
          // Overlapping stack, not just the first payer — a payment can have
          // more than one (e.g. a shared bill), and the meta line below lists
          // all of them, so the avatars shouldn't silently drop any.
          <div className="flex shrink-0">
            {payers.map((payer) => {
              const { bg, fg } = avatarColors(users.findIndex((u) => u.id === payer.id));
              return (
                <div
                  key={payer.id}
                  className="-ml-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-surface text-[13px] font-bold first:ml-0 sm:h-[46px] sm:w-[46px] sm:text-[15px]"
                  style={{ background: bg, color: fg }}
                >
                  {initials(payer.name)}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-[15px] font-medium sm:text-[17px]">{payment.description}</p>
          <p className="truncate text-xs text-ink-muted sm:text-[13px]">
            {payers.map((p) => p.name).join(" & ")} maksoi · jaettu: {sharers.map((s) => s.name).join(", ")} ·{" "}
            {formatDateTime(payment.created)}
          </p>
        </div>
        <div className="shrink-0 font-display text-xl font-extrabold tracking-tight tabular-nums sm:text-[26px]">
          {formatEuros(payment.amount)} €
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Muokkaa"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-ink-soft hover:text-ink"
          >
            <PencilIcon className="h-[17px] w-[17px]" />
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onDelete();
            }}
            aria-label="Poista"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-negative-wash text-negative disabled:opacity-50"
          >
            <TrashIcon className="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
    </li>
  );
}

export function PaymentList({
  payments,
  users,
  onEdit,
  onDelete,
}: {
  payments: EventPayment[];
  users: EventUser[];
  onEdit: (id: number, values: PaymentFormValues) => Promise<string | null>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <div>
      {payments.length === 0 ? (
        <p className="text-sm text-ink-soft">Ei vielä maksuja.</p>
      ) : (
        <ul className="space-y-3">
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
    </div>
  );
}
