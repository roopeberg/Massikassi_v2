import { boolean, foreignKey, integer, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hash: varchar("hash", { length: 32 }).notNull().unique(),
  createdBy: text("created_by").notNull(),
  created: timestamp("created", { withTimezone: true }).notNull().defaultNow(),
  // Null = kept forever. Otherwise the event (and everything under it, via
  // cascade) is deleted once this passes — see scripts/flush-expired-events.ts.
  // Defaults to 3 months from creation unless the creator picks "forever".
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  // Set only by scripts/migrate-legacy-data.ts, never by the app itself.
  // Marks "this event's retention was auto-set on import, nobody has
  // actively confirmed/changed it yet" — cleared (set to null) the moment
  // someone does, in repo.updateEvent. Drives the banner in EventClient.
  migratedAt: timestamp("migrated_at", { withTimezone: true }),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    name: varchar("name", { length: 40 }).notNull(),
  },
  (table) => [
    foreignKey({ columns: [table.eventId], foreignColumns: [events.id] }).onDelete("cascade"),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    description: text("description").notNull(),
    // Stored in the event's currency unit, e.g. 16.67. Kept as numeric (not
    // float) to avoid the precision issues the original app worked around
    // with ad-hoc *100/Math.floor arithmetic.
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    created: timestamp("created", { withTimezone: true }).notNull().defaultNow(),
    modified: timestamp("modified", { withTimezone: true }).notNull().defaultNow(),
    // Soft-deleted when a payment is edited: the edit inserts a new row and
    // marks the old one deleted, so history is preserved (ported from the
    // original api_payment.deleted + api_payment.original columns).
    deleted: boolean("deleted").notNull().default(false),
    originalId: integer("original_id"),
    // Filename under the uploads volume (see lib/gif.ts), null if none
    // attached. Never a URL to an external host — see lib/gif.ts for why.
    pictureFilename: varchar("picture_filename", { length: 64 }),
  },
  (table) => [
    foreignKey({ columns: [table.eventId], foreignColumns: [events.id] }).onDelete("cascade"),
  ],
);

export const dues = pgTable(
  "dues",
  {
    id: serial("id").primaryKey(),
    paymentId: integer("payment_id").notNull(),
    userId: integer("user_id").notNull(),
    // Signed: positive for payers, negative for sharers (see lib/domain/divide.ts).
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    payer: boolean("payer").notNull().default(false),
  },
  (table) => [
    foreignKey({ columns: [table.paymentId], foreignColumns: [payments.id] }).onDelete("cascade"),
    foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
  ],
);
