import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { canTransitionStatus, HACKATHON_STATUSES, defaultScore, discoverHackathons, approvedHackathonSources, canonicalSourceIdentity, HACKATHON_SOURCES } from '@/lib/hackathons';
import { createSerpApiProvider, serpApiStatus, type SearchContext } from '@/lib/services/hackathon-search-provider';
import { hackathonEvidence, hackathonMatches, hackathonProfiles, hackathonSearchCache, hackathonSearchUsage, hackathonStartupProfiles, hackathons, savedHackathons } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ownerKey = 'admin';
async function admin() { const session = await getSession(); return session.isAdmin === true; }
async function ensureProfile() { const { db } = await import('@/lib/db'); const [existing] = await db.select().from(hackathonProfiles).where(eq(hackathonProfiles.ownerKey, ownerKey)).limit(1); if (existing) return existing; const [created] = await db.insert(hackathonProfiles).values({ ownerKey, name: 'Bereda Wako', skills: ['software engineering', 'product', 'AI'], interests: ['startups', 'education', 'community'], experienceLevel: 'advanced', location: 'Ethiopia' }).returning(); return created; }

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db');
    const [profile, startupProfiles, opportunities, saved, usage] = await Promise.all([
      ensureProfile(),
      db.select().from(hackathonStartupProfiles).where(eq(hackathonStartupProfiles.active, true)).orderBy(hackathonStartupProfiles.id),
      db.select().from(hackathons).orderBy(desc(hackathons.updatedAt)).limit(100),
      db.select().from(savedHackathons).where(eq(savedHackathons.ownerKey, ownerKey)).orderBy(desc(savedHackathons.updatedAt)),
      db.select().from(hackathonSearchUsage).orderBy(desc(hackathonSearchUsage.createdAt)).limit(10),
    ]);
    const [matches, evidence] = await Promise.all([
      db.select().from(hackathonMatches).where(eq(hackathonMatches.profileId, profile.id)),
      db.select().from(hackathonEvidence).orderBy(desc(hackathonEvidence.capturedAt)).limit(300),
    ]);
    return NextResponse.json({ profile, startupProfiles, hackathons: opportunities, saved, matches, evidence, provider: { serpapi: serpApiStatus() }, recentUsage: usage, sourceStatuses: HACKATHON_SOURCES.map((source) => ({ ...source, serpapi: serpApiStatus().configured ? 'enabled' : 'not_configured' })) });
  } catch (error) { console.error('[admin/hackathons GET]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Hackathons database is unavailable. Apply migrations 0015_hackathons.sql and 0016_hackathon_serpapi.sql.' }, { status: 503 }); }
}

