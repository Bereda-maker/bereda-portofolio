import { z } from 'zod';

export const LEARNING_STATUSES = ['INTERESTED', 'APPLIED', 'REGISTERED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'DID_NOT_ATTEND'] as const;
export const LEARNING_ATTACHMENT_KINDS = ['CERTIFICATE', 'DOCUMENT', 'IMAGE', 'PRESENTATION', 'OTHER', 'CONFIRMATION', 'AGENDA', 'PHOTOGRAPH'] as const;

const optionalHttpsUrl = z.string().trim().max(1000).refine(value => !value || /^https:\/\//i.test(value), 'Links must use HTTPS.').optional().nullable();
function isSafeAttachmentReference(value: string): boolean {
  if (/^\/manus-storage\/[A-Za-z0-9_-][A-Za-z0-9/_-]{0,500}$/.test(value)) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export const LearningAttachmentInput = z.object({
  label: z.string().trim().min(1).max(160),
  kind: z.enum(LEARNING_ATTACHMENT_KINDS),
  url: z.string().trim().min(1).max(1000).refine(isSafeAttachmentReference, 'Attachment must be an HTTPS URL or a /manus-storage/ reference.'),
}).strict();

const learningExperienceFields = {
  title: z.string().trim().min(1).max(240),
  category: z.string().trim().min(1).max(100),
  organizer: z.string().trim().max(240).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  officialWebsite: optionalHttpsUrl,
  registrationUrl: optionalHttpsUrl,
  sourceUrl: optionalHttpsUrl,
  mode: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']).default('ONLINE'),
  country: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  venue: z.string().trim().max(240).optional().nullable(),
  meetingUrl: optionalHttpsUrl,
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  registrationDeadline: z.string().datetime().optional().nullable(),
  timezone: z.string().trim().min(1).max(100).default('UTC'),
  motivation: z.string().max(3000).optional().nullable(),
  expectedOutcomes: z.string().max(3000).optional().nullable(),
  skillsToAcquire: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  personalGoals: z.string().max(3000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  costType: z.enum(['FREE', 'PAID', 'UNKNOWN']).default('UNKNOWN'),
  feeCents: z.number().int().min(0).max(100000000).optional().nullable(),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).optional().nullable(),
  paymentNotes: z.string().max(2000).optional().nullable(),
  scholarship: z.string().max(1000).optional().nullable(),
  otherExpenses: z.string().max(1000).optional().nullable(),
  learningHours: z.number().int().min(0).max(10000).optional().nullable(),
};

const dateOrder = <T extends { startsAt?: string | null; endsAt?: string | null }>(schema: z.ZodType<T>) => schema.refine(
  data => !data.startsAt || !data.endsAt || new Date(data.endsAt) >= new Date(data.startsAt),
  { message: 'End date must be on or after start date.', path: ['endsAt'] },
);

export const LearningExperienceCreateInput = dateOrder(z.object({
  ...learningExperienceFields,
  status: z.enum(LEARNING_STATUSES).default('INTERESTED'),
  attachments: z.array(LearningAttachmentInput).max(30).default([]),
}).strict());

export const LearningExperienceUpdateInput = dateOrder(z.object({
  ...learningExperienceFields,
  status: z.enum(LEARNING_STATUSES),
  attachments: z.array(LearningAttachmentInput).max(30).default([]),
}).strict());

export const LearningReflectionInput = z.object({
  experienceId: z.number().int().positive(),
  learned: z.string().max(8000).optional().default(''),
  technicalKnowledge: z.string().max(5000).optional().default(''),
  softSkills: z.string().max(5000).optional().default(''),
  takeaways: z.string().max(5000).optional().default(''),
  challenges: z.string().max(5000).optional().default(''),
  peopleMet: z.string().max(3000).optional().default(''),
  ideas: z.string().max(5000).optional().default(''),
  applicationPlan: z.string().max(5000).optional().default(''),
  actionItems: z.string().max(5000).optional().default(''),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(10000).optional().default(''),
  draft: z.boolean().default(true),
}).strict();

export type LearningExperienceRequest = z.infer<typeof LearningExperienceCreateInput>;
export type LearningExperienceUpdateRequest = z.infer<typeof LearningExperienceUpdateInput>;
export type LearningAttachmentRequest = z.infer<typeof LearningAttachmentInput>;
