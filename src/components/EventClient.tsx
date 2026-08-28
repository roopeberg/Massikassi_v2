"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BalancePanel } from "./BalancePanel";
import { EventSettingsPanel } from "./EventSettingsPanel";
import { MigratedEventBanner } from "./MigratedEventBanner";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import { PaymentList } from "./PaymentList";
import { RecoveryEmailPanel } from "./RecoveryEmailPanel";
import { SettlementHero } from "./SettlementHero";
import { UserPanel } from "./UserPanel";
import { avatarColors, initials } from "@/lib/avatar";
import { resolve } from "@/lib/domain/resolve";
import type { EventInfo, EventPayment } from "@/lib/types";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? "Jotain meni pieleen.";
  } catch {
    return "Jotain meni pieleen.";
  }
}

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#12141c" strokeWidth="2.6" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EventClient({
  hash,
  initialEvent,
  initialWho,
}: {
  hash: string;
  initialEvent: EventInfo;
  initialWho?: string;
}) {
  const [name, setName] = useState(initialEvent.name);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialEvent.name);
  const [users, setUsers] = useState(initialEvent.users);
  const [payments, setPayments] = useState<EventPayment[]>(initialEvent.payments);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expiresAt, setExpiresAt] = useState(initialEvent.expiresAt);
  const [migratedAt, setMigratedAt] = useState(initialEvent.migratedAt);
  const [linkCopied, setLinkCopied] = useState(false);

  const settlement = useMemo(() => resolve(payments), [payments]);

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

  async function copyEventLink() {
    try {
      await navigator.clipboard.writeText(new URL(`/event/${hash}`, window.location.origin).toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkCopied(false);
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
    <main className="flex-1 bg-[#12141c] font-[family-name:var(--font-space-grotesk)] text-[#f4f2ee]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 sm:pb-16 lg:px-10">
        {/* nav */}
        <div className="flex items-center justify-between pt-6">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#f5b544]">
              <span className="font-[family-name:var(--font-bricolage)] text-sm font-extrabold text-[#12141c]">m</span>
            </div>
            <span className="font-[family-name:var(--font-bricolage)] text-base font-semibold tracking-tight">
              massikassi
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyEventLink}
              className="flex h-11 items-center gap-2 rounded-full bg-[#1e2230] px-4 text-[13px] text-[#9aa1b0] hover:text-[#f4f2ee] sm:px-5"
            >
              <LinkIcon />
              <span className="hidden sm:inline">{linkCopied ? "Kopioitu!" : "Kopioi linkki"}</span>
            </button>
            {/* Decorative only — this page doesn't have a light theme (yet), so it's not a working toggle. */}
            <div aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e2230]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa1b0" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="#9aa1b0" />
              </svg>
            </div>
          </div>
        </div>

        {/* header */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            {editingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="rounded-xl bg-[#1e2230] px-3 py-1.5 font-[family-name:var(--font-bricolage)] text-2xl font-extrabold text-[#f4f2ee] outline-none focus:ring-2 focus:ring-[#f5b544] sm:text-[38px]"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-sm text-[#f5b544] underline">
                  Tallenna
                </button>
                <button
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(false);
                  }}
                  className="text-sm text-[#9aa1b0] underline"
                >
                  Peruuta
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="group flex cursor-pointer items-center gap-3 text-left"
                title="Muokkaa nimeä"
              >
                <h1 className="font-[family-name:var(--font-bricolage)] text-[32px] font-extrabold tracking-tight sm:text-[44px]">
                  {name}
                </h1>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7080"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 opacity-60 group-hover:opacity-100"
                >
                  <path d="M4 20h4l11-11a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20z" />
                </svg>
              </button>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-[#8a8f9d]">
              <span>
                Luonut {initialEvent.createdBy} {new Date(initialEvent.created).toLocaleDateString("fi-FI")}
              </span>
              {users.length > 0 && (
                <div className="flex items-center">
                  {users.map((u, i) => {
                    const { bg, text } = avatarColors(i);
                    return (
                      <div
                        key={u.id}
                        className="-ml-2 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-[#12141c] text-[11px] font-bold first:ml-0"
                        style={{ background: bg, color: text }}
                      >
                        {initials(u.name)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="hidden h-14 items-center gap-2.5 rounded-full bg-[#f5b544] px-7 text-base font-bold text-[#12141c] hover:bg-[#ffc95f] sm:flex"
          >
            <PlusIcon />
            Lisää maksu
          </button>
        </div>

        {migratedAt && (
          <div className="mt-6">
            <MigratedEventBanner
              hash={hash}
              expiresAt={expiresAt}
              onChanged={(newExpiresAt) => {
                setExpiresAt(newExpiresAt);
                setMigratedAt(null);
              }}
            />
          </div>
        )}

        <div className="mt-6">
          <SettlementHero resolved={settlement.resolved} users={users} />
        </div>

        {/*
          Order on mobile (single column): balance/settlement first — that's what
          someone opening this on their phone wants to see immediately — then the
          payment form/list, then the user list. On desktop, back to the original
          two-column layout (main content left, balance+users stacked right).
        */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="order-1 md:order-none md:col-start-3 md:row-start-1">
            <BalancePanel payments={payments} users={users} eventName={name} hash={hash} initialWho={initialWho} />
          </div>

          <div className="order-2 md:order-none flex flex-col gap-4 md:col-span-2 md:col-start-1 md:row-start-1 md:row-span-2">
            {showAddForm && (
              <PaymentForm users={users} onCancel={() => setShowAddForm(false)} onSubmit={handleAddPayment} />
            )}
            <div className="flex items-center justify-between px-1">
              <h2 className="font-[family-name:var(--font-bricolage)] text-lg font-semibold sm:text-[22px]">Maksut</h2>
              <div className="text-[13.5px] text-[#8a8f9d]">
                Yhteensä{" "}
                <span className="font-bold text-[#f4f2ee] tabular-nums">
                  {settlement.total.toLocaleString("fi-FI", { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
            <PaymentList payments={payments} users={users} onEdit={handleEditPayment} onDelete={handleDeletePayment} />
          </div>

          <div className="order-3 md:order-none flex flex-col gap-6 md:col-start-3 md:row-start-2">
            <UserPanel hash={hash} users={users} onUserAdded={(user) => setUsers((prev) => [...prev, user])} />
            <RecoveryEmailPanel hash={hash} initialVerified={initialEvent.hasVerifiedRecoveryEmail} />
            <EventSettingsPanel hash={hash} eventName={name} expiresAt={expiresAt} onExpiryChange={setExpiresAt} />
          </div>
        </div>
      </div>

      {/* mobile sticky add button — the header's button is desktop-only */}
      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        className="fixed inset-x-4 bottom-4 z-10 flex h-14 items-center justify-center gap-2.5 rounded-full bg-[#f5b544] text-base font-bold text-[#12141c] shadow-[0_-10px_30px_-12px_rgba(18,20,28,0.9)] hover:bg-[#ffc95f] sm:hidden"
      >
        <PlusIcon />
        {showAddForm ? "Piilota lomake" : "Lisää maksu"}
      </button>
    </main>
  );
}
