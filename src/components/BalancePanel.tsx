"use client";

import { useMemo } from "react";
import { resolve } from "@/lib/domain/resolve";
import type { EventPayment } from "@/lib/types";

function formatAmount(cents: number) {
  return (cents / 100).toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BalancePanel({ payments }: { payments: EventPayment[] }) {
  const result = useMemo(() => resolve(payments), [payments]);

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
      </div>
    </div>
  );
}
