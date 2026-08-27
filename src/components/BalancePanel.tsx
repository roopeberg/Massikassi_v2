"use client";

import { useMemo, useState } from "react";
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
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Saldot</h2>
        {result.balance.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ei vielä maksuja.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {result.balance.map((b) => (
              <li key={b.name} className="flex justify-between">
                <span>{b.name}</span>
                <span className={b.balanceCents >= 0 ? "text-emerald-700" : "text-red-700"}>
                  {formatAmount(b.balanceCents)} €
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Tasaus</h2>
        {result.resolved.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Velat on tasattu.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {result.resolved.map((t, i) => (
              <li key={i}>
                <span className="font-medium">{t.from}</span> maksaa{" "}
                <span className="font-medium">{formatAmount(t.amountCents)} €</span> henkilölle{" "}
                <span className="font-medium">{t.to}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Yhteensä käytetty: {result.total.toLocaleString("fi-FI", { minimumFractionDigits: 2 })} €
        </p>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <label className="block text-xs font-medium text-slate-600" htmlFor="copy-summary-who">
            Kuka olet? (valinnainen — nostaa oman siirtosi ensin)
          </label>
          <select
            id="copy-summary-who"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
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
              className="flex-1 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              {copied === "summary" ? "Kopioitu!" : "Kopioi yhteenveto"}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={shareSummary}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Jaa
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Liitä esim. Signal- tai WhatsApp-ryhmään. Ei lähetä mitään itse.
          </p>

          {who && (
            <button
              type="button"
              onClick={copyPersonalLink}
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {copied === "link" ? "Linkki kopioitu!" : `Kopioi henkilökohtainen linkki (${who})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
