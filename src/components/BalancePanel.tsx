"use client";

import { useState, useSyncExternalStore } from "react";
import { Avatar } from "./Avatar";
import { CheckIcon, LinkIcon, ShareIcon, TransferArrowIcon } from "./icons";
import type { ResolveResult, SettlementTransfer } from "@/lib/domain/resolve";
import type { EventUser } from "@/lib/types";

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
 * The marigold panel directly under the event title — the loudest thing on the
 * page, per the design's rationale for this direction: "kuka maksaa kenelle"
 * is the one question someone opens this link to answer.
 */
export function SettlementHero({
  result,
  users,
  eventName,
  hash,
  initialWho,
}: {
  result: ResolveResult;
  users: EventUser[];
  eventName: string;
  hash: string;
  /** From ?kuka=Nimi on a personal link — see event/[hash]/page.tsx. */
  initialWho?: string;
}) {
  const [who, setWho] = useState(initialWho ?? "");
  const [copied, setCopied] = useState<"summary" | "link" | null>(null);
  /* Whether the native share sheet exists is client-only knowledge. Reading it
     straight in render made the server emit no button and the client one, i.e.
     a hydration mismatch (React logged it on every event page). Going through
     useSyncExternalStore gives the server its own snapshot (false) and lets
     React swap in the real value after hydration. `navigator.share` never
     changes, so the subscribe callback has nothing to listen to. */
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

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

  const count = result.resolved.length;

  return (
    <section className="rounded-3xl bg-accent p-5 text-on-accent sm:rounded-[28px] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        {/* The two artboards word this differently: the phone gets the short,
            literal question, the desktop the fuller line. */}
        <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-[27px]">
          <span className="sm:hidden">Kuka maksaa kenelle</span>
          <span className="hidden sm:inline">Näin velat kuittaantuvat</span>
        </h2>
        <span className="shrink-0 text-xs font-semibold text-on-accent/70 sm:flex sm:h-8 sm:items-center sm:rounded-full sm:bg-on-accent/12 sm:px-3.5 sm:text-[13px] sm:font-medium sm:text-on-accent">
          {count === 0 ? (
            "tasan"
          ) : (
            <>
              {count}
              <span className="hidden sm:inline">{" "}{count === 1 ? "siirto" : "siirtoa"}</span>
            </>
          )}
        </span>
      </div>

      {count === 0 ? (
        <p className="mt-5 text-[15px] font-medium">
          {result.total === 0 ? "Ei vielä maksuja." : "Velat on tasattu — kukaan ei ole kenellekään velkaa."}
        </p>
      ) : (
        /* Phone: one compact row per transfer — the two discs and the amount,
           no names (the discs carry identity, and the row has to fit 390px).
           Desktop: names spelled out, amount dropped to its own 40px line. */
        <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {result.resolved.map((t, i) => (
            <li
              key={`${t.from}-${t.to}-${i}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-settle-card-bg px-[18px] py-4 text-settle-card-fg sm:flex-col sm:items-start sm:gap-4 sm:rounded-[20px] sm:p-[22px]"
            >
              <div className="flex min-w-0 items-center gap-2 sm:flex-wrap sm:gap-2.5">
                <Avatar name={t.from} className="[--sz:28px] sm:[--sz:30px]" />
                <span className="hidden truncate text-[15px] font-medium sm:inline">{t.from}</span>
                <TransferArrowIcon className="h-3 w-[18px] shrink-0 text-accent sm:h-3.5 sm:w-5" />
                <Avatar name={t.to} className="[--sz:28px] sm:[--sz:30px]" />
                <span className="hidden truncate text-[15px] font-medium sm:inline">{t.to}</span>
              </div>
              <div className="font-display text-[25px] leading-none font-extrabold tracking-[-0.025em] tabular-nums sm:text-[40px] sm:tracking-[-0.03em]">
                {formatAmount(t.amountCents)} €
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Sharing the result — the summary text, or a personal link that
          pre-selects one person. Kept on the marigold ground as dark pills so
          it reads as part of the result, not as another card. */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-on-accent/15 pt-5">
        <label htmlFor="copy-summary-who" className="sr-only">
          Kuka olet?
        </label>
        <select
          id="copy-summary-who"
          value={who}
          onChange={(e) => setWho(e.target.value)}
          className="h-11 rounded-full border border-on-accent/20 bg-on-accent/10 px-4 text-sm font-medium text-on-accent"
        >
          <option value="">Kuka olet?</option>
          {users.map((u) => (
            <option key={u.id} value={u.name}>
              {u.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={copySummary}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-settle-card-bg px-5 text-sm font-bold text-settle-card-fg"
        >
          {copied === "summary" ? <CheckIcon className="h-4 w-4" /> : <ShareIcon className="h-4 w-4" />}
          {copied === "summary" ? "Kopioitu!" : "Kopioi yhteenveto"}
        </button>

        {canShare && (
          <button
            type="button"
            onClick={shareSummary}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-on-accent/25 px-5 text-sm font-bold"
          >
            Jaa
          </button>
        )}

        {who && (
          <button
            type="button"
            onClick={copyPersonalLink}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-on-accent/25 px-5 text-sm font-bold"
          >
            <LinkIcon className="h-4 w-4" />
            {copied === "link" ? "Linkki kopioitu!" : `Linkki: ${who}`}
          </button>
        )}
      </div>
      <p className="mt-2.5 text-xs font-medium text-on-accent/70">
        Liitä esim. Signal- tai WhatsApp-ryhmään. Ei lähetä mitään itse.
      </p>
    </section>
  );
}

/** "Saldot" — net position per person, with a bar scaled to the biggest debt. */
export function BalancesCard({ result }: { result: ResolveResult }) {
  const widest = Math.max(1, ...result.balance.map((b) => Math.abs(b.balanceCents)));

  return (
    <section className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold sm:text-xl">Saldot</h2>

      {result.balance.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Ei vielä maksuja.</p>
      ) : (
        <ul className="mt-4 space-y-3 sm:mt-5 sm:space-y-3.5">
          {result.balance.map((b) => {
            const positive = b.balanceCents >= 0;
            return (
              <li key={b.name}>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Avatar name={b.name} className="[--sz:30px] sm:[--sz:34px]" />
                  <span className="flex-1 truncate text-[14.5px] sm:text-[15px]">{b.name}</span>
                  <span
                    className={`text-base font-bold tabular-nums sm:text-[17px] ${positive ? "text-positive" : "text-negative"}`}
                  >
                    {positive ? "+" : "−"}
                    {formatAmount(Math.abs(b.balanceCents))} €
                  </span>
                </div>
                {/* Bars are desktop-only: on the phone artboard the list is a
                    plain read-out, and four bars in a 390px column added
                    height without telling you anything the numbers don't. */}
                <div className="mt-2.5 hidden h-1.5 overflow-hidden rounded-full bg-surface-3 sm:block">
                  <div
                    className={`h-1.5 rounded-full ${positive ? "bg-positive-fill" : "bg-negative-fill"}`}
                    style={{ width: `${Math.round((Math.abs(b.balanceCents) / widest) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
