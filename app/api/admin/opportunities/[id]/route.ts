import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { applications, dailyApplicationGoals, opportunityEvidence, opportunityMatches, opportunities, outreachDrafts, trackedApplications } from '@/lib/schema';
import { draftOutreach, saveMatch } from '@/lib/services/opportunity-agent';

export const runtime = 'nodejs';
const ActionInput = z.object({ action: z.enum(['match', 'draft_outreach', 'approve_match', 'reject_match', 'delete_draft', 'mark_applied', 'update_application']), profileId: z.number().int().positive().optional(), channel: z.enum(['email', 'linkedin', 'application']).optional(), draftId: z.number().int().positive().optional(), status: z.enum(['applied', 'interviewing', 'offer', 'rejected', 'withdrawn', 'no_response']).optional(), notes: z.string().max(4000).optional(), appliedDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isAdmin || !isSameOrigin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const opportunityId = Number(params.id);
  if (!Number.isInteger(opportunityId)) return NextResponse.json({ error: 'Invalid opportunity id.' }, { status: 400 });
  const parsed = ActionInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid action.' }, { status: 400 });
  try {
    if (parsed.data.action === 'delete_draft') {
      if (!parsed.data.draftId) return NextResponse.json({ error: 'Draft id is required.' }, { status: 400 });
      const [deleted] = await db.delete(outreachDrafts).where(and(eq(outreachDrafts.id, parsed.data.draftId), eq(outreachDrafts.opportunityId, opportunityId))).returning({ id: outreachDrafts.id });
      if (!deleted) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
      return NextResponse.json({ deleted: true });
    }
    if (parsed.data.action === 'mark_applied') {
      const day = parsed.data.appliedDay ?? new Date().toISOString().slice(0, 10);
      const [existing] = await db.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, opportunityId)).limit(1);
      if (existing) return NextResponse.json({ application: existing, alreadyTracked: true });
      const [opportunity] = await db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
      if (!opportunity) return NextResponse.json({ error: 'Opportunity not found.' }, { status: 404 });
      const application = await db.transaction(async (tx) => {
        const [created] = await tx.insert(trackedApplications).values({ opportunityId }).onConflictDoNothing().returning();
        if (created) await tx.insert(dailyApplicationGoals).values({ day, target: 5, applied: 1 }).onConflictDoUpdate({ target: dailyApplicationGoals.day, set: { applied: sql`${dailyApplicationGoals.applied} + 1`, updatedAt: new Date() } });
        if (created) return created;
        const [row] = await tx.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, opportunityId)).limit(1);
        return row;
      });
      return NextResponse.json({ application, alreadyTracked: false }, { status: 201 });
    }
    if (parsed.data.action === 'update_application') {
      if (!parsed.data.status) return NextResponse.json({ error: 'Application status is required.' }, { status: 400 });
      const [application] = await db.update(trackedApplications).set({ status: parsed.data.status, ...(parsed.data.notes === undefined ? {} : { notes: parsed.data.notes }), updatedAt: new Date() }).where(eq(trackedApplications.opportunityId, opportunityId)).returning();
      if (!application) return NextResponse.json({ error: 'Track this opportunity as applied before updating its application.' }, { status: 404 });
      return NextResponse.json({ application });
    }
    if (parsed.data.action === 'match') {
      if (!parsed.data.profileId) return NextResponse.json({ error: 'Save a profile first.' }, { status: 400 });
      return NextResponse.json({ match: await saveMatch(opportunityId, parsed.data.profileId) });
    }
    if (parsed.data.action === 'draft_outreach') {
      if (!parsed.data.profileId) return NextResponse.json({ error: 'Save a profile first.' }, { status: 400 });
      return NextResponse.json({ draft: await draftOutreach(opportunityId, parsed.data.profileId, parsed.data.channel ?? 'email') });
    }
    if (!parsed.data.profileId) return NextResponse.json({ error: 'Profile is required.' }, { status: 400 });
    const [match] = await db.update(opportunityMatches).set({ status: parsed.data.action === 'approve_match' ? 'approved' : 'rejected', updatedAt: new Date() }).where(and(eq(opportunityMatches.opportunityId, opportunityId), eq(opportunityMatches.profileId, parsed.data.profileId))).returning();
    if (!match) return NextResponse.json({ error: 'Create a match before changing its approval state.' }, { status: 404 });
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
