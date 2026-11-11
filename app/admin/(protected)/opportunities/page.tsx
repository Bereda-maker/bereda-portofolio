import OpportunitiesWorkspace from '@/components/admin/OpportunitiesWorkspace';

export const metadata = { title: 'AI Opportunity Workspace -- Admin' };
export const dynamic = 'force-dynamic';

async function loadWorkspace() {
  let profile = null;
  let opportunities: Array<Record<string, unknown>> = [];
  let warning: string | null = null;
  let applicationTrackingAvailable = true;

  try {
    const { db } = await import('@/lib/db');
    const { asc, desc, eq } = await import('drizzle-orm');
    const { candidateProfiles, opportunityEvidence, opportunityMatches, opportunities: opportunityTable, outreachDrafts, trackedApplications } = await import('@/lib/schema');

    try {
      const profiles = await db.select().from(candidateProfiles).orderBy(asc(candidateProfiles.id)).limit(1);
      profile = profiles[0] ?? null;
    } catch (error) {
      console.error('[admin/opportunities page] Could not load candidate profile:', error instanceof Error ? error.message : error);
      warning = 'Could not load the saved candidate profile. Check the database connection and migrations.';
    }

    try {
      const rows = await db.select().from(opportunityTable).orderBy(desc(opportunityTable.createdAt));
      opportunities = await Promise.all(rows.map(async (opportunity) => {
        const [matches, evidence, drafts] = await Promise.all([
          db.select().from(opportunityMatches).where(eq(opportunityMatches.opportunityId, opportunity.id)).orderBy(desc(opportunityMatches.score)),
          db.select().from(opportunityEvidence).where(eq(opportunityEvidence.opportunityId, opportunity.id)).orderBy(desc(opportunityEvidence.capturedAt)),
          db.select().from(outreachDrafts).where(eq(outreachDrafts.opportunityId, opportunity.id)).orderBy(desc(outreachDrafts.createdAt)),
        ]);
        let trackedApplication = null;
        try {
          const rows = await db.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, opportunity.id)).limit(1);
          trackedApplication = rows[0] ?? null;
        } catch (error) {
          applicationTrackingAvailable = false;
          console.error('[admin/opportunities page] Application tracker table unavailable:', error instanceof Error ? error.message : error);
        }
        return { ...opportunity, matches, evidence, drafts, trackedApplication };
      }));
    } catch (error) {
      console.error('[admin/opportunities page] Could not load saved opportunities:', error instanceof Error ? error.message : error);
      warning = warning ?? 'Could not load saved opportunities. Check the database connection and migrations.';
    }
  } catch (error) {
    console.error('[admin/opportunities page] Database unavailable:', error instanceof Error ? error.message : error);
    warning = 'The opportunity workspace could not connect to its database.';
  }

  return { profile, opportunities, warning, applicationTrackingAvailable };
}

export default async function AdminOpportunitiesPage() {
  const data = await loadWorkspace();
  return <OpportunitiesWorkspace
    initialProfile={data.profile as Parameters<typeof OpportunitiesWorkspace>[0]['initialProfile']}
    initialOpportunities={data.opportunities as Parameters<typeof OpportunitiesWorkspace>[0]['initialOpportunities']}
    initialLoadWarning={data.warning}
    initialApplicationTrackingAvailable={data.applicationTrackingAvailable}
  />;
}
