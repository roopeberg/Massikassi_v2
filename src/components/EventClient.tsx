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
import { ThemeToggle } from "./ThemeToggle";
import { UserPanel } from "./UserPanel";
import { LinkIcon, PencilIcon, PlusIcon } from "./icons";
import { avatarColors, initials } from "@/lib/avatar";
import { resolve } from "@/lib/domain/resolve";
import { formatDay, formatEuros } from "@/lib/format";
import type { EventInfo, EventPayment } from "@/lib/types";

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? "Jotain meni pieleen.";
  } catch {
    return "Jotain meni pieleen.";
  }
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
    <main className="flex-1 bg-canvas font-sans text-ink">
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 sm:pb-16 lg:px-10">
        {/* nav */}
        <div className="flex items-center justify-between pt-6">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-accent">
              <span className="font-display text-sm font-extrabold text-on-accent">m</span>
            </div>
            <span className="font-display text-base font-semibold tracking-tight">massikassi</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyEventLink}
              className="flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-[13px] text-ink-soft hover:text-ink sm:px-5"
            >
              <LinkIcon className="h-[15px] w-[15px]" />
              <span className="hidden sm:inline">{linkCopied ? "Kopioitu!" : "Kopioi linkki"}</span>
            </button>
            <ThemeToggle />
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
                  className="rounded-xl bg-surface-2 px-3 py-1.5 font-display text-2xl font-extrabold text-ink outline-none focus:ring-2 focus:ring-accent sm:text-[38px]"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-sm text-accent-ink underline">
                  Tallenna
                </button>
                <button
                  onClick={() => {
                    setNameDraft(name);
                    setEditingName(false);
                  }}
                  className="text-sm text-ink-soft underline"
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
                <h1 className="font-display text-[32px] font-extrabold tracking-tight sm:text-[44px]">{name}</h1>
                <PencilIcon className="h-[18px] w-[18px] shrink-0 text-ink-subtle opacity-60 group-hover:opacity-100" />
              </button>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-ink-muted">
              <span>
                Luonut {initialEvent.createdBy} {formatDay(initialEvent.created)}
              </span>
              {users.length > 0 && (
                <div className="flex items-center">
                  {users.map((u, i) => {
                    const { bg, fg } = avatarColors(i);
                    return (
                      <div
                        key={u.id}
                        className="-ml-2 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-canvas text-[11px] font-bold first:ml-0"
                        style={{ background: bg, color: fg }}
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
            className="hidden h-14 items-center gap-2.5 rounded-full bg-btn-bg px-7 text-base font-bold text-btn-fg hover:opacity-90 sm:flex"
          >
            <PlusIcon className="h-[18px] w-[18px]" />
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
              <h2 className="font-display text-lg font-semibold sm:text-[22px]">Maksut</h2>
              <div className="text-[13.5px] text-ink-muted">
                Yhteensä{" "}
                <span className="font-bold text-ink tabular-nums">
                  {formatEuros(settlement.total)} €
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
        className="fixed inset-x-4 bottom-4 z-10 flex h-14 items-center justify-center gap-2.5 rounded-full bg-btn-bg text-base font-bold text-btn-fg shadow-[0_-10px_30px_-12px_rgba(18,20,28,0.5)] hover:opacity-90 sm:hidden"
      >
        <PlusIcon className="h-[18px] w-[18px]" />
        {showAddForm ? "Piilota lomake" : "Lisää maksu"}
      </button>
    </main>
  );
}
