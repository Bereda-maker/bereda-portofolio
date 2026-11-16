import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { canTransitionStatus, HACKATHON_STATUSES, defaultScore, discoverHackathons, approvedHackathonSources, canonicalSourceIdentity, normalizeUrl, HACKATHON_SOURCES } from '@/lib/hackathons';
import { hackathonEvidence, hackathonMatches, hackathonProfiles, hackathonStartupProfiles, hackathons, savedHackathons } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ownerKey = 'admin';
async function admin() { const session = await getSession(); return session.isAdmin === true; }
async function ensureProfile() { const { db } = await import('@/lib/db'); const [existing] = await db.select().from(hackathonProfiles).where(eq(hackathonProfiles.ownerKey, ownerKey)).limit(1); if (existing) return existing; const [created] = await db.insert(hackathonProfiles).values({ ownerKey, name: 'Bereda Wako', skills: ['software engineering', 'product', 'AI'], interests: ['startups', 'education', 'community'], experienceLevel: 'advanced', location: 'Ethiopia' }).returning(); return created; }

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db');
    const [profile, startupProfiles, opportunities, saved] = await Promise.all([
      ensureProfile(),
      db.select().from(hackathonStartupProfiles).where(eq(hackathonStartupProfiles.active, true)).orderBy(hackathonStartupProfiles.id),
      db.select().from(hackathons).orderBy(desc(hackathons.updatedAt)).limit(100),
      db.select().from(savedHackathons).where(eq(savedHackathons.ownerKey, ownerKey)).orderBy(desc(savedHackathons.updatedAt)),
    ]);
    const [matches, evidence] = await Promise.all([
      db.select().from(hackathonMatches).where(eq(hackathonMatches.profileId, profile.id)),
      db.select().from(hackathonEvidence).orderBy(desc(hackathonEvidence.capturedAt)).limit(300),
    ]);
    return NextResponse.json({ profile, startupProfiles, hackathons: opportunities, saved, matches, evidence, sourceStatuses: HACKATHON_SOURCES.map((source) => ({ ...source, status: source.mode === 'verified_api' ? 'verified_api' : 'browse_only' })) });
  } catch (error) { console.error('[admin/hackathons GET]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Hackathons database is unavailable. Apply migrations 0015_hackathons.sql and the latest Hackathons migrations.' }, { status: 503 }); }
}

