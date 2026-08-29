import { avatarColors, initials } from "@/lib/avatar";
import type { SettlementTransfer } from "@/lib/domain/resolve";
import { formatCents } from "@/lib/format";
import type { EventUser } from "@/lib/types";
import { TransferArrowIcon } from "./icons";

function Avatar({ name, index }: { name: string; index: number }) {
  const { bg, fg } = avatarColors(index);
  return (
    <div
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold"
      style={{ background: bg, color: fg }}
    >
      {initials(name)}
    </div>
  );
}

/**
 * The full-width amber "who pays whom" banner. Sits above the two-column
 * grid on both desktop and mobile — not part of BalancePanel's "Saldot"
 * card, which only lists net balances now. Uses the fixed-in-both-themes
 * settle-card tokens for its inner cards (globals.css), same as the
 * marigold background itself (--accent).
 */
export function SettlementHero({ resolved, users }: { resolved: SettlementTransfer[]; users: EventUser[] }) {
  if (resolved.length === 0) return null;

  function indexOf(name: string) {
    return users.findIndex((u) => u.name === name);
  }

  return (
    <div className="rounded-[28px] bg-accent p-6 text-on-accent sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-[27px]">
          Näin velat kuittaantuvat
        </h2>
        <span className="shrink-0 rounded-full bg-on-accent/10 px-3.5 py-1.5 text-sm font-medium">
          {resolved.length} {resolved.length === 1 ? "siirto" : "siirtoa"}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((t, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-[20px] bg-settle-card-bg p-5 text-settle-card-fg">
            <div className="flex flex-wrap items-center gap-2.5">
              <Avatar name={t.from} index={indexOf(t.from)} />
              <span className="text-[15px] font-medium">{t.from}</span>
              <TransferArrowIcon className="h-3.5 w-5 text-accent" />
              <Avatar name={t.to} index={indexOf(t.to)} />
              <span className="text-[15px] font-medium">{t.to}</span>
            </div>
            <div className="font-display text-[32px] font-extrabold tracking-tight tabular-nums sm:text-[40px]">
              {formatCents(t.amountCents)} €
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
