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
// Research / discovery call external sites and an AI provider; give them room to finish.
export const maxDuration = 60;

type Db = (typeof import('@/lib/db'))['db'];

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const optionalUrl = z.string().trim().max(2048).url().or(z.literal('')).optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''));

/** Plain "save this opportunity" body (used by Save & score, automated sources, etc.). */
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

/** "Research this URL": a source URL and nothing that describes an opportunity itself. */
const ResearchInput = z.object({
  sourceUrl: z.string().trim().url(),
  notes: z.string().trim().max(2000).optional(),
  profileId: z.number().int().positive().optional(),
});
const PreviewInput = z.object({
  action: z.literal('preview_url'),
  sourceUrl: z.string().trim().url(),
  notes: z.string().trim().max(2000).optional(),
});
const DiscoveryInput = z.object({
  action: z.literal('discover'),
  profileId: z.number().int().positive(),
  categories: z.array(z.enum(['remote', 'freelance', 'internship', 'cofounder'])).min(1).max(4),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function admin(req?: NextRequest) {
  const session = await getSession();
  return Boolean(session.isAdmin && (!req || isSameOrigin(req)));
}

const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

const messageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

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

function safeLinks(...values: Array<string | undefined>) {
  return values.every((value) => isValidHttpsUrl(value));
}

const today = () => new Date().toISOString().slice(0, 10);

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

function bodyAction(raw: unknown): unknown {
  return raw && typeof raw === 'object' ? (raw as { action?: unknown }).action : undefined;
}

/**
 * A request is "research" only when it names a source URL and does NOT describe an opportunity.
 * Save & score sends a sourceUrl too (the job link) together with a title/description; that must
 * be saved, never routed into the slow fetch-and-AI research flow.
 */
function isResearchRequest(raw: unknown) {
  if (!raw || typeof raw !== 'object') return false;
  if ('title' in raw || 'description' in raw) return false;
  return ResearchInput.safeParse(raw).success;
}

/* -------------------------------------------------------------------------- */
/* GET                                                                        */
/* -------------------------------------------------------------------------- */

export async function GET() {
  if (!(await admin())) return fail('Unauthorized', 401);
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

/* -------------------------------------------------------------------------- */
/* POST handlers                                                              */
/* -------------------------------------------------------------------------- */

/** action: 'preview_url' — extract fields from a URL for review, saving nothing. */
async function handlePreviewUrl(db: Db, raw: unknown) {
  const parsed = PreviewInput.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Enter a valid HTTPS listing URL.', 400);
  try {
    await assertPublicHttpsUrl(parsed.data.sourceUrl);
  } catch (error) {
    return fail(messageOf(error, 'This URL cannot be researched.'), 400);
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
    await db.update(researchRuns).set({ status: 'failed', error: messageOf(error, 'URL preview failed') }).where(eq(researchRuns.id, run.id));
    return fail(messageOf(error, 'URL extraction failed.'), 422);
  }
}

/** action: 'discover' — live recommendations from the candidate profile; nothing is saved. */
async function handleDiscover(db: Db, raw: unknown) {
  const discovery = DiscoveryInput.safeParse(raw);
  if (!discovery.success) return fail(discovery.error.issues[0]?.message ?? 'Invalid discovery request.', 400);
  const [profile] = await db.select().from(candidateProfiles).where(eq(candidateProfiles.id, discovery.data.profileId)).limit(1);
  if (!profile) return fail('Save your candidate profile before discovering recommendations.', 400);
  const query = `Profile discovery: ${discovery.data.categories.join(', ')}`;
  const [run] = await db.insert(researchRuns).values({ query, status: 'running', provider: process.env.AI_PROVIDER ?? 'openai' }).returning();
  try {
    const result = await discoverOpportunityRecommendations(profile, discovery.data.categories);
    const resultCount = result.recommendations.length + result.cofounderDirections.length;
    await db.update(researchRuns).set({ status: 'completed', resultCount }).where(eq(researchRuns.id, run.id));
    return NextResponse.json(result);
  } catch (error) {
    await db.update(researchRuns).set({ status: 'failed', error: messageOf(error, 'Discovery failed') }).where(eq(researchRuns.id, run.id));
    return fail(messageOf(error, 'Discovery failed.'), 422);
  }
}

/** action: 'create_manual' — quick add / reviewed URL import, with duplicate merge or dismiss. */
async function handleCreateManual(db: Db, raw: unknown) {
  const parsed = ManualInput.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid opportunity.', 400);
  const input = parsed.data;
  if (!isRealDate(input.applicationDeadline)) return fail('Enter a valid application deadline.', 400);
  if (!safeLinks(input.originalListingUrl, input.applicationUrl)) return fail('Listing and application URLs must use HTTPS.', 400);
  const duplicateMatches = await duplicateCandidates({ title: input.title, companyName: input.companyName, originalListingUrl: input.originalListingUrl, applicationUrl: input.applicationUrl });

  if (input.duplicateResolution === 'merge') {
    const duplicate = duplicateMatches.find((row) => row.id === input.mergeTargetId);
    if (!duplicate) return fail('Select a valid potential duplicate to merge into.', 400);
    const [target] = await db.select().from(opportunities).where(eq(opportunities.id, duplicate.id)).limit(1);
    if (!target) return fail('The selected opportunity no longer exists.', 404);
    // Only fill fields that are still empty; never overwrite existing values.
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
    return fail('Potential duplicates need your review before saving.', 409, { duplicateCandidates: duplicateMatches });
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
      ...(input.initialApplicationStatus === 'APPLIED' ? { applicationDate: today() } : {}),
    });
    await tx.insert(applicationStatusHistory).values({ opportunityId: created.id, fromStatus: null, toStatus: input.initialApplicationStatus, changeSource: 'manual', description: 'Initial application stage.' });
    if (input.initialApplicationStatus === 'APPLIED') {
      const day = today();
      await tx.insert(dailyApplicationGoals).values({ day, target: 5, applied: 1 }).onConflictDoUpdate({ target: dailyApplicationGoals.day, set: { applied: sql`${dailyApplicationGoals.applied} + 1`, updatedAt: new Date() } });
    }
    if (input.originalListingUrl) await tx.insert(opportunityEvidence).values({ opportunityId: created.id, sourceUrl: input.originalListingUrl, sourceTitle: input.title, publisher: input.sourcePlatform || null, excerpt: input.description.slice(0, 1000), sourceType: input.entryMethod === 'url_import' ? 'ai_url_import' : 'manual' });
    await tx.insert(opportunityActivities).values({
      opportunityId: created.id,
      kind: input.entryMethod === 'url_import' ? 'ai_research' : 'manual_creation',
      title: input.entryMethod === 'url_import' ? 'URL research reviewed and saved' : 'Opportunity created manually',
      description: input.entryMethod === 'url_import' ? 'Extracted fields were reviewed and saved by the user.' : 'Manually entered opportunity details.',
    });
    if (input.duplicateResolution === 'dismiss' && duplicateMatches.length) {
      await tx.insert(opportunityActivities).values({ opportunityId: created.id, kind: 'duplicate_dismissed', title: 'Potential duplicate dismissed', description: `User chose to save this as a separate record after reviewing ${duplicateMatches.length} potential duplicate${duplicateMatches.length === 1 ? '' : 's'}.` });
    }
    return [created];
  });
  return NextResponse.json({ opportunity, duplicateCandidates: duplicateMatches }, { status: 201 });
}

