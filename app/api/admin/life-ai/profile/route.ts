import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { LIFE_AI_OWNER } from '@/lib/life-ai';
import { getProfileOverviewData } from '@/lib/life-ai-profile';
import { isProfileCategory, PROFILE_CATEGORIES, profileSectionSchemas } from '@/lib/life-ai-profile-contract';
import { lifeAiProfilePermissions, lifeAiProfileSections, lifeAiProfileSettings } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const SectionInput = z.object({ category: z.enum(PROFILE_CATEGORIES), data: z.unknown() });

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    return NextResponse.json(await getProfileOverviewData(), { headers: { 'cache-control': 'no-store, private' } });
  } catch {
    return NextResponse.json({ error: 'Profile data is temporarily unavailable.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const body = SectionInput.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Invalid profile section.' }, { status: 400 });
  const parsed = profileSectionSchemas[body.data.category].safeParse(body.data.data);
  if (!parsed.success) return NextResponse.json({ error: 'Some profile fields are invalid or too long. Review the section and try again.' }, { status: 400 });

  try {
    const { db } = await import('@/lib/db');
    const [section] = await db.insert(lifeAiProfileSections)
      .values({ ownerKey: LIFE_AI_OWNER, category: body.data.category, data: parsed.data as Record<string, unknown>, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [lifeAiProfileSections.ownerKey, lifeAiProfileSections.category],
        set: { data: parsed.data as Record<string, unknown>, updatedAt: new Date() },
      }).returning({ category: lifeAiProfileSections.category, data: lifeAiProfileSections.data, updatedAt: lifeAiProfileSections.updatedAt });
    return NextResponse.json({ section }, { headers: { 'cache-control': 'no-store, private' } });
  } catch {
    return NextResponse.json({ error: 'Could not save this profile section. Your changes have not been stored.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const category = new URL(request.url).searchParams.get('category');
  if (category && !isProfileCategory(category)) return NextResponse.json({ error: 'Invalid profile category.' }, { status: 400 });

  try {
    const { db } = await import('@/lib/db');
    await db.transaction(async (tx) => {
      if (category) {
        await tx.delete(lifeAiProfileSections).where(and(eq(lifeAiProfileSections.ownerKey, LIFE_AI_OWNER), eq(lifeAiProfileSections.category, category)));
        await tx.delete(lifeAiProfilePermissions).where(and(eq(lifeAiProfilePermissions.ownerKey, LIFE_AI_OWNER), eq(lifeAiProfilePermissions.category, category)));
      } else {
        await tx.delete(lifeAiProfileSections).where(eq(lifeAiProfileSections.ownerKey, LIFE_AI_OWNER));
        await tx.delete(lifeAiProfilePermissions).where(eq(lifeAiProfilePermissions.ownerKey, LIFE_AI_OWNER));
        await tx.delete(lifeAiProfileSettings).where(eq(lifeAiProfileSettings.ownerKey, LIFE_AI_OWNER));
      }
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete the requested profile data.' }, { status: 503 });
  }
}
