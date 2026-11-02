import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { buildUsageLedgerEntry, calculateMentorshipPrice } from '@/lib/services/mentorship';
import { mentorshipProfiles, mentorshipSessions, mentorshipUsageLedger } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

class RouteError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

const ProfileFields = {
  name: z.string().trim().min(1).max(140),
  email: z.union([z.string().trim().email().max(200), z.literal('')]).optional(),
  bio: z.string().trim().max(4000).optional().default(''),
  specialties: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  timezone: z.string().trim().min(1).max(80),
  defaultRateCentsPerMinute: z.number().int().min(0).max(1_000_000),
  isActive: z.boolean(),
};

const Action = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save_profile'), id: z.coerce.number().int().positive().optional(), ...ProfileFields }),
  z.object({ action: z.literal('create_session'), profileId: z.coerce.number().int().positive(), menteeEmail: z.string().trim().email().max(200), startsAt: z.string().datetime(), plannedMinutes: z.number().int().positive().max(720), notes: z.string().trim().max(2000).optional().default(''), externalReference: z.string().trim().max(240).optional().default('') }),
  z.object({ action: z.literal('complete_session'), sessionId: z.coerce.number().int().positive(), actualMinutes: z.number().int().positive().max(1440) }),
  z.object({ action: z.literal('cancel_session'), sessionId: z.coerce.number().int().positive() }),
  z.object({ action: z.literal('grant_allowance'), profileId: z.coerce.number().int().positive(), menteeEmail: z.string().trim().email().max(200), minutes: z.number().int().positive().max(100_000), note: z.string().trim().max(500).optional().default('') }),
]);

