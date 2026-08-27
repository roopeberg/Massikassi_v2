import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db/client";
import { dues, events, payments, users } from "./db/schema";
import { dividePayment } from "./domain/divide";
import { generateHash } from "./hash";

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ValidationError extends Error {}

// Default retention for a new event unless its creator picks something else.
const DEFAULT_RETENTION_MONTHS = 3;

// Note: setMonth rolls over day-of-month overflow (e.g. Jan 31 + 1 month
// lands in early March, not Feb 28) — a known, accepted imprecision here
// rather than pulling in a date library for a retention estimate.
function monthsFromNow(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}

/** null (forever) or 1-12 (months from now); undefined -> the 3-month default. */
function resolveExpiresAt(retentionMonths: number | null | undefined): Date | null {
  if (retentionMonths === undefined) return monthsFromNow(DEFAULT_RETENTION_MONTHS);
  return retentionMonths === null ? null : monthsFromNow(retentionMonths);
}

async function findEventByHash(hash: string) {
  const [event] = await db.select().from(events).where(eq(events.hash, hash)).limit(1);
  if (!event) throw new NotFoundError("Event not found");
  return event;
}

export async function createEvent(input: {
  name: string;
  userName: string;
  retentionMonths?: number | null;
}) {
  return db.transaction(async (tx) => {
    // Vanishingly unlikely to collide (128-bit random token), so we don't
    // need the original's generate-and-check-uniqueness loop.
    const hash = generateHash();
    const [event] = await tx
      .insert(events)
      .values({
        name: input.name,
        hash,
        createdBy: input.userName,
        expiresAt: resolveExpiresAt(input.retentionMonths),
      })
      .returning();

    await tx.insert(users).values({
      eventId: event.id,
      name: input.userName,
    });

    return event;
  });
}

export async function getEventInfo(hash: string) {
  const event = await findEventByHash(hash);

  const eventUsers = await db.select().from(users).where(eq(users.eventId, event.id));

  const rows = await db
    .select({
      paymentId: payments.id,
      description: payments.description,
      amount: payments.amount,
      created: payments.created,
      dueAmount: dues.amount,
      payer: dues.payer,
      userId: dues.userId,
      userName: users.name,
    })
    .from(payments)
    .innerJoin(dues, eq(dues.paymentId, payments.id))
    .innerJoin(users, eq(users.id, dues.userId))
    .where(and(eq(payments.eventId, event.id), eq(payments.deleted, false)))
    .orderBy(payments.created);

  const paymentsById = new Map<
    number,
    { id: number; description: string; amount: number; created: Date; sharers: { id: number; name: string; payer: boolean; amount: number }[] }
  >();
  for (const row of rows) {
    let payment = paymentsById.get(row.paymentId);
    if (!payment) {
      payment = { id: row.paymentId, description: row.description, amount: Number(row.amount), created: row.created, sharers: [] };
      paymentsById.set(row.paymentId, payment);
    }
    payment.sharers.push({ id: row.userId, name: row.userName, payer: row.payer, amount: Number(row.dueAmount) });
  }
  const paymentList = Array.from(paymentsById.values()).sort((a, b) => b.created.getTime() - a.created.getTime());

  return {
    name: event.name,
    createdBy: event.createdBy,
    created: event.created,
    expiresAt: event.expiresAt,
    migratedAt: event.migratedAt,
    users: eventUsers.map((u) => ({ id: u.id, name: u.name })),
    payments: paymentList,
  };
}

export async function updateEvent(hash: string, input: { name?: string; retentionMonths?: number | null }) {
  const event = await findEventByHash(hash);

  const patch: { name?: string; expiresAt?: Date | null; migratedAt?: null } = {};
  if (input.name !== undefined) patch.name = input.name;
  // A chosen retention always counts from now, not from the original
  // creation date — matches what the UI says ("N kk tästä hetkestä").
  // Also counts as "someone actively dealt with this" for a migrated
  // event's auto-set retention — see the migratedAt column comment.
  if (input.retentionMonths !== undefined) {
    patch.expiresAt = input.retentionMonths === null ? null : monthsFromNow(input.retentionMonths);
    patch.migratedAt = null;
  }

  const [updated] = await db.update(events).set(patch).where(eq(events.id, event.id)).returning();
  return updated;
}

export async function deleteEvent(hash: string) {
  const event = await findEventByHash(hash);
  // Cascades to users/payments (and payments -> dues) via the FK definitions.
  await db.delete(events).where(eq(events.id, event.id));
}

export async function addUserToEvent(hash: string, name: string) {
  const event = await findEventByHash(hash);

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.eventId, event.id), eq(users.name, name)))
    .limit(1);
  if (existing) throw new ConflictError("User already exists");

  const [user] = await db.insert(users).values({ eventId: event.id, name }).returning();
  return { id: user.id, name: user.name };
}

interface PaymentInput {
  description: string;
  amount: number;
  dues: { id: number; payer: boolean }[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function addPayment(hash: string, input: PaymentInput) {
  const event = await findEventByHash(hash);
  return db.transaction((tx) => insertPayment(tx, event.id, input, null));
}

export async function editPayment(hash: string, originalId: number, input: PaymentInput, createdAt?: Date) {
  const event = await findEventByHash(hash);

  return db.transaction(async (tx) => {
    const [original] = await tx
      .select()
      .from(payments)
      .where(and(eq(payments.id, originalId), eq(payments.eventId, event.id)))
      .limit(1);
    if (!original) throw new NotFoundError("Payment not found");

    const result = await insertPayment(tx, event.id, input, originalId, createdAt);
    await tx.update(payments).set({ deleted: true }).where(eq(payments.id, originalId));
    return result;
  });
}

async function insertPayment(tx: Tx, eventId: number, input: PaymentInput, originalId: number | null, createdAt?: Date) {
  const ids = input.dues.map((d) => d.id);
  const eventUsers = await tx.select().from(users).where(and(eq(users.eventId, eventId), inArray(users.id, ids)));
  const nameById = new Map(eventUsers.map((u) => [u.id, u.name]));
  if (nameById.size !== new Set(ids).size) {
    throw new ValidationError("One or more users do not belong to this event");
  }

  const divided = dividePayment({
    amount: input.amount,
    dues: input.dues.map((d) => ({ id: d.id, payer: d.payer, name: nameById.get(d.id)! })),
  });

  const [payment] = await tx
    .insert(payments)
    .values({
      eventId,
      description: input.description,
      amount: input.amount.toFixed(2),
      originalId,
      ...(createdAt ? { created: createdAt, modified: createdAt } : {}),
    })
    .returning();

  if (divided.length > 0) {
    await tx.insert(dues).values(
      divided.map((due) => ({
        paymentId: payment.id,
        userId: due.id,
        amount: due.amount.toFixed(2),
        payer: due.payer,
      })),
    );
  }

  return {
    id: payment.id,
    description: payment.description,
    amount: Number(payment.amount),
    created: payment.created,
    sharers: divided.map((d) => ({ id: d.id, name: d.name, payer: d.payer, amount: d.amount })),
  };
}

export async function deletePayment(hash: string, paymentId: number) {
  const event = await findEventByHash(hash);
  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.eventId, event.id)))
    .limit(1);
  if (!payment) throw new NotFoundError("Payment not found");

  await db.delete(payments).where(eq(payments.id, paymentId));
}
