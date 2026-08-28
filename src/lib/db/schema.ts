import { boolean, foreignKey, integer, numeric, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

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

// Links an event to a recovery email address WITHOUT ever storing the
// address itself — only emailKey, an HMAC-SHA256 of the normalized address
// keyed by a server-only secret (EMAIL_HMAC_SECRET). A plain hash (even
// salted) would let anyone with a DB dump test guesses against known
// addresses; HMAC needs the secret too. See lib/recovery-email.ts.
export const eventRecovery = pgTable(
  "event_recovery",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    emailKey: varchar("email_key", { length: 64 }).notNull(),
    // Null until the confirmation link (see confirmationRequests) is used.
    // Recovery only ever considers verified rows, so attaching someone
    // else's address without their consent doesn't actually do anything.
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.eventId], foreignColumns: [events.id] }).onDelete("cascade"),
    unique().on(table.eventId, table.emailKey),
  ],
);

// One-time, expiring tokens for confirming a newly-attached recovery email.
// Only tokenHash (SHA-256 of the token) is stored — the plaintext token
// exists only in memory long enough to email it, same as recoveryRequests.
export const confirmationRequests = pgTable(
  "confirmation_requests",
  {
    id: serial("id").primaryKey(),
    eventRecoveryId: integer("event_recovery_id").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.eventRecoveryId], foreignColumns: [eventRecovery.id] }).onDelete("cascade"),
  ],
);

// One-time, expiring tokens for the "email me my events" recovery flow.
// Keyed by emailKey (not eventId) since one request can surface several
// events at once — see lib/recovery-repo.ts.
export const recoveryRequests = pgTable("recovery_requests", {
  id: serial("id").primaryKey(),
  emailKey: varchar("email_key", { length: 64 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
