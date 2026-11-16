import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildLearningExperiencePayload, type LearningFormValues } from '../lib/learning-form-payload';
import { LearningExperienceCreateInput, LearningExperienceUpdateInput, LearningReflectionInput } from '../lib/learning-validation';

function form(overrides: Partial<LearningFormValues> = {}): LearningFormValues {
  return {
    title: 'Practical TypeScript Workshop', category: 'Workshop', organizer: '', description: '', officialWebsite: '', registrationUrl: '', sourceUrl: '',
    mode: 'ONLINE', country: '', city: '', venue: '', meetingUrl: '', startsAt: '', endsAt: '', registrationDeadline: '', timezone: 'UTC',
    motivation: '', expectedOutcomes: '', skillsToAcquire: 'TypeScript, testing', personalGoals: '', priority: 'MEDIUM', costType: 'UNKNOWN', fee: '', currency: '', paymentNotes: '',
    scholarship: '', otherExpenses: '', learningHours: '', status: 'INTERESTED', attachmentLabel: '', attachmentKind: 'DOCUMENT', attachmentUrl: '',
    ...overrides,
  };
}

test('create payload maps a paid fee into cents, currency and notes without leaking UI-only keys', () => {
  const payload = buildLearningExperiencePayload(form({ costType: 'PAID', fee: '149.95', currency: 'etb', paymentNotes: 'Early registration rate.' }));
  assert.equal(payload.feeCents, 14995);
  assert.equal(payload.currency, 'ETB');
  assert.equal(payload.paymentNotes, 'Early registration rate.');
  assert.equal('fee' in payload, false);
  assert.equal('attachmentLabel' in payload, false);
  assert.equal('attachmentKind' in payload, false);
  assert.equal('attachmentUrl' in payload, false);
  assert.equal(LearningExperienceCreateInput.safeParse(payload).success, true);
});

test('create payload accepts an experience with no fee', () => {
  const payload = buildLearningExperiencePayload(form({ costType: 'FREE' }));
  assert.equal(payload.feeCents, null);
  assert.equal(payload.currency, null);
  assert.equal(LearningExperienceCreateInput.safeParse(payload).success, true);
});

test('create supports a certificate and multiple documents including a storage reference', () => {
  const payload = buildLearningExperiencePayload(form(), [
    { label: 'Certificate', kind: 'CERTIFICATE', url: 'https://files.example.org/certificate.pdf' },
    { label: 'Agenda', kind: 'PRESENTATION', url: '/manus-storage/agenda/deck_2026' },
    { label: 'Reading', kind: 'DOCUMENT', url: 'https://files.example.org/reading.pdf' },
  ]);
  const parsed = LearningExperienceCreateInput.safeParse(payload);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.attachments.length, 3);
});

test('attachment form control maps into the attachments array for create and update', () => {
  const payload = buildLearningExperiencePayload(form({ attachmentLabel: 'Workshop slides', attachmentKind: 'PRESENTATION', attachmentUrl: 'https://files.example.org/slides.pdf' }));
  assert.equal(payload.attachments.length, 1);
  assert.equal(payload.attachments[0].kind, 'PRESENTATION');
  assert.equal(LearningExperienceCreateInput.safeParse(payload).success, true);
  const update = LearningExperienceUpdateInput.safeParse({ ...payload, status: 'REGISTERED' });
  assert.equal(update.success, true);
  if (update.success) assert.equal(update.data.attachments[0].label, 'Workshop slides');
});

test('strict API validation rejects leaked UI-only keys instead of silently dropping them', () => {
  const payload = buildLearningExperiencePayload(form());
  assert.equal(LearningExperienceCreateInput.safeParse({ ...payload, fee: '12', attachmentLabel: 'oops' }).success, false);
});

test('reflection drafts remain valid and retain their separate draft state', () => {
  const draft = LearningReflectionInput.safeParse({ experienceId: 4, learned: 'Practiced test-first development.', draft: true });
  assert.equal(draft.success, true);
  if (draft.success) assert.equal(draft.data.draft, true);
});

test('new financial migration is additive so existing Learning records are preserved', async () => {
  const sql = await readFile('drizzle/0021_learning_financials.sql', 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "currency"/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "payment_notes"/);
  assert.doesNotMatch(sql, /\b(DROP|DELETE|TRUNCATE)\b/i);
});
