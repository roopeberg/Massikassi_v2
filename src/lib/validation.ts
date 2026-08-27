import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  userName: z.string().trim().min(1).max(40),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  // Null = forever, 1-12 = months from creation. Omit to get the 3-month default.
  retentionMonths: z.union([z.null(), z.number().int().min(1).max(12)]).optional(),
  // Honeypot field: must stay empty. Real users never see or fill it.
  business: z.string().max(0).optional(),
});

// Both fields optional: PUT is used both for renaming and for changing
// retention, and either can happen without the other. retentionMonths: null
// means forever, 1-12 sets a new expiry that many months from now; omit it
// entirely to leave the expiry unchanged.
export const updateEventSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  retentionMonths: z.union([z.null(), z.number().int().min(1).max(12)]).optional(),
});

export const addUserSchema = z.object({
  name: z.string().trim().min(1).max(40),
});

const dueSchema = z.object({
  id: z.number().int(),
  payer: z.boolean(),
});

export const paymentSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.coerce.number().positive().max(1_000_000),
  dues: z.array(dueSchema).min(1),
  created: z.coerce.date().optional(),
});
