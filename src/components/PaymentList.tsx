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
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">
            {payment.amount.toLocaleString("fi-FI", { minimumFractionDigits: 2 })} € » {payment.description}
          </p>
          <p className="text-xs text-slate-500">{formatDate(payment.created)}</p>
          <p className="mt-1 text-sm text-slate-600">
            {payers.map((p) => p.name).join(" & ")} → {sharers.map((s) => s.name).join(", ")}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 text-sm">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 rounded px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
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
            className="min-h-11 rounded px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-700 active:bg-red-100 disabled:opacity-50"
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
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Maksut</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-slate-500">Ei vielä maksuja.</p>
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
