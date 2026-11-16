import type { LearningAttachmentRequest, LearningExperienceRequest } from './learning-validation';

export type LearningFormValues = {
  title: string; category: string; organizer: string; description: string; officialWebsite: string; registrationUrl: string; sourceUrl: string;
  mode: string; country: string; city: string; venue: string; meetingUrl: string; startsAt: string; endsAt: string; registrationDeadline: string; timezone: string;
  motivation: string; expectedOutcomes: string; skillsToAcquire: string; personalGoals: string; priority: string; costType: string; fee: string; currency: string; paymentNotes: string;
  scholarship: string; otherExpenses: string; learningHours: string; status: string; attachmentLabel: string; attachmentKind: string; attachmentUrl: string;
};

function dateAsIso(value: string) { return value ? new Date(`${value}T12:00:00`).toISOString() : null; }

/** Convert presentation-only controls to the exact API contract; UI helper keys never leak into strict requests. */
export function buildLearningExperiencePayload(form: LearningFormValues, staged: LearningAttachmentRequest[] = []): LearningExperienceRequest {
  const attachments = [...staged];
  if (form.attachmentUrl.trim()) attachments.push({
    label: form.attachmentLabel.trim() || 'Supporting material',
    kind: form.attachmentKind as LearningAttachmentRequest['kind'],
    url: form.attachmentUrl.trim(),
  });
  const { fee, attachmentLabel, attachmentKind, attachmentUrl, ...fields } = form;
  return {
    ...fields,
    mode: form.mode as 'IN_PERSON' | 'ONLINE' | 'HYBRID',
    priority: form.priority as 'LOW' | 'MEDIUM' | 'HIGH',
    costType: form.costType as 'FREE' | 'PAID' | 'UNKNOWN',
    status: form.status as LearningExperienceRequest['status'],
    officialWebsite: form.officialWebsite || null,
    registrationUrl: form.registrationUrl || null,
    sourceUrl: form.sourceUrl || null,
    meetingUrl: form.meetingUrl || null,
    startsAt: dateAsIso(form.startsAt),
    endsAt: dateAsIso(form.endsAt),
    registrationDeadline: dateAsIso(form.registrationDeadline),
    skillsToAcquire: form.skillsToAcquire.split(',').map(skill => skill.trim()).filter(Boolean),
    feeCents: fee.trim() ? Math.round(Number(fee) * 100) : null,
    currency: form.currency.trim() ? form.currency.trim().toUpperCase() : null,
    paymentNotes: form.paymentNotes.trim() || null,
    learningHours: form.learningHours ? Number(form.learningHours) : null,
    attachments,
  };
}
