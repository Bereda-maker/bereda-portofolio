import { and, desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import {
  applicationStatusHistory,
  candidateProfiles,
  dailyApplicationGoals,
  opportunityActivities,
  opportunityEvidence,
  opportunityMatches,
  opportunities,
  outreachDrafts,
  researchRuns,
  trackedApplications,
} from '@/lib/schema';
import { discoverOpportunityRecommendations, researchOpportunity, saveMatch } from '@/lib/services/opportunity-agent';
import {
  APPLICATION_STAGES,
  assertPublicHttpsUrl,
  findPotentialDuplicates,
  isValidHttpsUrl,
  type DuplicateMatch,
} from '@/lib/services/opportunity-management';

export const runtime = 'nodejs';

const optionalUrl = z.string().trim().max(2048).url().or(z.literal('')).optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''));
const OpportunityInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  company: z.string().trim().max(200).optional(),
  companyName: z.string().trim().max(200).optional(),
  sourceName: z.string().trim().max(120).optional(),
  sourcePlatform: z.string().trim().max(120).optional(),
  originType: z.enum(['AUTOMATED', 'MANUAL']).optional(),
  location: z.string().trim().max(160).optional(),
  workMode: z.string().trim().max(80).optional(),
  employmentType: z.string().trim().max(80).optional(),
  experienceLevel: z.string().trim().max(80).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(100)).max(50).optional().default([]),
  requirements: z.string().trim().max(5000).optional(),
  salaryRange: z.string().trim().max(120).optional(),
  currency: z.string().trim().max(12).optional(),
  applicationDeadline: dateString,
  minYearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  applicationUrl: optionalUrl,
  sourceUrl: optionalUrl,
});
const ManualInput = z.object({
  action: z.literal('create_manual'),
  title: z.string().trim().min(1).max(200),
  companyName: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(''),
  originalListingUrl: optionalUrl,
  applicationUrl: optionalUrl,
  location: z.string().trim().max(160).optional(),
  workMode: z.string().trim().max(80).optional(),
  employmentType: z.string().trim().max(80).optional(),
  experienceLevel: z.string().trim().max(80).optional(),
  salaryRange: z.string().trim().max(120).optional(),
  currency: z.string().trim().max(12).optional(),
  applicationDeadline: dateString,
  sourcePlatform: z.string().trim().max(120).optional().default(''),
  requiredSkills: z.array(z.string().trim().min(1).max(100)).max(50).optional().default([]),
  requirements: z.string().trim().max(5000).optional(),
  contactInformation: z.string().trim().max(500).optional(),
  personalNotes: z.string().trim().max(4000).optional(),
  initialApplicationStatus: z.enum(APPLICATION_STAGES).default('SAVED'),
  entryMethod: z.enum(['quick_add', 'url_import']).default('quick_add'),
  duplicateResolution: z.enum(['merge', 'dismiss']).optional(),
  mergeTargetId: z.number().int().positive().optional(),
});
const ResearchInput = z.object({ sourceUrl: z.string().trim().url(), notes: z.string().trim().max(2000).optional(), profileId: z.number().int().positive().optional() });
const PreviewInput = z.object({ action: z.literal('preview_url'), sourceUrl: z.string().trim().url(), notes: z.string().trim().max(2000).optional() });
const DiscoveryInput = z.object({ action: z.literal('discover'), profileId: z.number().int().positive(), categories: z.array(z.enum(['remote', 'freelance', 'internship', 'cofounder'])).min(1).max(4) });

