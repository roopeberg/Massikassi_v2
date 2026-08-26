/**
 * Ports the original massikassi payment-splitting logic 1:1
 * (server/db.js: divideFairly / dividePayment in the old repo).
 *
 * A payment amount is split fairly (in whole cents) among its payers,
 * and separately among its sharers. Any leftover cent from integer
 * division is handed out one at a time to the first entries in the
 * list, so the parts always sum back up to the original amount.
 * Payers end up with a positive due, sharers with a negative one.
 */

export interface DueInput {
  id: number;
  name: string;
  payer: boolean;
}

export interface DividedDue {
  id: number;
  name: string;
  payer: boolean;
  /** Signed amount in the payment's currency unit (not cents). */
  amount: number;
}

function divideFairly(dues: DueInput[], amountCents: number): DividedDue[] {
  const times = dues.length;
  let leftover = amountCents % times;
  const dividedAmount = Math.floor(amountCents / times);

  return dues.map((due) => {
    let pennies = 0;
    if (leftover > 0) {
      pennies = 1;
      leftover--;
    }
    const scaledAmount = dividedAmount + pennies;
    const amount = scaledAmount / 100;
    return {
      id: due.id,
      name: due.name,
      payer: due.payer,
      amount: due.payer ? amount : -amount,
    };
  });
}

export function dividePayment(payment: { amount: number | string; dues: DueInput[] }): DividedDue[] {
  // Math.round (not the original's truncating parseInt) avoids losing a cent
  // to float imprecision, e.g. 16.67 * 100 === 1666.9999999999998.
  const amountCents = Math.round(Number(payment.amount) * 100);

  const payers = payment.dues.filter((due) => due.payer === true);
  const sharers = payment.dues.filter((due) => due.payer === false);

  const dividedPayers = divideFairly(payers, amountCents);
  const dividedSharers = divideFairly(sharers, amountCents);

  return [...dividedSharers, ...dividedPayers];
}
