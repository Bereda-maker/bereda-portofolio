import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { LIFE_AI_OWNER } from '@/lib/life-ai';
import { PROFILE_CATEGORIES, PROFILE_CATEGORY_INFO } from '@/lib/life-ai-profile-contract';
import { lifeAiProfilePermissions, lifeAiProfileSections, lifeAiProfileSettings } from '@/lib/schema';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const PermissionInput = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('global'), enabled: z.boolean() }),
  z.object({ scope: z.literal('category'), category: z.enum(PROFILE_CATEGORIES), enabled: z.boolean(), sensitiveConsent: z.boolean().optional() }),
]);

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db');
    const [settings, rows, sections] = await Promise.all([
      db.select().from(lifeAiProfileSettings).where(eq(lifeAiProfileSettings.ownerKey, LIFE_AI_OWNER)).limit(1),
      db.select().from(lifeAiProfilePermissions).where(eq(lifeAiProfilePermissions.ownerKey, LIFE_AI_OWNER)),
      db.select({ category: lifeAiProfileSections.category, updatedAt: lifeAiProfileSections.updatedAt }).from(lifeAiProfileSections).where(eq(lifeAiProfileSections.ownerKey, LIFE_AI_OWNER)),
    ]);
    const saved = new Map(rows.map((row) => [row.category, row]));
    const sectionByCategory = new Map(sections.map((section) => [section.category, section]));
    const categories = Object.fromEntries(PROFILE_CATEGORIES.map((category) => {
      const row = saved.get(category);
      const section = sectionByCategory.get(category);
      return [category, { aiEnabled: row?.aiEnabled ?? false, hasSensitiveConsent: row?.consentedAt !== null && row?.consentedAt !== undefined, hasData: Boolean(section), updatedAt: section?.updatedAt ?? null, permissionUpdatedAt: row?.updatedAt ?? null }];
    }));
    return NextResponse.json({ globalEnabled: settings[0]?.aiContextEnabled ?? false, categories }, { headers: { 'cache-control': 'no-store, private' } });
  } catch {
    return NextResponse.json({ error: 'Personalization settings are temporarily unavailable.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = PermissionInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid personalization setting.' }, { status: 400 });
  const input = parsed.data;

  try {
    const { db } = await import('@/lib/db');
    if (input.scope === 'global') {
      const [settings] = await db.insert(lifeAiProfileSettings)
        .values({ ownerKey: LIFE_AI_OWNER, aiContextEnabled: input.enabled, updatedAt: new Date() })
        .onConflictDoUpdate({ target: lifeAiProfileSettings.ownerKey, set: { aiContextEnabled: input.enabled, updatedAt: new Date() } })
        .returning({ aiContextEnabled: lifeAiProfileSettings.aiContextEnabled, updatedAt: lifeAiProfileSettings.updatedAt });
      return NextResponse.json({ globalEnabled: settings.aiContextEnabled, updatedAt: settings.updatedAt });
    }

    const sensitive = PROFILE_CATEGORY_INFO[input.category].sensitive;
    if (input.enabled && sensitive && input.sensitiveConsent !== true) {
      return NextResponse.json({ error: 'Explicit consent is required before enabling AI access for this sensitive category.' }, { status: 400 });
    }
    const consentedAt = input.enabled && sensitive ? new Date() : null;
    const [permission] = await db.insert(lifeAiProfilePermissions)
      .values({ ownerKey: LIFE_AI_OWNER, category: input.category, aiEnabled: input.enabled, consentedAt, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [lifeAiProfilePermissions.ownerKey, lifeAiProfilePermissions.category],
        set: { aiEnabled: input.enabled, consentedAt, updatedAt: new Date() },
      }).returning({ category: lifeAiProfilePermissions.category, aiEnabled: lifeAiProfilePermissions.aiEnabled, consentedAt: lifeAiProfilePermissions.consentedAt, updatedAt: lifeAiProfilePermissions.updatedAt });
    return NextResponse.json({ permission });
  } catch {
    return NextResponse.json({ error: 'Could not update personalization settings.' }, { status: 503 });
  }
}
