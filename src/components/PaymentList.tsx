"use client";

import { useState } from "react";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import type { EventPayment, EventUser } from "@/lib/types";

function formatDate(date: Date) {
  return new Date(date).toLocaleString("fi-FI", { dateStyle: "short", timeStyle: "short" });
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

  return (
    <li className="rounded-2xl bg-[#1a1e2a] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {payment.pictureFilename && (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded GIF, not a static asset
            <img
              src={`/api/uploads/${payment.pictureFilename}`}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="font-medium">
              {payment.amount.toLocaleString("fi-FI", { minimumFractionDigits: 2 })} € » {payment.description}
            </p>
            <p className="text-xs text-[#9aa1b0]">{formatDate(payment.created)}</p>
            <p className="mt-1 text-sm text-[#b6bcc9]">
              {payers.map((p) => p.name).join(" & ")} → {sharers.map((s) => s.name).join(", ")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 text-sm">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-full px-3 py-2 text-[#9aa1b0] hover:bg-white/5 hover:text-[#f4f2ee]"
          >
            Muokkaa
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              await onDelete();
            }}
            className="min-h-11 rounded-full px-3 py-2 text-[#ff9d84] hover:bg-[#f2653f]/10 disabled:opacity-50"
          >
            Poista
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
      <h2 className="mb-2 font-[family-name:var(--font-bricolage)] text-sm font-semibold">Maksut</h2>
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