const ProfileInput = z.object({ name: z.string().trim().min(1).max(120), skills: z.array(z.string().trim().min(1).max(80)).max(40), interests: z.array(z.string().trim().min(1).max(80)).max(40), experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']), location: z.string().trim().max(120).optional().nullable(), accessibilityNeeds: z.array(z.string().trim().max(120)).max(20).default([]) });
const ActionInput = z.discriminatedUnion('action', [
  z.object({ action: z.literal('discover'), sourceUrls: z.array(z.string().url()).max(12).optional(), startupProfileIds: z.array(z.number().int().positive()).max(5).optional(), startupThemes: z.array(z.string().trim().max(80)).max(30).optional() }),
  z.object({ action: z.literal('save'), hackathonId: z.number().int().positive() }), z.object({ action: z.literal('unsave'), hackathonId: z.number().int().positive() }), z.object({ action: z.literal('profile'), profile: ProfileInput }),
  z.object({ action: z.literal('tracking'), id: z.number().int().positive(), status: z.enum(HACKATHON_STATUSES).optional(), notes: z.string().max(4000).optional(), applicationDetails: z.string().max(2000).optional(), projectIdea: z.string().max(2000).optional(), teamInfo: z.string().max(1000).optional(), userDeadline: z.coerce.date().nullable().optional() }),
]);

export async function POST(req: NextRequest) {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = ActionInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid Hackathons request.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db'); const input = parsed.data;
    if (input.action === 'profile') { const current = await ensureProfile(); const [profile] = await db.update(hackathonProfiles).set({ ...input.profile, updatedAt: new Date() }).where(eq(hackathonProfiles.id, current.id)).returning(); return NextResponse.json({ profile }); }
    if (input.action === 'discover') {
      const profile = await ensureProfile();
      const selected = input.sourceUrls?.length ? HACKATHON_SOURCES.filter((source) => input.sourceUrls!.includes(source.url)) : [...HACKATHON_SOURCES];
      const startupRows = await db.select().from(hackathonStartupProfiles).where(eq(hackathonStartupProfiles.active, true));
      const selectedThemes = [...new Set([...(input.startupThemes ?? []), ...startupRows.filter((row) => !input.startupProfileIds || input.startupProfileIds.includes(row.id)).flatMap((row) => row.themes)])];
      const angelSources = selected.filter((source) => source.id === 'angelhack');
      const angel = await discoverHackathons(angelSources.map((source) => source.url));
      const cache = { get: async (cacheKey: string) => { const [row] = await db.select({ results: hackathonSearchCache.results, expiresAt: hackathonSearchCache.expiresAt }).from(hackathonSearchCache).where(eq(hackathonSearchCache.cacheKey, cacheKey)).limit(1); return row && row.expiresAt > new Date() ? row.results as Array<{ title?: string; link?: string; snippet?: string; displayed_link?: string }> : null; }, set: async (cacheKey: string, value: { sourceId: string; query: string; context: SearchContext; results: Array<{ title?: string; link?: string; snippet?: string; displayed_link?: string }>; expiresAt: Date }) => { await db.insert(hackathonSearchCache).values({ cacheKey, sourceId: value.sourceId, query: value.query, context: value.context, results: value.results, expiresAt: value.expiresAt, updatedAt: new Date() }).onConflictDoUpdate({ target: hackathonSearchCache.cacheKey, set: { query: value.query, context: value.context, results: value.results, expiresAt: value.expiresAt, updatedAt: new Date() } }); } };
      const serp = serpApiStatus().configured ? await createSerpApiProvider({ cache }).discover(selected, { skills: profile.skills, startupThemes: selectedThemes }) : { candidates: [], warnings: ['SerpApi is not configured; no search results were fabricated. Set SERPAPI_API_KEY server-side to enable the 12 bounded searches.'], searches: 0, cacheHits: 0, usage: { provider: 'serpapi' as const, searches: 0, cacheHits: 0, officialPagesFetched: 0, leads: 0 }, sourceStatuses: selected.map((source) => ({ sourceId: source.id, sourceName: source.name, status: 'not_configured' as const, candidates: 0 })) };
      const warnings = [...angel.warnings, ...serp.warnings];
      await db.insert(hackathonSearchUsage).values({ provider: 'serpapi', status: serpApiStatus().configured ? (serp.warnings.length ? 'completed_with_warnings' : 'completed') : 'not_configured', searchCount: serp.searches, cacheHits: serp.cacheHits, officialPagesFetched: serp.usage.officialPagesFetched, leadCount: serp.usage.leads, sourceStatuses: serp.sourceStatuses, error: warnings.length ? warnings.slice(0, 3).join(' ') : null }).catch(() => undefined);
      const persisted = [];
      for (const candidate of [...angel.candidates, ...serp.candidates]) {
        const verified = Boolean(candidate.evidenceExcerpt);
        const [row] = await db.insert(hackathons).values({ ...candidate, canonicalUrl: canonicalSourceIdentity(candidate.officialUrl, candidate.registrationUrl), registrationUrl: candidate.registrationUrl ?? null, description: candidate.description ?? null, location: candidate.location ?? null, countryEligibility: candidate.countryEligibility ?? null, deadline: candidate.deadline ?? null, startsAt: candidate.startsAt ?? null, endsAt: candidate.endsAt ?? null, prize: candidate.prize ?? null, cost: candidate.cost ?? null, teamRequirements: candidate.teamRequirements ?? null, verificationState: verified ? 'verified' : 'unknown', verifiedAt: verified ? (candidate.capturedAt ?? new Date()) : null }).onConflictDoUpdate({ target: hackathons.canonicalUrl, set: { title: candidate.title, description: candidate.description ?? null, organizer: candidate.organizer, officialUrl: candidate.officialUrl, verificationState: verified ? 'verified' : 'unknown', verifiedAt: verified ? (candidate.capturedAt ?? new Date()) : null, updatedAt: new Date() } }).returning();
        if (!row) continue;
        await db.insert(hackathonEvidence).values({ hackathonId: row.id, sourceUrl: candidate.officialUrl, sourceTitle: candidate.sourceTitle ?? null, publisher: candidate.publisher ?? null, excerpt: candidate.evidenceExcerpt ?? null, verificationState: verified ? 'verified' : 'unknown' }).catch(() => undefined);
        const scoring = defaultScore(candidate, { skills: profile.skills, interests: profile.interests, startupThemes: selectedThemes, experienceLevel: profile.experienceLevel as 'beginner' | 'intermediate' | 'advanced', location: profile.location ?? undefined, accessibilityNeeds: profile.accessibilityNeeds });
        await db.insert(hackathonMatches).values({ hackathonId: row.id, profileId: profile.id, score: scoring.total, breakdown: scoring, explanation: 'Deterministic score from profile overlap and explicitly captured fields; unknown fields are not treated as verified.' }).onConflictDoNothing(); persisted.push(row);
      }
      return NextResponse.json({ hackathons: persisted, warnings, searches: serp.searches, cacheHits: serp.cacheHits, sourceStatuses: serp.sourceStatuses, provider: { serpapi: serpApiStatus() }, sourceRegistry: approvedHackathonSources() });
    }
    if (input.action === 'save') { const [row] = await db.insert(savedHackathons).values({ ownerKey, hackathonId: input.hackathonId }).onConflictDoNothing().returning(); return NextResponse.json({ saved: row ?? null }); }
    if (input.action === 'unsave') { await db.delete(savedHackathons).where(and(eq(savedHackathons.ownerKey, ownerKey), eq(savedHackathons.hackathonId, input.hackathonId))); return NextResponse.json({ ok: true }); }
    const existing = (await db.select().from(savedHackathons).where(and(eq(savedHackathons.id, input.id), eq(savedHackathons.ownerKey, ownerKey))).limit(1))[0]; if (!existing) return NextResponse.json({ error: 'Saved Hackathon not found.' }, { status: 404 });
    if (input.action === 'tracking') { if (input.status && !canTransitionStatus(existing.status as typeof HACKATHON_STATUSES[number], input.status)) return NextResponse.json({ error: `Cannot move status from ${existing.status} to ${input.status}.` }, { status: 400 }); const [row] = await db.update(savedHackathons).set({ ...(input.status ? { status: input.status } : {}), ...(input.notes !== undefined ? { notes: input.notes || null } : {}), ...(input.applicationDetails !== undefined ? { applicationDetails: input.applicationDetails || null } : {}), ...(input.projectIdea !== undefined ? { projectIdea: input.projectIdea || null } : {}), ...(input.teamInfo !== undefined ? { teamInfo: input.teamInfo || null } : {}), ...(input.userDeadline !== undefined ? { userDeadline: input.userDeadline } : {}), updatedAt: new Date() }).where(eq(savedHackathons.id, input.id)).returning(); return NextResponse.json({ saved: row }); }
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error) { console.error('[admin/hackathons POST]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Could not complete Hackathons action. Confirm the migrations and database connection.' }, { status: 503 }); }
}
