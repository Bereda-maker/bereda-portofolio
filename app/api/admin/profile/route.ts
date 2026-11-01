import { asc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { candidateProfiles } from '@/lib/schema';

export const runtime = 'nodejs';
const ProfileInput = z.object({
  name: z.string().trim().min(1).max(120), headline: z.string().trim().max(240).optional(), skills: z.array(z.string().trim().min(1)).max(50), yearsExperience: z.number().int().min(0).max(80).nullable().optional(), workMode: z.string().trim().max(80).optional(), locations: z.array(z.string().trim().min(1)).max(20), portfolioUrl: z.string().trim().url().optional().or(z.literal('')), githubUrl: z.string().trim().url().optional().or(z.literal('')), projectsSummary: z.string().trim().max(4000).optional(), preferences: z.string().trim().max(2000).optional(),
});

async function authorized(req?: NextRequest) {
  const session = await getSession();
  return Boolean(session.isAdmin && (!req || isSameOrigin(req)));
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const rows = await db.select().from(candidateProfiles).orderBy(asc(candidateProfiles.id)).limit(1);
  return NextResponse.json({ profile: rows[0] ?? null });
}

export async function PUT(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const parsed = ProfileInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid profile.' }, { status: 400 });
  const existing = await db.select({ id: candidateProfiles.id }).from(candidateProfiles).orderBy(asc(candidateProfiles.id)).limit(1);
  const values = { ...parsed.data, updatedAt: new Date() };
  const [profile] = existing[0]
    ? await db.update(candidateProfiles).set(values).where(eq(candidateProfiles.id, existing[0].id)).returning()
    : await db.insert(candidateProfiles).values(values).returning();
  return NextResponse.json({ profile });
}