/** No action, body is just a source URL — fetch it, extract with AI, save and (optionally) score. */
async function handleResearch(db: Db, input: z.infer<typeof ResearchInput>) {
  try { await assertPublicHttpsUrl(input.sourceUrl); }
  catch (error) { return fail(messageOf(error, 'This URL cannot be researched.'), 400); }

  const [run] = await db.insert(researchRuns).values({ query: input.sourceUrl, status: 'running', provider: process.env.AI_PROVIDER ?? 'openai' }).returning();
  try {
    const result = await researchOpportunity(input);
    if (!result.analyses.length) {
      await db.update(researchRuns).set({ status: 'completed', resultCount: 0 }).where(eq(researchRuns.id, run.id));
      return NextResponse.json({ opportunities: [], count: 0, sourceUrl: input.sourceUrl }, { status: 200 });
    }

    const analyzedDuplicates = await Promise.all(result.analyses.map(async (analysis) => ({
      analysis,
      matches: await duplicateCandidates({ title: analysis.title, companyName: analysis.company, originalListingUrl: input.sourceUrl, applicationUrl: analysis.applicationUrl }),
    })));
    const unresolvedDuplicates = analyzedDuplicates.flatMap(({ analysis, matches }) => {
      if (matches.some((candidate) => candidate.reason === 'matching_url' && candidate.identityMatches)) return [];
      return matches.map((candidate) => ({ ...candidate, incomingTitle: analysis.title, incomingCompany: analysis.company ?? '' }));
    });
    if (unresolvedDuplicates.length) {
      await db.update(researchRuns).set({ status: 'completed', resultCount: result.analyses.length }).where(eq(researchRuns.id, run.id));
      return fail('Potential duplicates need review. Use Add Opportunity → Import from URL to inspect, merge, or dismiss them.', 409, { duplicateCandidates: unresolvedDuplicates, sourceUrl: input.sourceUrl });
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
          sourcePlatform: sourceHost(input.sourceUrl) ?? 'Other',
          originType: 'MANUAL',
          discoveredAt: new Date(),
          originalListingUrl: input.sourceUrl,
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
        await tx.insert(opportunityEvidence).values({ opportunityId: created.id, sourceUrl: input.sourceUrl, sourceTitle: analysis.title, publisher: sourceHost(input.sourceUrl) ?? null, excerpt: result.excerpt, sourceType: 'ai_url_import' });
        await tx.insert(trackedApplications).values({ opportunityId: created.id, status: 'SAVED' });
        await tx.insert(applicationStatusHistory).values({ opportunityId: created.id, fromStatus: null, toStatus: 'SAVED', changeSource: 'manual', description: 'Initial application stage.' });
        await tx.insert(opportunityActivities).values({ opportunityId: created.id, kind: 'ai_research', title: 'URL research reviewed and saved', description: 'AI extracted source details; the user initiated this import and reviewed the preview.' });
        return [created];
      });
      const match = input.profileId ? await saveMatch(opportunity.id, input.profileId, analysis.whyRelevant) : null;
      saved.push({ opportunity, match, analysis: { whyRelevant: analysis.whyRelevant, risks: analysis.risks, applicationUrl: analysis.applicationUrl }, duplicate: false });
    }
    await db.update(researchRuns).set({ status: 'completed', resultCount: saved.length }).where(eq(researchRuns.id, run.id));
    return NextResponse.json({ opportunities: saved, count: saved.filter((item) => !item.duplicate).length, sourceUrl: input.sourceUrl }, { status: 201 });
  } catch (error) {
    await db.update(researchRuns).set({ status: 'failed', error: messageOf(error, 'Research failed') }).where(eq(researchRuns.id, run.id));
    return fail(messageOf(error, 'Research failed.'), 422);
  }
}

