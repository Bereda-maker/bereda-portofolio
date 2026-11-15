import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import {
  applicationStatusHistory,
  applications,
  dailyApplicationGoals,
  opportunityActivities,
  opportunityEvidence,
  opportunityMatches,
  opportunities,
  outreachDrafts,
  trackedApplications,
} from '@/lib/schema';
import { draftOutreach, saveMatch } from '@/lib/services/opportunity-agent';
import { ACTIVITY_KINDS, APPLICATION_STAGES, isValidHttpsUrl } from '@/lib/services/opportunity-management';

export const runtime = 'nodejs';
const legacyStatuses = ['applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'no_response'] as const;
const StatusInput = z.enum([...APPLICATION_STAGES, ...legacyStatuses]);
const urlInput = z.string().trim().max(2048).url().or(z.literal('')).optional();
const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).nullable().optional();
const ActionInput = z.object({
  action: z.enum(['match', 'draft_outreach', 'approve_match', 'reject_match', 'delete_draft', 'mark_applied', 'update_application', 'update_details', 'add_activity']),
  profileId: z.number().int().positive().optional(),
  channel: z.enum(['email', 'linkedin', 'application']).optional(),
  draftId: z.number().int().positive().optional(),
  status: StatusInput.optional(),
  notes: z.string().max(4000).optional(),
  appliedDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  requirements: z.string().trim().max(5000).optional(),
  originalListingUrl: urlInput,
  applicationUrl: urlInput,
  sourcePlatform: z.string().trim().max(120).optional(),
  location: z.string().trim().max(160).optional(),
  workMode: z.string().trim().max(80).optional(),
  employmentType: z.string().trim().max(80).optional(),
  experienceLevel: z.string().trim().max(80).optional(),
  salaryRange: z.string().trim().max(120).optional(),
  currency: z.string().trim().max(12).optional(),
  applicationDeadline: dateInput,
  requiredSkills: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  applicationDate: dateInput,
  applicationMethod: z.string().trim().max(120).optional(),
  cvVersion: z.string().trim().max(200).optional(),
  coverLetter: z.string().max(5000).optional(),
  confirmationReference: z.string().trim().max(240).optional(),
  recruiterName: z.string().trim().max(200).optional(),
  recruiterContact: z.string().trim().max(500).optional(),
  nextFollowUpDate: dateInput,
  assessmentDate: dateInput,
  interviewDate: dateInput,
  interviewNotes: z.string().max(5000).optional(),
  offerDetails: z.string().max(5000).optional(),
  finalOutcome: z.string().max(1000).optional(),
  kind: z.enum(ACTIVITY_KINDS).optional(),
  activityTitle: z.string().trim().min(1).max(200).optional(),
  activityDescription: z.string().trim().max(4000).optional(),
});
function canonicalStatus(status: string) {
  const legacy: Record<string, string> = { applied: 'APPLIED', interviewing: 'INTERVIEW', offer: 'OFFER', rejected: 'REJECTED', withdrawn: 'WITHDRAWN', no_response: 'ARCHIVED' };
  return legacy[status] ?? status;
}
function activityForStatus(status: string) {
  const activity: Record<string, { kind: string; title: string }> = {
    APPLIED: { kind: 'application_submission', title: 'Application submitted' },
    ASSESSMENT: { kind: 'assessment', title: 'Moved to assessment' },
    INTERVIEW: { kind: 'interview_scheduling', title: 'Interview stage updated' },
    OFFER: { kind: 'offer', title: 'Offer stage updated' },
    REJECTED: { kind: 'rejection', title: 'Application rejected' },
    WITHDRAWN: { kind: 'withdrawal', title: 'Application withdrawn' },
  };
  return activity[status] ?? { kind: 'details_updated', title: `Application stage changed to ${status.replaceAll('_', ' ').toLowerCase()}` };
}
function validDate(value?: string | null) {
  if (!value) return true;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isAdmin || !isSameOrigin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const opportunityId = Number(params.id);
  if (!Number.isInteger(opportunityId) || opportunityId < 1) return NextResponse.json({ error: 'Invalid opportunity id.' }, { status: 400 });
  const parsed = ActionInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid action.' }, { status: 400 });
  const input = parsed.data;
  try {
    if (input.action === 'delete_draft') {
      if (!input.draftId) return NextResponse.json({ error: 'Draft id is required.' }, { status: 400 });
      const [deleted] = await db.delete(outreachDrafts).where(and(eq(outreachDrafts.id, input.draftId), eq(outreachDrafts.opportunityId, opportunityId))).returning({ id: outreachDrafts.id });
      if (!deleted) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
      return NextResponse.json({ deleted: true });
    }

    if (input.action === 'add_activity') {
      if (!input.kind || !input.activityTitle) return NextResponse.json({ error: 'Activity type and title are required.' }, { status: 400 });
      const [activity] = await db.insert(opportunityActivities).values({ opportunityId, kind: input.kind, title: input.activityTitle, description: input.activityDescription || null }).returning();
      return NextResponse.json({ activity }, { status: 201 });
    }

    if (input.action === 'update_details') {
      const [existing] = await db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
      if (!existing) return NextResponse.json({ error: 'Opportunity not found.' }, { status: 404 });
      if (!isValidHttpsUrl(input.originalListingUrl) || !isValidHttpsUrl(input.applicationUrl) || !validDate(input.applicationDeadline)) return NextResponse.json({ error: 'Check that URLs use HTTPS and dates are valid.' }, { status: 400 });
      if (![input.applicationDate, input.nextFollowUpDate, input.assessmentDate, input.interviewDate].every(validDate)) return NextResponse.json({ error: 'Enter valid application dates.' }, { status: 400 });
      const opportunityFields = ['title', 'companyName', 'description', 'requirements', 'originalListingUrl', 'applicationUrl', 'sourcePlatform', 'location', 'workMode', 'employmentType', 'experienceLevel', 'salaryRange', 'currency', 'applicationDeadline', 'requiredSkills'] as const;
      const trackerFields = ['notes', 'applicationDate', 'applicationMethod', 'cvVersion', 'coverLetter', 'confirmationReference', 'recruiterName', 'recruiterContact', 'nextFollowUpDate', 'assessmentDate', 'interviewDate', 'interviewNotes', 'offerDetails', 'finalOutcome'] as const;
      const opportunityPatch: Record<string, unknown> = {};
      const trackerPatch: Record<string, unknown> = {};
      for (const field of opportunityFields) if (input[field] !== undefined) opportunityPatch[field] = input[field] || null;
      for (const field of trackerFields) if (input[field] !== undefined) trackerPatch[field] = input[field] || null;
      await db.transaction(async (tx) => {
        if (Object.keys(opportunityPatch).length) await tx.update(opportunities).set({ ...opportunityPatch, updatedAt: new Date() }).where(eq(opportunities.id, opportunityId));
        let [tracker] = await tx.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, opportunityId)).limit(1);
        if (!tracker) [tracker] = await tx.insert(trackedApplications).values({ opportunityId, status: 'SAVED' }).returning();
        if (Object.keys(trackerPatch).length) await tx.update(trackedApplications).set({ ...trackerPatch, updatedAt: new Date() }).where(eq(trackedApplications.id, tracker.id));
        await tx.insert(opportunityActivities).values({ opportunityId, kind: 'details_updated', title: 'Opportunity details updated', description: 'The user saved changes to the opportunity or application details.' });
      });
      return NextResponse.json({ updated: true });
    }

    if (input.action === 'mark_applied' || input.action === 'update_application') {
      const requestedStatus = input.action === 'mark_applied' ? 'APPLIED' : input.status ? canonicalStatus(input.status) : null;
      if (!requestedStatus) return NextResponse.json({ error: 'Application status is required.' }, { status: 400 });
      if (!APPLICATION_STAGES.includes(requestedStatus as (typeof APPLICATION_STAGES)[number])) return NextResponse.json({ error: 'Unsupported application status.' }, { status: 400 });
      const day = input.appliedDay ?? new Date().toISOString().slice(0, 10);
      const result = await db.transaction(async (tx) => {
        const [opportunity] = await tx.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
        if (!opportunity) return { error: 'Opportunity not found.' as const };
        let [tracker] = await tx.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, opportunityId)).limit(1);
        if (!tracker) [tracker] = await tx.insert(trackedApplications).values({ opportunityId, status: 'SAVED' }).returning();
        const previousStatus = tracker.status;
        const isNewApplication = requestedStatus === 'APPLIED' && !tracker.applicationDate;
        const nextApplicationDate = isNewApplication ? day : tracker.applicationDate;
        if (previousStatus !== requestedStatus || input.notes !== undefined || isNewApplication) {
          [tracker] = await tx.update(trackedApplications).set({
            status: requestedStatus,
            ...(input.notes === undefined ? {} : { notes: input.notes }),
            ...(isNewApplication ? { applicationDate: day } : {}),
            updatedAt: new Date(),
          }).where(eq(trackedApplications.opportunityId, opportunityId)).returning();
        }
        if (previousStatus !== requestedStatus) {
          await tx.insert(applicationStatusHistory).values({ opportunityId, fromStatus: previousStatus, toStatus: requestedStatus, changeSource: 'manual', description: `Status changed from ${previousStatus} to ${requestedStatus}.` });
          const event = activityForStatus(requestedStatus);
          await tx.insert(opportunityActivities).values({ opportunityId, kind: event.kind, title: event.title, description: `Status changed from ${previousStatus} to ${requestedStatus}.` });
        }
        if (isNewApplication) await tx.insert(dailyApplicationGoals).values({ day, target: 5, applied: 1 }).onConflictDoUpdate({ target: dailyApplicationGoals.day, set: { applied: sql`${dailyApplicationGoals.applied} + 1`, updatedAt: new Date() } });
        return { application: tracker, changed: previousStatus !== requestedStatus, alreadyApplied: requestedStatus === 'APPLIED' && !isNewApplication };
      });
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 404 });
      return NextResponse.json({ application: result.application, alreadyTracked: !result.changed, alreadyApplied: result.alreadyApplied }, { status: result.changed ? 201 : 200 });
    }

    if (input.action === 'match') {
      if (!input.profileId) return NextResponse.json({ error: 'Save a profile first.' }, { status: 400 });
      return NextResponse.json({ match: await saveMatch(opportunityId, input.profileId) });
    }
    if (input.action === 'draft_outreach') {
      if (!input.profileId) return NextResponse.json({ error: 'Save a profile first.' }, { status: 400 });
      const draft = await draftOutreach(opportunityId, input.profileId, input.channel ?? 'email');
      await db.insert(opportunityActivities).values({ opportunityId, kind: 'application_preparation', title: 'Application draft prepared', description: `${input.channel ?? 'email'} draft generated for user review; nothing was sent.` });
      return NextResponse.json({ draft });
    }
    if (!input.profileId) return NextResponse.json({ error: 'Profile is required.' }, { status: 400 });
    const [match] = await db.update(opportunityMatches).set({ status: input.action === 'approve_match' ? 'approved' : 'rejected', updatedAt: new Date() }).where(and(eq(opportunityMatches.opportunityId, opportunityId), eq(opportunityMatches.profileId, input.profileId))).returning();
    if (!match) return NextResponse.json({ error: 'Create a match before changing its approval state.' }, { status: 404 });
    await db.insert(opportunityActivities).values({ opportunityId, kind: 'approval', title: input.action === 'approve_match' ? 'Opportunity match approved' : 'Opportunity match rejected', description: `Candidate match status: ${match.status}.` });
    return NextResponse.json({ match });
  } catch (error) {
    console.error('[admin/opportunities action]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Action failed.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isAdmin || !isSameOrigin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const opportunityId = Number(params.id);
  if (!Number.isInteger(opportunityId) || opportunityId < 1) return NextResponse.json({ error: 'Invalid opportunity id.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const [existing] = await db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Opportunity not found.' }, { status: 404 });
  await db.transaction(async (tx) => {
    await tx.delete(applications).where(eq(applications.opportunityId, opportunityId));
    await tx.delete(opportunityEvidence).where(eq(opportunityEvidence.opportunityId, opportunityId));
    await tx.delete(opportunityMatches).where(eq(opportunityMatches.opportunityId, opportunityId));
    await tx.delete(outreachDrafts).where(eq(outreachDrafts.opportunityId, opportunityId));
    await tx.delete(opportunities).where(eq(opportunities.id, opportunityId));
  });
  return NextResponse.json({ deleted: true });
}
