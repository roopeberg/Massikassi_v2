"use client";

import { useMemo, useState } from "react";
import { avatarColors, initials } from "@/lib/avatar";
import { resolve, type SettlementTransfer } from "@/lib/domain/resolve";
import type { EventPayment, EventUser } from "@/lib/types";

function formatAmount(cents: number) {
  return (cents / 100).toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function transferLine(t: SettlementTransfer) {
  return `${t.from} maksaa ${formatAmount(t.amountCents)} € henkilölle ${t.to}`;
}

/**
 * Plain text meant to be pasted into whatever chat the group already uses
 * (Signal, WhatsApp, ...) — not sent by the app itself. No new data
 * collected, no third-party service, works fully offline once copied.
 */
function buildSummaryText(
  eventName: string,
  resolved: SettlementTransfer[],
  total: number,
  self: string | null,
) {
  const lines = [`Massikassi: ${eventName}`, ""];

  if (self) {
    const own = resolved.filter((t) => t.from === self || t.to === self);
    const rest = resolved.filter((t) => t.from !== self && t.to !== self);

    lines.push(`Oma osuutesi (${self}):`);
    lines.push(...(own.length > 0 ? own.map(transferLine) : ["Ei siirtoja sinulle juuri nyt."]));
    lines.push("");
    lines.push("Muun potin tilanne:");
    lines.push(...(rest.length > 0 ? rest.map(transferLine) : ["Ei muita siirtoja."]));
  } else {
    lines.push("Tasaus:");
    lines.push(...(resolved.length > 0 ? resolved.map(transferLine) : ["Velat on tasattu."]));
  }

  lines.push("", `Yhteensä käytetty: ${total.toLocaleString("fi-FI", { minimumFractionDigits: 2 })} €`);
  return lines.join("\n");
}

/**
 * "Saldot" — net balances per participant, with a bar showing each one's
 * magnitude relative to the largest balance in the event (matches the
 * design reference: a plain visual read of who's furthest over/under before
 * even looking at the numbers). The actual "who pays whom" breakdown is
 * SettlementHero, rendered separately above this — this card only lists
 * where everyone nets out, plus the summary-sharing controls.
 */
export function BalancePanel({
  payments,
  users,
  eventName,
  hash,
  initialWho,
}: {
  payments: EventPayment[];
  users: EventUser[];
  eventName: string;
  hash: string;
  /** From ?kuka=Nimi on a personal link — see event/[hash]/page.tsx. */
  initialWho?: string;
}) {
  const result = useMemo(() => resolve(payments), [payments]);
  const [who, setWho] = useState(initialWho ?? "");
  const [copied, setCopied] = useState<"summary" | "link" | null>(null);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const maxAbsCents = Math.max(1, ...result.balance.map((b) => Math.abs(b.balanceCents)));

  function summaryText() {
    return buildSummaryText(eventName, result.resolved, result.total, who || null);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText());
      setCopied("summary");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API can be denied/unavailable — nothing useful to do but
      // let the user know it didn't work rather than pretend it did.
      setCopied(null);
    }
  }

  async function shareSummary() {
    try {
      await navigator.share({ text: summaryText(), title: `Massikassi: ${eventName}` });
    } catch {
      // User cancelling the native share sheet also lands here — not an error.
    }
  }

  async function copyPersonalLink() {
    if (!who) return;
    const url = new URL(`/event/${hash}`, window.location.origin);
    url.searchParams.set("kuka", who);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="rounded-[22px] bg-[#1a1e2a] p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-bricolage)] text-lg font-semibold sm:text-xl">Saldot</h2>

      {result.balance.length === 0 ? (
        <p className="mt-3 text-sm text-[#9aa1b0]">Ei vielä maksuja.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-3.5">
          {result.balance.map((b) => {
            const { bg, text } = avatarColors(users.findIndex((u) => u.name === b.name));
            const positive = b.balanceCents >= 0;
            const pct = Math.round((Math.abs(b.balanceCents) / maxAbsCents) * 100);
            return (
              <div key={b.name} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: bg, color: text }}
                  >
                    {initials(b.name)}
                  </div>
                  <span className="flex-1 text-[15px]">{b.name}</span>
                  <span
                    className={`text-[17px] font-bold tabular-nums ${positive ? "text-[#4fd39a]" : "text-[#f2653f]"}`}
                  >
                    {positive ? "+" : "−"}
                    {formatAmount(Math.abs(b.balanceCents))} €
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#242a38]">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, background: positive ? "#4fd39a" : "#f2653f" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 border-t border-white/10 pt-4">
        <label className="block text-xs font-medium text-[#9aa1b0]" htmlFor="copy-summary-who">
          Kuka olet? (valinnainen — nostaa oman siirtosi ensin)
        </label>
        <select
          id="copy-summary-who"
          value={who}
          onChange={(e) => setWho(e.target.value)}
          className="mt-1 w-full rounded-xl bg-[#efeae0] px-2 py-1.5 text-sm text-[#12141c]"
        >
          <option value="">— ei valintaa —</option>
          {users.map((u) => (
            <option key={u.id} value={u.name}>
              {u.name}
            </option>
          ))}
        </select>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={copySummary}
            className="flex-1 rounded-full bg-[#f5b544] px-3 py-2 text-sm font-bold text-[#12141c] hover:bg-[#ffc95f]"
          >
            {copied === "summary" ? "Kopioitu!" : "Kopioi yhteenveto"}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={shareSummary}
              className="rounded-full border border-white/20 px-3 py-2 text-sm font-medium hover:bg-white/5"
            >
              Jaa
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-[#6b7080]">
          Liitä esim. Signal- tai WhatsApp-ryhmään. Ei lähetä mitään itse.
        </p>

        {who && (
          <button
            type="button"
            onClick={copyPersonalLink}
            className="mt-2 w-full rounded-full border border-white/20 px-3 py-2 text-sm hover:bg-white/5"
          >
            {copied === "link" ? "Linkki kopioitu!" : `Kopioi henkilökohtainen linkki (${who})`}
          </button>
        )}
      </div>
    </div>
  );
}
