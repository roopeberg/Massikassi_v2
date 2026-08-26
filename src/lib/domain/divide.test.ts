import { describe, expect, it } from "vitest";
import { dividePayment } from "./divide";

function countTotalCents(dues: { amount: number }[]): number {
  return dues.reduce((sum, due) => sum + Math.round(due.amount * 100), 0);
}

describe("dividePayment", () => {
  it("splits 100 fairly among one payer and three sharers", () => {
    const divided = dividePayment({
      amount: "100",
      dues: [
        { id: 77, name: "testuser", payer: true },
        { id: 78, name: "jeee", payer: false },
        { id: 79, name: "Liisa", payer: false },
        { id: 81, name: "Matti", payer: false },
      ],
    });

    expect(divided).toHaveLength(4);
    expect(countTotalCents(divided)).toBe(0);
  });

  it("splits 100 fairly among one payer and two sharers", () => {
    const divided = dividePayment({
      amount: "100",
      dues: [
        { id: 77, name: "testuser", payer: true },
        { id: 78, name: "jeee", payer: false },
        { id: 79, name: "Liisa", payer: false },
      ],
    });

    expect(divided).toHaveLength(3);
    expect(countTotalCents(divided)).toBe(0);
  });

  it("splits 16.67 fairly among one payer and three sharers", () => {
    const divided = dividePayment({
      amount: "16.67",
      dues: [
        { id: 77, name: "testuser", payer: true },
        { id: 78, name: "jeee", payer: false },
        { id: 79, name: "Liisa", payer: false },
        { id: 81, name: "Matti", payer: false },
      ],
    });

    expect(divided).toHaveLength(4);
    expect(countTotalCents(divided)).toBe(0);
  });

  it("splits 100 fairly among two payers and one sharer", () => {
    const divided = dividePayment({
      amount: "100",
      dues: [
        { id: 77, name: "testuser", payer: true },
        { id: 78, name: "jeee", payer: true },
        { id: 79, name: "Liisa", payer: false },
      ],
    });

    expect(divided).toHaveLength(3);
    expect(countTotalCents(divided)).toBe(0);

    const payers = divided.filter((due) => due.payer);
    expect(payers).toHaveLength(2);
    // 100 split between two payers: 50/50
    expect(payers.map((p) => p.amount).sort()).toEqual([50, 50]);
    // the lone sharer owes the full amount
    const sharer = divided.find((due) => !due.payer)!;
    expect(sharer.amount).toBe(-100);
  });

  it("hands the leftover cent to the first entries when it doesn't divide evenly", () => {
    const divided = dividePayment({
      amount: "10",
      dues: [
        { id: 1, name: "A", payer: true },
        { id: 2, name: "B", payer: false },
        { id: 3, name: "C", payer: false },
        { id: 4, name: "D", payer: false },
      ],
    });

    // 1000 cents / 3 sharers = 333 + leftover 1 -> first sharer gets 334
    const sharerAmounts = divided
      .filter((due) => !due.payer)
      .map((due) => due.amount)
      .sort((a, b) => a - b);
    expect(sharerAmounts).toEqual([-3.34, -3.33, -3.33]);
    expect(countTotalCents(divided)).toBe(0);
  });
});