const ProfileInput = z.object({ name: z.string().trim().min(1).max(120), skills: z.array(z.string().trim().min(1).max(80)).max(40), interests: z.array(z.string().trim().min(1).max(80)).max(40), experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']), location: z.string().trim().max(120).optional().nullable(), accessibilityNeeds: z.array(z.string().trim().max(120)).max(20).default([]) });
const ManualFields = z.object({
  title: z.string().trim().max(240).default('Untitled hackathon draft'), organizer: z.string().trim().max(160).default('Organizer not specified'),
  description: z.string().trim().max(4000).default(''), detailedDescription: z.string().trim().max(12000).default(''), officialUrl: z.string().url().max(2048).nullable().optional(), registrationUrl: z.string().url().max(2048).nullable().optional(), sourceUrl: z.string().url().max(2048).nullable().optional(),
  format: z.enum(['online', 'hybrid', 'in_person', 'unknown']).default('unknown'), country: z.string().trim().max(120).default(''), city: z.string().trim().max(120).default(''), venue: z.string().trim().max(240).default(''), timezone: z.string().trim().max(80).default(''), startsAt: z.coerce.date().nullable().optional(), endsAt: z.coerce.date().nullable().optional(), deadline: z.coerce.date().nullable().optional(),
  technologies: z.array(z.string().trim().min(1).max(80)).max(40).default([]), requiredSkills: z.array(z.string().trim().min(1).max(80)).max(40).default([]), themes: z.array(z.string().trim().min(1).max(80)).max(30).default([]), teamSize: z.string().trim().max(80).default(''), experienceLevel: z.string().trim().max(80).default(''), countryEligibility: z.string().trim().max(300).default(''), eligibility: z.enum(['allowed', 'not_allowed', 'unknown']).default('unknown'),
  firstPrize: z.string().trim().max(500).default(''), otherPrizes: z.string().trim().max(2000).default(''), totalPrizePool: z.string().trim().max(240).default(''), mentorship: z.string().trim().max(2000).default(''), benefits: z.string().trim().max(2000).default(''),
  startupProfileId: z.number().int().positive().nullable().optional(), personalNotes: z.string().trim().max(4000).default(''), whyInteresting: z.string().trim().max(4000).default(''), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'), entryStatus: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
});
const ManualCreateInput = z.object({ action: z.literal('manual_create'), fields: ManualFields });
const ManualUpdateInput = z.object({ action: z.literal('manual_update'), id: z.number().int().positive(), fields: ManualFields });
const ManualDeleteInput = z.object({ action: z.literal('manual_delete'), id: z.number().int().positive() });
const ActionInput = z.discriminatedUnion('action', [
  ManualCreateInput, ManualUpdateInput, ManualDeleteInput,
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
    if (input.action === 'manual_create' || input.action === 'manual_update') {
      const fields = input.fields;
      if (fields.entryStatus === 'PUBLISHED' && fields.title.trim().length < 2) return NextResponse.json({ error: 'A published Hackathon needs a name.' }, { status: 400 });
      if (fields.entryStatus === 'PUBLISHED' && !fields.officialUrl) return NextResponse.json({ error: 'A published Hackathon needs an official website.' }, { status: 400 });
      const officialUrl = normalizeUrl(fields.officialUrl ?? '') || `https://manual.local/draft/${crypto.randomUUID()}`;
      const values = { ...fields, title: fields.title.trim() || 'Untitled hackathon draft', organizer: fields.organizer.trim() || 'Organizer not specified', officialUrl, registrationUrl: normalizeUrl(fields.registrationUrl ?? '') || null, sourceUrl: normalizeUrl(fields.sourceUrl ?? '') || null, description: fields.description || null, detailedDescription: fields.detailedDescription || null, country: fields.country || null, city: fields.city || null, venue: fields.venue || null, timezone: fields.timezone || null, startsAt: fields.startsAt ?? null, endsAt: fields.endsAt ?? null, deadline: fields.deadline ?? null, countryEligibility: fields.countryEligibility || null, firstPrize: fields.firstPrize || null, otherPrizes: fields.otherPrizes || null, totalPrizePool: fields.totalPrizePool || null, mentorship: fields.mentorship || null, benefits: fields.benefits || null, teamSize: fields.teamSize || null, experienceLevel: fields.experienceLevel || null, technologies: fields.technologies, requiredSkills: fields.requiredSkills, themes: [...new Set([...fields.themes, ...fields.technologies, ...fields.requiredSkills])].slice(0, 30), teamRequirements: fields.teamSize || null, prize: fields.firstPrize || fields.totalPrizePool || null, location: [fields.city, fields.venue].filter(Boolean).join(', ') || null, originType: 'MANUAL', entryStatus: fields.entryStatus, startupProfileId: fields.startupProfileId ?? null, personalNotes: fields.personalNotes || null, whyInteresting: fields.whyInteresting || null, priority: fields.priority, verificationState: 'unknown', verifiedAt: null, updatedAt: new Date() };
      const [row] = input.action === 'manual_create' ? await db.insert(hackathons).values({ ...values, canonicalUrl: officialUrl }).returning() : await db.update(hackathons).set({ ...values, canonicalUrl: officialUrl }).where(eq(hackathons.id, input.id)).returning();
      if (!row) return NextResponse.json({ error: 'Hackathon entry not found.' }, { status: 404 });
      const profile = await ensureProfile();
      const scoring = defaultScore({ eligibility: fields.eligibility, format: fields.format, themes: values.themes }, { skills: profile.skills, interests: profile.interests, startupThemes: fields.themes, experienceLevel: profile.experienceLevel as 'beginner' | 'intermediate' | 'advanced', location: profile.location ?? undefined, accessibilityNeeds: profile.accessibilityNeeds });
      await db.insert(hackathonMatches).values({ hackathonId: row.id, profileId: profile.id, startupProfileId: fields.startupProfileId ?? null, score: scoring.total, breakdown: scoring, explanation: 'Deterministic match from administrator-entered fields. No unknown field was treated as verified.' }).onConflictDoNothing();
      return NextResponse.json({ hackathon: row });
    }
    if (input.action === 'manual_delete') { const [row] = await db.delete(hackathons).where(eq(hackathons.id, input.id)).returning({ id: hackathons.id, originType: hackathons.originType }); if (!row) return NextResponse.json({ error: 'Hackathon entry not found.' }, { status: 404 }); return NextResponse.json({ ok: true, deleted: row }); }
    if (input.action === 'profile') { const current = await ensureProfile(); const [profile] = await db.update(hackathonProfiles).set({ ...input.profile, updatedAt: new Date() }).where(eq(hackathonProfiles.id, current.id)).returning(); return NextResponse.json({ profile }); }
    if (input.action === 'discover') {
      const profile = await ensureProfile();
      const selected = input.sourceUrls?.length ? HACKATHON_SOURCES.filter((source) => input.sourceUrls!.includes(source.url)) : [...HACKATHON_SOURCES];
      const startupRows = await db.select().from(hackathonStartupProfiles).where(eq(hackathonStartupProfiles.active, true));
      const selectedThemes = [...new Set([...(input.startupThemes ?? []), ...startupRows.filter((row) => !input.startupProfileIds || input.startupProfileIds.includes(row.id)).flatMap((row) => row.themes)])];
      const angelSources = selected.filter((source) => source.id === 'angelhack');
      const angel = await discoverHackathons(angelSources.map((source) => source.url));
      const sourceStatuses = selected.map((source) => ({ sourceId: source.id, sourceName: source.name, status: source.mode === 'verified_api' ? 'verified_api' : 'browse_only', candidates: source.id === 'angelhack' ? angel.candidates.length : 0 }));
      const persisted = [];
      for (const candidate of angel.candidates) {
        const verified = Boolean(candidate.evidenceExcerpt);
        const [row] = await db.insert(hackathons).values({ ...candidate, canonicalUrl: canonicalSourceIdentity(candidate.officialUrl, candidate.registrationUrl), registrationUrl: candidate.registrationUrl ?? null, description: candidate.description ?? null, location: candidate.location ?? null, countryEligibility: candidate.countryEligibility ?? null, deadline: candidate.deadline ?? null, startsAt: candidate.startsAt ?? null, endsAt: candidate.endsAt ?? null, prize: candidate.prize ?? null, cost: candidate.cost ?? null, teamRequirements: candidate.teamRequirements ?? null, verificationState: verified ? 'verified' : 'unknown', verifiedAt: verified ? (candidate.capturedAt ?? new Date()) : null }).onConflictDoUpdate({ target: hackathons.canonicalUrl, set: { title: candidate.title, description: candidate.description ?? null, organizer: candidate.organizer, officialUrl: candidate.officialUrl, verificationState: verified ? 'verified' : 'unknown', verifiedAt: verified ? (candidate.capturedAt ?? new Date()) : null, updatedAt: new Date() } }).returning();
        if (!row) continue;
        await db.insert(hackathonEvidence).values({ hackathonId: row.id, sourceUrl: candidate.officialUrl, sourceTitle: candidate.sourceTitle ?? null, publisher: candidate.publisher ?? null, excerpt: candidate.evidenceExcerpt ?? null, verificationState: verified ? 'verified' : 'unknown' }).catch(() => undefined);
        const scoring = defaultScore(candidate, { skills: profile.skills, interests: profile.interests, startupThemes: selectedThemes, experienceLevel: profile.experienceLevel as 'beginner' | 'intermediate' | 'advanced', location: profile.location ?? undefined, accessibilityNeeds: profile.accessibilityNeeds });
        await db.insert(hackathonMatches).values({ hackathonId: row.id, profileId: profile.id, score: scoring.total, breakdown: scoring, explanation: 'Deterministic score from profile overlap and explicitly captured fields; unknown fields are not treated as verified.' }).onConflictDoNothing(); persisted.push(row);
      }
      return NextResponse.json({ hackathons: persisted, warnings: angel.warnings, sourceStatuses, sourceRegistry: approvedHackathonSources() });
    }
    if (input.action === 'save') { const [row] = await db.insert(savedHackathons).values({ ownerKey, hackathonId: input.hackathonId }).onConflictDoNothing().returning(); return NextResponse.json({ saved: row ?? null }); }
    if (input.action === 'unsave') { await db.delete(savedHackathons).where(and(eq(savedHackathons.ownerKey, ownerKey), eq(savedHackathons.hackathonId, input.hackathonId))); return NextResponse.json({ ok: true }); }
    const existing = (await db.select().from(savedHackathons).where(and(eq(savedHackathons.id, input.id), eq(savedHackathons.ownerKey, ownerKey))).limit(1))[0]; if (!existing) return NextResponse.json({ error: 'Saved Hackathon not found.' }, { status: 404 });
    if (input.action === 'tracking') { if (input.status && !canTransitionStatus(existing.status as typeof HACKATHON_STATUSES[number], input.status)) return NextResponse.json({ error: `Cannot move status from ${existing.status} to ${input.status}.` }, { status: 400 }); const [row] = await db.update(savedHackathons).set({ ...(input.status ? { status: input.status } : {}), ...(input.notes !== undefined ? { notes: input.notes || null } : {}), ...(input.applicationDetails !== undefined ? { applicationDetails: input.applicationDetails || null } : {}), ...(input.projectIdea !== undefined ? { projectIdea: input.projectIdea || null } : {}), ...(input.teamInfo !== undefined ? { teamInfo: input.teamInfo || null } : {}), ...(input.userDeadline !== undefined ? { userDeadline: input.userDeadline } : {}), updatedAt: new Date() }).where(eq(savedHackathons.id, input.id)).returning(); return NextResponse.json({ saved: row }); }
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error) { console.error('[admin/hackathons POST]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Could not complete Hackathons action. Confirm the migrations and database connection.' }, { status: 503 }); }
}
