import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { opportunityEvidence, opportunityMatches, opportunities, outreachDrafts, researchRuns } from '@/lib/schema';
import { researchOpportunity, saveMatch } from '@/lib/services/opportunity-agent';

export const runtime = 'nodejs';
const OpportunityInput = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(5000), company: z.string().trim().max(200).optional(), location: z.string().trim().max(160).optional(), workMode: z.string().trim().max(80).optional(), employmentType: z.string().trim().max(80).optional(), requiredSkills: z.array(z.string().trim().min(1)).max(50), minYearsExperience: z.number().int().min(0).max(80).nullable().optional(), sourceUrl: z.string().trim().url().optional().or(z.literal('')), });
const ResearchInput = z.object({ sourceUrl: z.string().trim().url(), notes: z.string().trim().max(2000).optional(), profileId: z.number().int().positive().optional() });

async function admin(req?: NextRequest) {
  const session = await getSession();
  return Boolean(session.isAdmin && (!req || isSameOrigin(req)));
}
function slugify(value: string) { return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`; }

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const rows = await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
  const enriched = await Promise.all(rows.map(async (opportunity) => {
    const matches = await db.select().from(opportunityMatches).where(eq(opportunityMatches.opportunityId, opportunity.id)).orderBy(desc(opportunityMatches.score));
    const evidence = await db.select().from(opportunityEvidence).where(eq(opportunityEvidence.opportunityId, opportunity.id)).orderBy(desc(opportunityEvidence.capturedAt));
    const drafts = await db.select().from(outreachDrafts).where(eq(outreachDrafts.opportunityId, opportunity.id)).orderBy(desc(outreachDrafts.createdAt));
    return { ...opportunity, matches, evidence, drafts };
  }));
  return NextResponse.json({ opportunities: enriched });
}

export async function POST(req: NextRequest) {
  if (!(await admin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const raw = await req.json().catch(() => null);
  const research = ResearchInput.safeParse(raw);
  try {
    if (research.success) {
      const [run] = await db.insert(researchRuns).values({ query: research.data.sourceUrl, status: 'running', provider: process.env.AI_PROVIDER ?? 'openai' }).returning();
      try {
        const result = await researchOpportunity(research.data);
        const [opportunity] = await db.insert(opportunities).values({ title: result.analysis.title, slug: slugify(result.analysis.title), description: result.analysis.description, location: result.analysis.location, workMode: result.analysis.workMode, employmentType: result.analysis.employmentType, requiredSkills: result.analysis.requiredSkills, minYearsExperience: result.analysis.minYearsExperience ?? null }).returning();
        await db.insert(opportunityEvidence).values({ opportunityId: opportunity.id, sourceUrl: research.data.sourceUrl, sourceTitle: result.analysis.title, publisher: result.analysis.company, excerpt: result.excerpt });
        await db.update(researchRuns).set({ status: 'completed', resultCount: 1 }).where(eq(researchRuns.id, run.id));
        const match = research.data.profileId ? await saveMatch(opportunity.id, research.data.profileId, result.analysis.whyRelevant) : null;
        return NextResponse.json({ opportunity, match }, { status: 201 });
      } catch (error) {
        await db.update(researchRuns).set({ status: 'failed', error: error instanceof Error ? error.message : 'Research failed' }).where(eq(researchRuns.id, run.id));
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Research failed.' }, { status: 422 });
      }
    }
    const parsed = OpportunityInput.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid opportunity.' }, { status: 400 });
    const { sourceUrl, company: _company, ...opportunityData } = parsed.data;
    const [opportunity] = await db.insert(opportunities).values({ ...opportunityData, slug: slugify(parsed.data.title) }).returning();
    if (sourceUrl) await db.insert(opportunityEvidence).values({ opportunityId: opportunity.id, sourceUrl, sourceTitle: parsed.data.title });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error('[admin/opportunities POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save opportunity.' }, { status: 500 });
  }
}
