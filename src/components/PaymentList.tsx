"use client";

import { useState } from "react";
import { avatarColors, initials } from "@/lib/avatar";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import type { EventPayment, EventUser } from "@/lib/types";

function formatDate(date: Date) {
  return new Date(date).toLocaleString("fi-FI", { dateStyle: "short", timeStyle: "short" });
}

function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9aa1b0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4l11-11a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f2653f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" />
    </svg>
  );
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
  const mainPayer = payers[0];
  const avatarIndex = mainPayer ? users.findIndex((u) => u.id === mainPayer.id) : -1;
  const { bg, text } = avatarColors(avatarIndex);

  return (
    <li className="rounded-[20px] bg-[#1a1e2a] p-4 sm:p-[22px_24px]">
      <div className="flex items-center gap-3 sm:gap-5">
        {mainPayer && (
          <div
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold sm:h-[46px] sm:w-[46px] sm:text-[15px]"
            style={{ background: bg, color: text }}
          >
            {initials(mainPayer.name)}
          </div>
        )}
        {payment.pictureFilename && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded GIF, not a static asset
          <img
            src={`/api/uploads/${payment.pictureFilename}`}
            alt=""
            className="h-[38px] w-[38px] shrink-0 rounded-lg object-cover sm:h-[46px] sm:w-[46px]"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-[15px] font-medium sm:text-[17px]">{payment.description}</p>
          <p className="truncate text-xs text-[#8a8f9d] sm:text-[13px]">
            {payers.map((p) => p.name).join(" & ")} maksoi · jaettu: {sharers.map((s) => s.name).join(", ")} ·{" "}
            {formatDate(payment.created)}
          </p>
        </div>
        <div className="shrink-0 font-[family-name:var(--font-bricolage)] text-xl font-extrabold tracking-tight tabular-nums sm:text-[26px]">
          {payment.amount.toLocaleString("fi-FI", { minimumFractionDigits: 2 })} €
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Muokkaa"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#242a38] hover:bg-[#2e3547]"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onDelete();
            }}
            aria-label="Poista"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#242a38] hover:bg-[#2e3547] disabled:opacity-50"
          >
            <DeleteIcon />
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
        <p className="text-sm text-[#9aa1b0]">Ei vielä maksuja.</p>
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
