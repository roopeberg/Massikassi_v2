import { describe, expect, it } from "vitest";
import { dividePayment } from "./divide";
import { resolve } from "./resolve";

describe("resolve", () => {
  it("matches the original golden-master case: two payers, one sharer, 100", () => {
    const payload = {
      amount: 100,
      dues: [
        { id: 77, name: "testuser", payer: true },
        { id: 78, name: "jeee", payer: true },
        { id: 79, name: "Liisa", payer: false },
      ],
    };
    const sharers = dividePayment(payload);

    const results = resolve([{ amount: payload.amount, sharers }]);

    const liisa = results.balance.find((b) => b.name === "Liisa")!;
    const testuser = results.balance.find((b) => b.name === "testuser")!;
    const jeee = results.balance.find((b) => b.name === "jeee")!;

    expect(results.total).toBe(100);
    // Same expected values as the original test/test.db.js
    expect(liisa.balanceCents).toBe(-10000);
    expect(testuser.balanceCents).toBe(5000);
    expect(jeee.balanceCents).toBe(5000);

    // Liisa's 100 debt should be fully settled across the two creditors.
    const owedByLiisa = results.resolved
      .filter((t) => t.from === "Liisa")
      .reduce((sum, t) => sum + t.amountCents, 0);
    expect(owedByLiisa).toBe(10000);
  });

  it("sums the total across multiple payments", () => {
    const payload1 = {
      amount: 100,
      dues: [
        { id: 77, name: "testuser", payer: true },
        { id: 78, name: "jeee", payer: false },
        { id: 79, name: "Liisa", payer: false },
      ],
    };
    const payload2 = { ...payload1 };

    const payments = [payload1, payload2].map((p) => ({
      amount: p.amount,
      sharers: dividePayment(p),
    }));

    const results = resolve(payments);
    expect(results.total).toBe(200);
  });

  it("settles everyone to zero (no leftover transfers)", () => {
    const payload = {
      amount: 30,
      dues: [
        { id: 1, name: "A", payer: true },
        { id: 2, name: "B", payer: false },
        { id: 3, name: "C", payer: false },
        { id: 4, name: "D", payer: false },
      ],
    };
    const sharers = dividePayment(payload);
    const results = resolve([{ amount: payload.amount, sharers }]);

    const net = new Map<string, number>();
    for (const t of results.resolved) {
      net.set(t.from, (net.get(t.from) ?? 0) - t.amountCents);
      net.set(t.to, (net.get(t.to) ?? 0) + t.amountCents);
    }
    for (const b of results.balance) {
      expect(net.get(b.name) ?? 0).toBe(b.balanceCents);
    }
  });

  it("reports no transfers when debts are already settled", () => {
    const results = resolve([]);
    expect(results.resolved).toEqual([]);
    expect(results.balance).toEqual([]);
    expect(results.total).toBe(0);
  });
});
