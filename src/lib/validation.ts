import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  userName: z.string().trim().min(1).max(40),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  // Honeypot field: must stay empty. Real users never see or fill it.
  business: z.string().max(0).optional(),
});

export const updateEventSchema = z.object({
  name: z.string().trim().min(1).max(200),
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
