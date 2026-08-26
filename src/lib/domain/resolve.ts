/**
 * Ports the original massikassi debt-settlement logic 1:1
 * (public/js/utils.js: resolve() in the old repo).
 *
 * Aggregates every due across all payments into a net balance per person,
 * then greedily matches people who are owed money against people who owe
 * money, producing the smallest set of "A pays B" transfers that settles
 * everyone up.
 *
 * Unlike the original, this returns structured data (not pre-formatted
 * English sentences) so the UI can render it in any language.
 */

export interface DueLike {
  name: string;
  /** Signed amount in the payment's currency unit (positive = paid, negative = owes). */
  amount: number;
}

export interface PaymentLike {
  amount: number;
  sharers: DueLike[];
}

export interface Balance {
  name: string;
  /** Net balance in cents. Positive = is owed money, negative = owes money. */
  balanceCents: number;
}

export interface SettlementTransfer {
  from: string;
  to: string;
  /** Always positive, in cents. */
  amountCents: number;
}

export interface ResolveResult {
  balance: Balance[];
  resolved: SettlementTransfer[];
  /** Total money spent across all payments, in the currency unit (not cents). */
  total: number;
}

export function resolve(payments: PaymentLike[]): ResolveResult {
  const totalCents = payments.reduce((sum, payment) => sum + Math.round(payment.amount * 100), 0);

  const netCentsByName = new Map<string, number>();
  for (const payment of payments) {
    for (const due of payment.sharers) {
      const current = netCentsByName.get(due.name) ?? 0;
      netCentsByName.set(due.name, current + Math.round(due.amount * 100));
    }
  }

  const balance: Balance[] = Array.from(netCentsByName.entries()).map(([name, balanceCents]) => ({
    name,
    balanceCents,
  }));

  // People who are owed money, largest balance first.
  const creditors = balance
    .filter((b) => b.balanceCents > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balanceCents - a.balanceCents);
  // People who owe money, most negative balance first.
  const debtors = balance
    .filter((b) => b.balanceCents < 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.balanceCents - b.balanceCents);

  const resolved: SettlementTransfer[] = [];
  let current = creditors.shift() ?? null;

  for (const debtor of debtors) {
    let owed = debtor.balanceCents; // negative, grows toward 0
    let leftover = 0;
    do {
      if (current && current.balanceCents === 0) {
        current = creditors.shift() ?? null;
      }
      // Every debtor's total is backed by some creditor's total, so this
      // shouldn't happen for well-formed data; bail out defensively.
      if (!current) break;

      leftover = owed + current.balanceCents;
      if (leftover > 0) {
        resolved.push({ from: debtor.name, to: current.name, amountCents: -owed });
        current.balanceCents = leftover;
      } else if (leftover < 0) {
        resolved.push({ from: debtor.name, to: current.name, amountCents: current.balanceCents });
        current.balanceCents = 0;
        owed = leftover;
      } else {
        resolved.push({ from: debtor.name, to: current.name, amountCents: -owed });
        current.balanceCents = 0;
      }
    } while (leftover < 0);
  }

  return { balance, resolved, total: totalCents / 100 };
}
