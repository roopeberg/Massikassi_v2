export interface EventUser {
  id: number;
  name: string;
}

export interface PaymentSharer {
  id: number;
  name: string;
  payer: boolean;
  amount: number;
}

export interface EventPayment {
  id: number;
  description: string;
  amount: number;
  created: Date;
  /** Served from /api/uploads/[filename] — see lib/gif.ts. */
  pictureFilename: string | null;
  sharers: PaymentSharer[];
}

export interface EventInfo {
  name: string;
  createdBy: string;
  created: Date;
  /** Null = kept forever. Otherwise auto-deleted once this passes. */
  expiresAt: Date | null;
  /** Set only for a legacy-imported event whose retention nobody has touched yet. */
  migratedAt: Date | null;
  users: EventUser[];
  payments: EventPayment[];
}