function buildBalances(profiles: Array<typeof mentorshipProfiles.$inferSelect>, sessions: Array<typeof mentorshipSessions.$inferSelect>, ledger: Array<typeof mentorshipUsageLedger.$inferSelect>) {
  const names = new Map(profiles.map((profile) => [profile.id, profile.name]));
  const balances = new Map<string, { profileId: number; mentorName: string; menteeEmail: string; grantedMinutes: number; usedMinutes: number; remainingMinutes: number; recordedCents: number }>();
  const ensure = (profileId: number, email: string) => {
    const normalizedEmail = email.toLowerCase();
    const key = `${profileId}:${normalizedEmail}`;
    let row = balances.get(key);
    if (!row) {
      row = { profileId, mentorName: names.get(profileId) || 'Mentor', menteeEmail: normalizedEmail, grantedMinutes: 0, usedMinutes: 0, remainingMinutes: 0, recordedCents: 0 };
      balances.set(key, row);
    }
    return row;
  };
  for (const session of sessions) ensure(session.profileId, session.menteeEmail);
  for (const entry of ledger) {
    const row = ensure(entry.profileId, entry.menteeEmail);
    if (entry.entryType === 'credit') row.grantedMinutes += entry.minutes;
    if (entry.entryType === 'free_usage') row.usedMinutes += entry.minutes;
    if (entry.entryType === 'charge' || entry.entryType === 'adjustment') row.recordedCents += entry.amountCents;
  }
  for (const row of balances.values()) row.remainingMinutes = Math.max(0, row.grantedMinutes - row.usedMinutes);
  return [...balances.values()].sort((a, b) => a.menteeEmail.localeCompare(b.menteeEmail));
}

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db');
    const [profiles, sessions, ledger] = await Promise.all([
      db.select().from(mentorshipProfiles).orderBy(asc(mentorshipProfiles.name)),
      db.select().from(mentorshipSessions).orderBy(desc(mentorshipSessions.startsAt)).limit(500),
      db.select().from(mentorshipUsageLedger).orderBy(desc(mentorshipUsageLedger.createdAt)),
    ]);
    return NextResponse.json({ profiles, sessions, ledger: ledger.slice(0, 150), balances: buildBalances(profiles, sessions, ledger) });
  } catch (error) {
    console.error('[admin/mentorship] load failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Mentorship data could not be loaded. Confirm the database connection and migrations, then retry.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const parsed = Action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid mentorship request.' }, { status: 400 });

  try {
    const { db } = await import('@/lib/db');
    const input = parsed.data;

    if (input.action === 'save_profile') {
      const values = {
        name: input.name,
        email: input.email?.trim().toLowerCase() || null,
        bio: input.bio || null,
        specialties: input.specialties,
        timezone: input.timezone,
        defaultRateCentsPerMinute: input.defaultRateCentsPerMinute,
        isActive: input.isActive,
        updatedAt: new Date(),
      };
      const rows = input.id
        ? await db.update(mentorshipProfiles).set(values).where(eq(mentorshipProfiles.id, input.id)).returning()
        : await db.insert(mentorshipProfiles).values(values).returning();
      if (!rows[0]) throw new RouteError(404, 'Mentor profile not found.');
      return NextResponse.json({ profile: rows[0] });
    }

    if (input.action === 'create_session') {
      const profile = (await db.select().from(mentorshipProfiles).where(and(eq(mentorshipProfiles.id, input.profileId), eq(mentorshipProfiles.isActive, true))).limit(1))[0];
      if (!profile) throw new RouteError(404, 'Choose an active mentor profile.');
      const startsAt = new Date(input.startsAt);
      const [session] = await db.insert(mentorshipSessions).values({
        profileId: profile.id,
        menteeEmail: input.menteeEmail.toLowerCase(),
        status: 'scheduled',
        startsAt,
        endsAt: new Date(startsAt.getTime() + input.plannedMinutes * 60_000),
        plannedMinutes: input.plannedMinutes,
        rateCentsPerMinute: profile.defaultRateCentsPerMinute,
        totalCents: 0,
        externalReference: input.externalReference || null,
        notes: input.notes || null,
      }).returning();
      return NextResponse.json({ session }, { status: 201 });
    }

    if (input.action === 'grant_allowance') {
      const profile = (await db.select({ id: mentorshipProfiles.id }).from(mentorshipProfiles).where(eq(mentorshipProfiles.id, input.profileId)).limit(1))[0];
      if (!profile) throw new RouteError(404, 'Mentor profile not found.');
      const menteeEmail = input.menteeEmail.toLowerCase();
      const entry = buildUsageLedgerEntry({ minutes: input.minutes, rateCentsPerMinute: 0, amountCents: 0, entryType: 'credit', idempotencyKey: `mentorship-allowance:${profile.id}:${randomUUID()}`, menteeEmail });
      await db.transaction(async (tx) => {
        const lockKey = `mentorship:${profile.id}:${menteeEmail}`;
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
        await tx.insert(mentorshipUsageLedger).values({
          profileId: profile.id,
          menteeEmail: entry.menteeEmail,
          minutes: entry.minutes,
          amountCents: entry.amountCents,
          entryType: entry.entryType,
          idempotencyKey: entry.idempotencyKey,
          metadata: { kind: 'free_minute_grant', note: input.note || '' },
        });
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (input.action === 'complete_session') {
      const result = await db.transaction(async (tx) => {
        const session = (await tx.select().from(mentorshipSessions).where(eq(mentorshipSessions.id, input.sessionId)).limit(1))[0];
        if (!session) throw new RouteError(404, 'Mentorship session not found.');
        if (session.status !== 'scheduled') throw new RouteError(409, 'Only scheduled sessions can be completed.');
        const lockKey = `mentorship:${session.profileId}:${session.menteeEmail}`;
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
        const entries = await tx.select().from(mentorshipUsageLedger).where(and(eq(mentorshipUsageLedger.profileId, session.profileId), eq(mentorshipUsageLedger.menteeEmail, session.menteeEmail)));
        const grantedMinutes = entries.filter((entry) => entry.entryType === 'credit').reduce((sum, entry) => sum + entry.minutes, 0);
        const usedMinutes = entries.filter((entry) => entry.entryType === 'free_usage').reduce((sum, entry) => sum + entry.minutes, 0);
        const freeMinutesApplied = Math.min(input.actualMinutes, Math.max(0, grantedMinutes - usedMinutes));
        const billableMinutes = input.actualMinutes - freeMinutesApplied;
        const amountCents = billableMinutes > 0 ? calculateMentorshipPrice({ minutes: billableMinutes, rateCentsPerMinute: session.rateCentsPerMinute }).amountCents : 0;
        const [updated] = await tx.update(mentorshipSessions).set({
          status: 'completed',
          actualMinutes: input.actualMinutes,
          totalCents: amountCents,
          endsAt: new Date(session.startsAt.getTime() + input.actualMinutes * 60_000),
          updatedAt: new Date(),
        }).where(and(eq(mentorshipSessions.id, session.id), eq(mentorshipSessions.status, 'scheduled'))).returning();
        if (!updated) throw new RouteError(409, 'This session was already changed. Refresh and try again.');

        if (freeMinutesApplied > 0) {
          const entry = buildUsageLedgerEntry({ minutes: freeMinutesApplied, rateCentsPerMinute: 0, amountCents: 0, entryType: 'free_usage', idempotencyKey: `mentorship-session:${session.id}:free`, sessionId: session.id, menteeEmail: session.menteeEmail });
          await tx.insert(mentorshipUsageLedger).values({ profileId: session.profileId, sessionId: session.id, menteeEmail: session.menteeEmail, minutes: entry.minutes, amountCents: entry.amountCents, entryType: entry.entryType, idempotencyKey: entry.idempotencyKey, metadata: { kind: 'free_allowance_used', actualMinutes: input.actualMinutes, billableMinutes } });
        }
        if (billableMinutes > 0) {
          const entry = buildUsageLedgerEntry({ minutes: billableMinutes, rateCentsPerMinute: session.rateCentsPerMinute, amountCents: 0, entryType: 'charge', idempotencyKey: `mentorship-session:${session.id}:billable`, sessionId: session.id, menteeEmail: session.menteeEmail });
          await tx.insert(mentorshipUsageLedger).values({ profileId: session.profileId, sessionId: session.id, menteeEmail: session.menteeEmail, minutes: entry.minutes, amountCents: entry.amountCents, entryType: entry.entryType, idempotencyKey: entry.idempotencyKey, metadata: { kind: 'billable_session_time', actualMinutes: input.actualMinutes, freeMinutesApplied, rateCentsPerMinute: session.rateCentsPerMinute } });
        }
        return { session: updated, freeMinutesApplied, billableMinutes, amountCents };
      });
      return NextResponse.json(result);
    }

    if (input.action === 'cancel_session') {
      const [session] = await db.update(mentorshipSessions).set({ status: 'cancelled', updatedAt: new Date() }).where(and(eq(mentorshipSessions.id, input.sessionId), eq(mentorshipSessions.status, 'scheduled'))).returning();
      if (!session) throw new RouteError(409, 'Only scheduled sessions can be cancelled. Refresh the list and try again.');
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: 'Unsupported mentorship action.' }, { status: 400 });
  } catch (error) {
    if (error instanceof RouteError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[admin/mentorship] mutation failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not save mentorship changes. Please retry.' }, { status: 500 });
  }
}
