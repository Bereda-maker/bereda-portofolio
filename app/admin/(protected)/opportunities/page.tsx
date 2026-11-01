import OpportunitiesWorkspace from '@/components/admin/OpportunitiesWorkspace';

export const metadata = { title: 'AI Opportunity Workspace -- Admin' };
export const dynamic = 'force-dynamic';

async function loadWorkspace() {
  try {
    const { db } = await import('@/lib/db');
    const { asc, desc, eq } = await import('drizzle-orm');
    const { candidateProfiles, opportunityEvidence, opportunityMatches, opportunities, outreachDrafts } = await import('@/lib/schema');
    const profiles = await db.select().from(candidateProfiles).orderBy(asc(candidateProfiles.id)).limit(1);
    const rows = await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
    const enriched = await Promise.all(rows.map(async (opportunity) => ({
      ...opportunity,
      matches: await db.select().from(opportunityMatches).where(eq(opportunityMatches.opportunityId, opportunity.id)).orderBy(desc(opportunityMatches.score)),
      evidence: await db.select().from(opportunityEvidence).where(eq(opportunityEvidence.opportunityId, opportunity.id)).orderBy(desc(opportunityEvidence.capturedAt)),
      drafts: await db.select().from(outreachDrafts).where(eq(outreachDrafts.opportunityId, opportunity.id)).orderBy(desc(outreachDrafts.createdAt)),
    })));
    return { profile: profiles[0] ?? null, opportunities: enriched };
  } catch (error) {
    console.error('[admin/opportunities page] Failed to load workspace:', error instanceof Error ? error.message : error);
    return { profile: null, opportunities: [] };
  }
}

export default async function AdminOpportunitiesPage() {
  const data = await loadWorkspace();
  return <OpportunitiesWorkspace initialProfile={data.profile} initialOpportunities={data.opportunities} />;
}
