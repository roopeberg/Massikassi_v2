"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AvatarPaletteProvider, AvatarStack } from "./Avatar";
import { BalancesCard, SettlementHero } from "./BalancePanel";
import { EventSettingsPanel } from "./EventSettingsPanel";
import { CheckIcon, LinkIcon, PencilIcon, PlusIcon } from "./icons";
import { MigratedEventBanner } from "./MigratedEventBanner";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";
import { PaymentList } from "./PaymentList";
import { ThemeToggle } from "./ThemeToggle";
import { UserPanel } from "./UserPanel";
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

/** Marigold "m" chip + wordmark, as in the artboard's nav. */
function NavLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-accent">
        <span className="font-display text-lg font-extrabold text-on-accent">m</span>
      </span>
      <span className="font-display text-lg font-semibold">massikassi</span>
    </Link>
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

  const result = useMemo(() => resolve(payments), [payments]);

  async function copyEventLink() {
    try {
      await navigator.clipboard.writeText(new URL(`/event/${hash}`, window.location.origin).toString());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard can be denied — leave the label alone rather than claim success.
    }
  }

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
    const res = await fetch(`/api/events/${hash}/payments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
    }
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setShowAddForm(true)}
      className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-btn-bg px-7 text-base font-bold text-btn-fg"
    >
      <PlusIcon className="h-[18px] w-[18px]" />
      Lisää maksu
    </button>
  );

  return (
    <AvatarPaletteProvider names={users.map((u) => u.name)}>
      <main className="flex-1 pb-28 sm:pb-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-12">
          {/* nav */}
          <nav className="flex items-center justify-between pt-4 sm:pt-6">
            <NavLogo />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={copyEventLink}
                /* The phone artboard drops this button entirely, but the link is
                 the only way into an event — kept, as an icon-sized target. */
                className="flex h-11 w-11 items-center justify-center gap-2.5 rounded-full border border-line bg-surface-2 text-[13px] text-ink-soft transition-colors hover:text-ink sm:h-10 sm:w-auto sm:px-4"
              >
                {linkCopied ? (
                  <CheckIcon className="h-[15px] w-[15px]" />
                ) : (
                  <LinkIcon className="h-[15px] w-[15px]" />
                )}
                <span className="hidden sm:inline">{linkCopied ? "Linkki kopioitu!" : "Kopioi linkki"}</span>
              </button>
              <ThemeToggle />
            </div>
          </nav>

          {/* header */}
          <header className="flex flex-col gap-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <div className="flex min-w-0 flex-col gap-3.5">
              {editingName ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface-3 px-4 font-display text-2xl font-extrabold text-ink"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="h-12 rounded-full bg-btn-bg px-5 text-sm font-bold text-btn-fg"
                  >
                    Tallenna
                  </button>
                  <button
                    onClick={() => {
                      setNameDraft(name);
                      setEditingName(false);
                    }}
                    className="h-12 rounded-full border border-line px-5 text-sm font-medium text-ink-soft"
                  >
                    Peruuta
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  title="Muokkaa nimeä"
                  /* min-w-0 on both: a flex item defaults to min-width:auto, so
                   without it a long event name refuses to shrink and widens
                   the whole page past the viewport. */
                  className="group flex w-full min-w-0 items-start gap-3 text-left"
                >
                  <h1 className="min-w-0 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.03em] break-words hyphens-auto sm:text-[52px] sm:leading-none sm:tracking-[-0.032em]">
                    {name}
                  </h1>
                  <PencilIcon className="mt-1.5 h-5 w-5 shrink-0 text-ink-subtle transition-colors group-hover:text-ink" />
                </button>
              )}

              {/* Phone puts the faces first and drops the "Luonut" prefix; the
                desktop artboard reads as a sentence with the stack trailing. */}
              <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-ink-muted sm:gap-3 sm:text-[13.5px]">
                {users.length > 0 && (
                  <span className="order-first sm:order-3">
                    <AvatarStack names={users.map((u) => u.name)} />
                  </span>
                )}
                <span className="sm:order-1">
                  <span className="hidden sm:inline">Luonut </span>
                  {initialEvent.createdBy} · {new Date(initialEvent.created).toLocaleDateString("fi-FI")}
                </span>
                {users.length > 0 && (
                  <span className="hidden h-1 w-1 rounded-full bg-ink-subtle sm:order-2 sm:block" />
                )}
              </div>
            </div>

            {/* On mobile this lives in the sticky bar at the bottom instead. */}
            <div className="hidden sm:block">{addButton}</div>
          </header>

          {migratedAt && (
            <div className="pt-6">
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

          <div className="pt-8">
            <SettlementHero
              result={result}
              users={users}
              eventName={name}
              hash={hash}
              initialWho={initialWho}
            />
          </div>

          {/*
          Order on mobile (single column): settlement first (above), then
          balances, then payments, then participants — the order someone
          opening this on their phone actually reads it in. On desktop it
          becomes the artboard's 12-column split: payments left, rail right.
        */}
          <div className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-12 lg:items-start lg:gap-6">
            {/* Explicit placement rather than `order`: the payments column has to
              span both rail rows, so the rail's two cards stack against it
              instead of the second one dropping below the whole list. */}
            <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1">
              <BalancesCard result={result} />
            </div>

            <div className="flex flex-col gap-4 lg:col-span-8 lg:col-start-1 lg:row-span-2 lg:row-start-1">
              {showAddForm && (
                <PaymentForm
                  users={users}
                  onCancel={() => setShowAddForm(false)}
                  onSubmit={handleAddPayment}
                />
              )}
              <PaymentList
                payments={payments}
                users={users}
                total={result.total}
                onEdit={handleEditPayment}
                onDelete={handleDeletePayment}
              />
            </div>

            <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9 lg:row-start-2">
              <UserPanel
                hash={hash}
                users={users}
                onUserAdded={(user) => setUsers((prev) => [...prev, user])}
              />
              <EventSettingsPanel
                hash={hash}
                eventName={name}
                expiresAt={expiresAt}
                onExpiryChange={setExpiresAt}
              />
            </div>
          </div>
        </div>

        {/* Sticky add bar — mobile only, per the 390px artboard. */}
        {!showAddForm && (
          <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-canvas via-canvas to-transparent px-4 pt-8 pb-5 sm:hidden">
            <div className="[&>button]:w-full">{addButton}</div>
          </div>
        )}
      </main>
    </AvatarPaletteProvider>
  );
}
