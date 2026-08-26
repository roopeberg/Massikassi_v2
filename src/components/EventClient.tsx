"use client";

import { useState } from "react";
import { BalancePanel } from "./BalancePanel";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import { PaymentList } from "./PaymentList";
import { UserPanel } from "./UserPanel";
import type { EventInfo, EventPayment } from "@/lib/types";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? "Jotain meni pieleen.";
  } catch {
    return "Jotain meni pieleen.";
  }
}

export function EventClient({ hash, initialEvent }: { hash: string; initialEvent: EventInfo }) {
  const [name, setName] = useState(initialEvent.name);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialEvent.name);
  const [users, setUsers] = useState(initialEvent.users);
  const [payments, setPayments] = useState<EventPayment[]>(initialEvent.payments);
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleSaveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/events/${hash}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setName(trimmed);
      setEditingName(false);
    }
  }

  async function handleAddPayment(values: PaymentFormValues) {
    const res = await fetch(`/api/events/${hash}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) return parseErrorMessage(res);
    const payment: EventPayment = await res.json();
    setPayments((prev) => [payment, ...prev]);
    setShowAddForm(false);
    return null;
  }

  async function handleEditPayment(id: number, values: PaymentFormValues) {
    const original = payments.find((p) => p.id === id);
    const res = await fetch(`/api/events/${hash}/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, created: original?.created }),
    });
    if (!res.ok) return parseErrorMessage(res);
    const updated: EventPayment = await res.json();
    setPayments((prev) =>
      [updated, ...prev.filter((p) => p.id !== id)].sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
      ),
    );
    return null;
  }

  async function handleDeletePayment(id: number) {
    const res = await fetch(`/api/events/${hash}/payments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-xl font-bold"
              autoFocus
            />
            <button onClick={handleSaveName} className="text-sm text-slate-700 underline">
              Tallenna
            </button>
            <button
              onClick={() => {
                setNameDraft(name);
                setEditingName(false);
              }}
              className="text-sm text-slate-500 underline"
            >
              Peruuta
            </button>
          </div>
        ) : (
          <h1
            className="cursor-pointer text-2xl font-bold tracking-tight"
            onClick={() => setEditingName(true)}
            title="Muokkaa nimeä"
          >
            {name}
          </h1>
        )}
        <p className="text-sm text-slate-500">
          Luonut {initialEvent.createdBy} {new Date(initialEvent.created).toLocaleDateString("fi-FI")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {showAddForm ? (
            <PaymentForm users={users} onCancel={() => setShowAddForm(false)} onSubmit={handleAddPayment} />
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              + Lisää maksu
            </button>
          )}
          <PaymentList payments={payments} users={users} onEdit={handleEditPayment} onDelete={handleDeletePayment} />
        </div>

        <div className="space-y-6">
          <UserPanel hash={hash} users={users} onUserAdded={(user) => setUsers((prev) => [...prev, user])} />
          <BalancePanel payments={payments} />
        </div>
      </div>
    </main>
  );
}
