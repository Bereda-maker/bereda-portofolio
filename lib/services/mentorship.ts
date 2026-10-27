export type MentorshipPricingInput = { minutes: number; rateCentsPerMinute: number };
export type MentorshipPricing = { minutes: number; rateCentsPerMinute: number; amountCents: number };
export type UsageLedgerEntry = MentorshipPricing & { entryType: 'charge' | 'credit' | 'adjustment'; idempotencyKey: string; sessionId?: number; menteeEmail: string };

export function calculateMentorshipPrice(input: MentorshipPricingInput): MentorshipPricing {
  if (!Number.isInteger(input.minutes) || input.minutes <= 0) throw new Error('Mentorship minutes must be a positive integer.');
  if (!Number.isInteger(input.rateCentsPerMinute) || input.rateCentsPerMinute < 0) throw new Error('Mentorship rate must be a non-negative integer in cents.');
  return { ...input, amountCents: input.minutes * input.rateCentsPerMinute };
}

export function buildUsageLedgerEntry(input: UsageLedgerEntry): UsageLedgerEntry {
  const pricing = calculateMentorshipPrice(input);
  if (!input.idempotencyKey.trim()) throw new Error('A ledger idempotency key is required.');
  if (!input.menteeEmail.trim()) throw new Error('A mentee email is required.');
  return { ...input, ...pricing };
}
