import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { opportunityMatches } from '@/lib/schema';
import { draftOutreach, saveMatch } from '@/lib/services/opportunity-agent';

export const runtime = 'nodejs';
const ActionInput = z.object({ action: z.enum(['match', 'draft_outreach', 'approve_match', 'reject_match']), profileId: z.number().int().positive().optional(), channel: z.enum(['email', 'linkedin', 'application']).optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.isAdmin || !isSameOrigin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const opportunityId = Number(params.id);
  if (!Number.isInteger(opportunityId)) return NextResponse.json({ error: 'Invalid opportunity id.' }, { status: 400 });
  const parsed = ActionInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid action.' }, { status: 400 });
  try {
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