/** No action, body describes an opportunity — save it directly (this is what Save & score sends). */
async function handleSave(db: Db, raw: unknown) {
  const parsed = OpportunityInput.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Invalid opportunity.', 400);
  const data = parsed.data;
  if (!safeLinks(data.sourceUrl, data.applicationUrl) || !isRealDate(data.applicationDeadline)) return fail('Check that URLs use HTTPS and dates are valid.', 400);

  const companyName = data.companyName ?? data.company ?? '';
  const sourcePlatform = data.sourcePlatform ?? data.sourceName ?? sourceHost(data.sourceUrl) ?? 'Other';
  const duplicates = await duplicateCandidates({ title: data.title, companyName, originalListingUrl: data.sourceUrl, applicationUrl: data.applicationUrl });

  // Same listing already saved: return it so the caller can carry on (e.g. score it).
  const exactUrlDuplicate = duplicates.find((candidate) => candidate.reason === 'matching_url' && candidate.identityMatches);
  if (exactUrlDuplicate) return NextResponse.json({ opportunity: exactUrlDuplicate, duplicate: true }, { status: 200 });
  if (duplicates.length) return fail('Potential duplicate needs review before this opportunity can be saved. Review it through Add Opportunity.', 409, { duplicateCandidates: duplicates });

  const [opportunity] = await db.transaction(async (tx) => {
    const [created] = await tx.insert(opportunities).values({
      title: data.title,
      slug: slugify(data.title),
      description: data.description,
      companyName: companyName || null,
      sourcePlatform,
      originType: data.originType ?? 'AUTOMATED',
      discoveredAt: new Date(),
      originalListingUrl: data.sourceUrl || null,
      applicationUrl: data.applicationUrl || null,
      requirements: data.requirements || null,
      location: data.location || null,
      workMode: data.workMode || null,
      employmentType: data.employmentType || null,
      experienceLevel: data.experienceLevel || null,
      salaryRange: data.salaryRange || null,
      currency: data.currency || null,
      applicationDeadline: data.applicationDeadline || null,
      requiredSkills: data.requiredSkills,
      minYearsExperience: data.minYearsExperience ?? null,
    }).returning();
    await tx.insert(trackedApplications).values({ opportunityId: created.id, status: 'SAVED' });
    await tx.insert(applicationStatusHistory).values({ opportunityId: created.id, fromStatus: null, toStatus: 'SAVED', changeSource: 'automated', description: 'Initial application stage.' });
    if (data.sourceUrl) await tx.insert(opportunityEvidence).values({ opportunityId: created.id, sourceUrl: data.sourceUrl, sourceTitle: data.title, publisher: sourcePlatform, excerpt: data.description.slice(0, 1000) });
    await tx.insert(opportunityActivities).values({
      opportunityId: created.id,
      kind: created.originType === 'MANUAL' ? 'manual_creation' : 'opportunity_discovered',
      title: created.originType === 'MANUAL' ? 'Opportunity created manually' : 'Opportunity discovered by a source',
      description: created.originType === 'MANUAL' ? 'Manually added to the workspace.' : 'Imported from a verified discovery source.',
    });
    return [created];
  });
  return NextResponse.json({ opportunity }, { status: 201 });
}

/* -------------------------------------------------------------------------- */
/* POST dispatcher                                                            */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  if (!(await admin(req))) return fail('Unauthorized', 401);
  const { db } = await import('@/lib/db');
  const raw = await req.json().catch(() => null);

  try {
    switch (bodyAction(raw)) {
      case 'preview_url':
        return await handlePreviewUrl(db, raw);
      case 'discover':
        return await handleDiscover(db, raw);
      case 'create_manual':
        return await handleCreateManual(db, raw);
      default:
        // Legacy, action-less bodies: URL-only means research, anything describing an opportunity means save.
        if (isResearchRequest(raw)) return await handleResearch(db, ResearchInput.parse(raw));
        return await handleSave(db, raw);
    }
  } catch (error) {
    console.error('[admin/opportunities POST]', error);
    return fail(messageOf(error, 'Failed to save opportunity.'), 500);
  }
}