async function admin(req?: NextRequest) {
  const session = await getSession();
  return Boolean(session.isAdmin && (!req || isSameOrigin(req)));
}
function slugify(value: string) {
  const base = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 150) || 'opportunity';
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
function isRealDate(value?: string) {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function sourceHost(raw?: string) {
  if (!raw) return undefined;
  try { return new URL(raw).hostname.replace(/^www\./i, ''); } catch { return undefined; }
}
async function duplicateCandidates(input: { title: string; companyName?: string | null; originalListingUrl?: string | null; applicationUrl?: string | null }): Promise<DuplicateMatch[]> {
  const { db } = await import('@/lib/db');
  const [rows, evidence] = await Promise.all([
    db.select().from(opportunities),
    db.select().from(opportunityEvidence),
  ]);
  const evidenceByOpportunity = new Map<number, Array<{ sourceUrl: string }>>();
  for (const item of evidence) {
    const list = evidenceByOpportunity.get(item.opportunityId) ?? [];
    list.push({ sourceUrl: item.sourceUrl });
    evidenceByOpportunity.set(item.opportunityId, list);
  }
  return findPotentialDuplicates(input, rows.map((row) => ({
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    originalListingUrl: row.originalListingUrl,
    applicationUrl: row.applicationUrl,
    evidence: evidenceByOpportunity.get(row.id) ?? [],
  })));
}
function safeLinks(...values: Array<string | undefined>) {
  return values.every((value) => isValidHttpsUrl(value));
}

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const rows = await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
  let applicationTrackingAvailable = true;
  const enriched = await Promise.all(rows.map(async (opportunity) => {
    const [matches, evidence, drafts, activities, statusHistory] = await Promise.all([
      db.select().from(opportunityMatches).where(eq(opportunityMatches.opportunityId, opportunity.id)).orderBy(desc(opportunityMatches.score)),
      db.select().from(opportunityEvidence).where(eq(opportunityEvidence.opportunityId, opportunity.id)).orderBy(desc(opportunityEvidence.capturedAt)),
      db.select().from(outreachDrafts).where(eq(outreachDrafts.opportunityId, opportunity.id)).orderBy(desc(outreachDrafts.createdAt)),
      db.select().from(opportunityActivities).where(eq(opportunityActivities.opportunityId, opportunity.id)).orderBy(desc(opportunityActivities.createdAt)),
      db.select().from(applicationStatusHistory).where(eq(applicationStatusHistory.opportunityId, opportunity.id)).orderBy(desc(applicationStatusHistory.changedAt)),
    ]);
    let application: typeof trackedApplications.$inferSelect | null = null;
    try {
      const trackedRows = await db.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, opportunity.id)).limit(1);
      application = trackedRows[0] ?? null;
    } catch (error) {
      applicationTrackingAvailable = false;
      console.error('[admin/opportunities GET] Application tracker table unavailable:', error instanceof Error ? error.message : error);
    }
    return { ...opportunity, matches, evidence, drafts, activities, statusHistory, trackedApplication: application ?? null };
  }));
  return NextResponse.json({ opportunities: enriched, applicationTrackingAvailable });
}

export async function POST(req: NextRequest) {
  if (!(await admin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const raw = await req.json().catch(() => null);

  if (raw && typeof raw === 'object' && (raw as { action?: unknown }).action === 'preview_url') {
    const parsed = PreviewInput.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Enter a valid HTTPS listing URL.' }, { status: 400 });
    try {
      await assertPublicHttpsUrl(parsed.data.sourceUrl);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'This URL cannot be researched.' }, { status: 400 });
    }
    const [run] = await db.insert(researchRuns).values({ query: parsed.data.sourceUrl, status: 'running', provider: process.env.AI_PROVIDER ?? 'openai' }).returning();
    try {
      const result = await researchOpportunity({ sourceUrl: parsed.data.sourceUrl, notes: parsed.data.notes });
      await db.update(researchRuns).set({ status: 'completed', resultCount: result.analyses.length }).where(eq(researchRuns.id, run.id));
      return NextResponse.json({
        sourceUrl: parsed.data.sourceUrl,
        excerpt: result.excerpt,
        previews: result.analyses.map((analysis) => ({
          title: analysis.title,
          companyName: analysis.company ?? '',
          description: analysis.description,
          requirements: analysis.requirements ?? '',
          requiredSkills: analysis.requiredSkills,
          location: analysis.location ?? '',
          workMode: analysis.workMode ?? '',
          employmentType: analysis.employmentType ?? '',
          experienceLevel: analysis.experienceLevel ?? '',
          salaryRange: analysis.salaryRange ?? '',
          currency: analysis.currency ?? '',
          applicationDeadline: analysis.applicationDeadline ?? '',
          applicationUrl: analysis.applicationUrl ?? '',
          originalListingUrl: parsed.data.sourceUrl,
          sourcePlatform: sourceHost(parsed.data.sourceUrl) ?? 'Other',
          whyRelevant: analysis.whyRelevant,
          risks: analysis.risks,
        })),
      });
    } catch (error) {
      await db.update(researchRuns).set({ status: 'failed', error: error instanceof Error ? error.message : 'URL preview failed' }).where(eq(researchRuns.id, run.id));
      return NextResponse.json({ error: error instanceof Error ? error.message : 'URL extraction failed.' }, { status: 422 });
    }
  }

  if (raw && typeof raw === 'object' && (raw as { action?: unknown }).action === 'discover') {
    const discovery = DiscoveryInput.safeParse(raw);
    if (!discovery.success) return NextResponse.json({ error: discovery.error.issues[0]?.message ?? 'Invalid discovery request.' }, { status: 400 });
    const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, discovery.data.profileId)).limit(1);
    if (!profile) return NextResponse.json({ error: 'Save your candidate profile before discovering recommendations.' }, { status: 400 });
    const query = `Profile discovery: ${discovery.data.categories.join(', ')}`;
    const [run] = await db.insert(researchRuns).values({ query, status: 'running', provider: process.env.AI_PROVIDER ?? 'openai' }).returning();
    try {
      const result = await discoverOpportunityRecommendations(profile, discovery.data.categories);
      const resultCount = result.recommendations.length + result.cofounderDirections.length;
      await db.update(researchRuns).set({ status: 'completed', resultCount }).where(eq(researchRuns.id, run.id));
      return NextResponse.json(result);
    } catch (error) {
      await db.update(researchRuns).set({ status: 'failed', error: error instanceof Error ? error.message : 'Discovery failed' }).where(eq(researchRuns.id, run.id));
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Discovery failed.' }, { status: 422 });
    }
  }

  if (raw && typeof raw === 'object' && (raw as { action?: unknown }).action === 'create_manual') {
    const parsed = ManualInput.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid opportunity.' }, { status: 400 });
    const input = parsed.data;
    if (!isRealDate(input.applicationDeadline)) return NextResponse.json({ error: 'Enter a valid application deadline.' }, { status: 400 });
    if (!safeLinks(input.originalListingUrl, input.applicationUrl)) return NextResponse.json({ error: 'Listing and application URLs must use HTTPS.' }, { status: 400 });
    const duplicateMatches = await duplicateCandidates({ title: input.title, companyName: input.companyName, originalListingUrl: input.originalListingUrl, applicationUrl: input.applicationUrl });

    if (input.duplicateResolution === 'merge') {
      const duplicate = duplicateMatches.find((row) => row.id === input.mergeTargetId);
      if (!duplicate) return NextResponse.json({ error: 'Select a valid potential duplicate to merge into.' }, { status: 400 });
      const [target] = await db.select().from(opportunities).where(eq(opportunities.id, duplicate.id)).limit(1);
      if (!target) return NextResponse.json({ error: 'The selected opportunity no longer exists.' }, { status: 404 });
      const patch = {
        companyName: target.companyName || input.companyName,
        description: target.description || input.description || null,
        location: target.location || input.location || null,
        workMode: target.workMode || input.workMode || null,
        employmentType: target.employmentType || input.employmentType || null,
        experienceLevel: target.experienceLevel || input.experienceLevel || null,
        requirements: target.requirements || input.requirements || null,
        salaryRange: target.salaryRange || input.salaryRange || null,
        currency: target.currency || input.currency || null,
        applicationDeadline: target.applicationDeadline || input.applicationDeadline || null,
        originalListingUrl: target.originalListingUrl || input.originalListingUrl || null,
        applicationUrl: target.applicationUrl || input.applicationUrl || null,
        sourcePlatform: target.sourcePlatform || input.sourcePlatform || null,
        requiredSkills: target.requiredSkills.length ? target.requiredSkills : input.requiredSkills,
        updatedAt: new Date(),
      };
      await db.transaction(async (tx) => {
        await tx.update(opportunities).set(patch).where(eq(opportunities.id, target.id));
        if (input.originalListingUrl) {
          const [knownEvidence] = await tx.select({ id: opportunityEvidence.id }).from(opportunityEvidence).where(and(eq(opportunityEvidence.opportunityId, target.id), eq(opportunityEvidence.sourceUrl, input.originalListingUrl))).limit(1);
          if (!knownEvidence) await tx.insert(opportunityEvidence).values({ opportunityId: target.id, sourceUrl: input.originalListingUrl, sourceTitle: input.title, publisher: input.sourcePlatform || null, excerpt: input.description.slice(0, 1000), sourceType: 'manual' });
        }
        const [tracker] = await tx.select().from(trackedApplications).where(eq(trackedApplications.opportunityId, target.id)).limit(1);
        if (tracker) {
          const trackerPatch = {
            ...(input.personalNotes && !tracker.notes ? { notes: input.personalNotes } : {}),
            ...(input.contactInformation && !tracker.recruiterContact ? { recruiterContact: input.contactInformation } : {}),
          };
          if (Object.keys(trackerPatch).length) await tx.update(trackedApplications).set({ ...trackerPatch, updatedAt: new Date() }).where(eq(trackedApplications.id, tracker.id));
        }
        await tx.insert(opportunityActivities).values({ opportunityId: target.id, kind: 'duplicate_merged', title: 'Manual details merged', description: 'Only previously empty fields were filled; existing opportunity values were not overwritten.' });
      });
      const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, target.id)).limit(1);
      return NextResponse.json({ opportunity, merged: true, duplicateCandidates: duplicateMatches }, { status: 200 });
    }

    if (duplicateMatches.length && input.duplicateResolution !== 'dismiss') {
      return NextResponse.json({ error: 'Potential duplicates need your review before saving.', duplicateCandidates: duplicateMatches }, { status: 409 });
    }

    const [opportunity] = await db.transaction(async (tx) => {
      const [created] = await tx.insert(opportunities).values({
        title: input.title,
        slug: slugify(input.title),
        companyName: input.companyName,
        sourcePlatform: input.sourcePlatform || null,
        originType: 'MANUAL',
        discoveredAt: new Date(),
        originalListingUrl: input.originalListingUrl || null,
        applicationUrl: input.applicationUrl || null,
        description: input.description || null,
        requirements: input.requirements || null,
        location: input.location || null,
        workMode: input.workMode || null,
        employmentType: input.employmentType || null,
        experienceLevel: input.experienceLevel || null,
        salaryRange: input.salaryRange || null,
        currency: input.currency || null,
        applicationDeadline: input.applicationDeadline || null,
        requiredSkills: input.requiredSkills,
        status: 'open',
      }).returning();
      await tx.insert(trackedApplications).values({
        opportunityId: created.id,
        status: input.initialApplicationStatus,
        notes: input.personalNotes || null,
        recruiterContact: input.contactInformation || null,
        ...(input.initialApplicationStatus === 'APPLIED' ? { applicationDate: new Date().toISOString().slice(0, 10) } : {}),
      });
      await tx.insert(applicationStatusHistory).values({ opportunityId: created.id, fromStatus: null, toStatus: input.initialApplicationStatus, changeSource: 'manual', description: 'Initial application stage.' });
      if (input.initialApplicationStatus === 'APPLIED') {
        const day = new Date().toISOString().slice(0, 10);
        await tx.insert(dailyApplicationGoals).values({ day, target: 5, applied: 1 }).onConflictDoUpdate({ target: dailyApplicationGoals.day, set: { applied: sql`${dailyApplicationGoals.applied} + 1`, updatedAt: new Date() } });
      }
      if (input.originalListingUrl) await tx.insert(opportunityEvidence).values({ opportunityId: created.id, sourceUrl: input.originalListingUrl, sourceTitle: input.title, publisher: input.sourcePlatform || null, excerpt: input.description.slice(0, 1000), sourceType: input.entryMethod === 'url_import' ? 'ai_url_import' : 'manual' });
      await tx.insert(opportunityActivities).values({
        opportunityId: created.id,
        kind: input.entryMethod === 'url_import' ? 'ai_research' : 'manual_creation',
        title: input.entryMethod === 'url_import' ? 'URL research reviewed and saved' : 'Opportunity created manually',
        description: input.entryMethod === 'url_import' ? 'Extracted fields were reviewed and saved by the user.' : 'Manually entered opportunity details.',
      });
      if (input.duplicateResolution === 'dismiss' && duplicateMatches.length) await tx.insert(opportunityActivities).values({ opportunityId: created.id, kind: 'duplicate_dismissed', title: 'Potential duplicate dismissed', description: `User chose to save this as a separate record after reviewing ${duplicateMatches.length} potential duplicate${duplicateMatches.length === 1 ? '' : 's'}.` });
      return [created];
    });
    return NextResponse.json({ opportunity, duplicateCandidates: duplicateMatches }, { status: 201 });
  }

  const research = ResearchInput.safeParse(raw);
  try {
    if (research.success) {
      try { await assertPublicHttpsUrl(research.data.sourceUrl); }
      catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'This URL cannot be researched.' }, { status: 400 }); }
      const [run] = await db.insert(researchRuns).values({ query: research.data.sourceUrl, status: 'running', provider: process.env.AI_PROVIDER ?? 'openai' }).returning();
      try {
        const result = await researchOpportunity(research.data);
        if (!result.analyses.length) {
          await db.update(researchRuns).set({ status: 'completed', resultCount: 0 }).where(eq(researchRuns.id, run.id));
          return NextResponse.json({ opportunities: [], count: 0, sourceUrl: research.data.sourceUrl }, { status: 200 });
        }
        const analyzedDuplicates = await Promise.all(result.analyses.map(async (analysis) => ({
          analysis,
          matches: await duplicateCandidates({ title: analysis.title, companyName: analysis.company, originalListingUrl: research.data.sourceUrl, applicationUrl: analysis.applicationUrl }),
        })));
        const unresolvedDuplicates = analyzedDuplicates.flatMap(({ analysis, matches }) => {
          if (matches.some((candidate) => candidate.reason === 'matching_url' && candidate.identityMatches)) return [];
          return matches.map((candidate) => ({ ...candidate, incomingTitle: analysis.title, incomingCompany: analysis.company ?? '' }));
        });
        if (unresolvedDuplicates.length) {
          await db.update(researchRuns).set({ status: 'completed', resultCount: result.analyses.length }).where(eq(researchRuns.id, run.id));
          return NextResponse.json({ error: 'Potential duplicates need review. Use Add Opportunity → Import from URL to inspect, merge, or dismiss them.', duplicateCandidates: unresolvedDuplicates, sourceUrl: research.data.sourceUrl }, { status: 409 });
        }
        const saved = [];
        for (const { analysis, matches } of analyzedDuplicates) {
          const existing = matches.find((candidate) => candidate.reason === 'matching_url' && candidate.identityMatches);
          if (existing) {
            saved.push({ opportunity: existing, match: null, analysis, duplicate: true });
            continue;
          }
          const [opportunity] = await db.transaction(async (tx) => {
            const [created] = await tx.insert(opportunities).values({
              title: analysis.title,
              slug: slugify(analysis.title),
              companyName: analysis.company || null,
              sourcePlatform: sourceHost(research.data.sourceUrl) ?? 'Other',
              originType: 'MANUAL',
              discoveredAt: new Date(),
              originalListingUrl: research.data.sourceUrl,
              applicationUrl: analysis.applicationUrl || null,
              description: analysis.description,
              requirements: analysis.requirements || null,
              location: analysis.location || null,
              workMode: analysis.workMode || null,
              employmentType: analysis.employmentType || null,
              experienceLevel: analysis.experienceLevel || null,
              salaryRange: analysis.salaryRange || null,
              currency: analysis.currency || null,
              applicationDeadline: analysis.applicationDeadline || null,
              requiredSkills: analysis.requiredSkills,
              minYearsExperience: analysis.minYearsExperience ?? null,
            }).returning();
            await tx.insert(opportunityEvidence).values({ opportunityId: created.id, sourceUrl: research.data.sourceUrl, sourceTitle: analysis.title, publisher: sourceHost(research.data.sourceUrl) ?? null, excerpt: result.excerpt, sourceType: 'ai_url_import' });
            await tx.insert(trackedApplications).values({ opportunityId: created.id, status: 'SAVED' });
            await tx.insert(applicationStatusHistory).values({ opportunityId: created.id, fromStatus: null, toStatus: 'SAVED', changeSource: 'manual', description: 'Initial application stage.' });
            await tx.insert(opportunityActivities).values({ opportunityId: created.id, kind: 'ai_research', title: 'URL research reviewed and saved', description: 'AI extracted source details; the user initiated this import and reviewed the preview.' });
            return [created];
          });
          const match = research.data.profileId ? await saveMatch(opportunity.id, research.data.profileId, analysis.whyRelevant) : null;
          saved.push({ opportunity, match, analysis: { whyRelevant: analysis.whyRelevant, risks: analysis.risks, applicationUrl: analysis.applicationUrl }, duplicate: false });
        }
        await db.update(researchRuns).set({ status: 'completed', resultCount: saved.length }).where(eq(researchRuns.id, run.id));
        return NextResponse.json({ opportunities: saved, count: saved.filter((item) => !item.duplicate).length, sourceUrl: research.data.sourceUrl }, { status: 201 });
      } catch (error) {
        await db.update(researchRuns).set({ status: 'failed', error: error instanceof Error ? error.message : 'Research failed' }).where(eq(researchRuns.id, run.id));
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Research failed.' }, { status: 422 });
      }
    }

    const parsed = OpportunityInput.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid opportunity.' }, { status: 400 });
    if (!safeLinks(parsed.data.sourceUrl, parsed.data.applicationUrl) || !isRealDate(parsed.data.applicationDeadline)) return NextResponse.json({ error: 'Check that URLs use HTTPS and dates are valid.' }, { status: 400 });
    const companyName = parsed.data.companyName ?? parsed.data.company ?? '';
    const sourcePlatform = parsed.data.sourcePlatform ?? parsed.data.sourceName ?? sourceHost(parsed.data.sourceUrl) ?? 'Other';
    const duplicates = await duplicateCandidates({ title: parsed.data.title, companyName, originalListingUrl: parsed.data.sourceUrl, applicationUrl: parsed.data.applicationUrl });
    const exactUrlDuplicate = duplicates.find((candidate) => candidate.reason === 'matching_url' && candidate.identityMatches);
    if (exactUrlDuplicate) return NextResponse.json({ opportunity: exactUrlDuplicate, duplicate: true }, { status: 200 });
    if (duplicates.length) return NextResponse.json({ error: 'Potential duplicate needs review before this opportunity can be saved. Review it through Add Opportunity.', duplicateCandidates: duplicates }, { status: 409 });
    const [opportunity] = await db.transaction(async (tx) => {
      const [created] = await tx.insert(opportunities).values({
        title: parsed.data.title,
        slug: slugify(parsed.data.title),
        description: parsed.data.description,
        companyName: companyName || null,
        sourcePlatform,
        originType: parsed.data.originType ?? 'AUTOMATED',
        discoveredAt: new Date(),
        originalListingUrl: parsed.data.sourceUrl || null,
        applicationUrl: parsed.data.applicationUrl || null,
        requirements: parsed.data.requirements || null,
        location: parsed.data.location || null,
        workMode: parsed.data.workMode || null,
        employmentType: parsed.data.employmentType || null,
        experienceLevel: parsed.data.experienceLevel || null,
        salaryRange: parsed.data.salaryRange || null,
        currency: parsed.data.currency || null,
        applicationDeadline: parsed.data.applicationDeadline || null,
        requiredSkills: parsed.data.requiredSkills,
        minYearsExperience: parsed.data.minYearsExperience ?? null,
      }).returning();
      await tx.insert(trackedApplications).values({ opportunityId: created.id, status: 'SAVED' });
      await tx.insert(applicationStatusHistory).values({ opportunityId: created.id, fromStatus: null, toStatus: 'SAVED', changeSource: 'automated', description: 'Initial application stage.' });
      if (parsed.data.sourceUrl) await tx.insert(opportunityEvidence).values({ opportunityId: created.id, sourceUrl: parsed.data.sourceUrl, sourceTitle: parsed.data.title, publisher: sourcePlatform, excerpt: parsed.data.description.slice(0, 1000) });
      await tx.insert(opportunityActivities).values({ opportunityId: created.id, kind: created.originType === 'MANUAL' ? 'manual_creation' : 'opportunity_discovered', title: created.originType === 'MANUAL' ? 'Opportunity created manually' : 'Opportunity discovered by a source', description: created.originType === 'MANUAL' ? 'Manually added to the workspace.' : 'Imported from a verified discovery source.' });
      return [created];
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    console.error('[admin/opportunities POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save opportunity.' }, { status: 500 });
  }
}
