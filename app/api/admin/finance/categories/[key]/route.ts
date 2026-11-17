import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';

export const runtime = 'nodejs';
const categoryUpdate = z.object({ name: z.string().trim().min(1).max(100).optional(), description: z.string().trim().max(500).nullable().optional(), isActive: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);
export async function PATCH(request: NextRequest, { params }: { params: { key: string } }) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const key = params.key.trim().toUpperCase(); const parsed = categoryUpdate.safeParse(await requestJson(request));
  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(key) || !parsed.success) return NextResponse.json({ error: parsed.success ? 'Invalid category key.' : parsed.error.issues[0]?.message ?? 'Invalid category update.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const [before] = await db.select().from(schema.financeCategories).where(eq(schema.financeCategories.key, key)).limit(1);
    if (!before) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    if (before.isDefault && parsed.data.isActive === false) return NextResponse.json({ error: 'Core allocation categories cannot be disabled.' }, { status: 400 });
    const [category] = await db.update(schema.financeCategories).set(parsed.data).where(eq(schema.financeCategories.key, key)).returning();
    return NextResponse.json({ category });
  } catch { return NextResponse.json({ error: 'Could not update category.' }, { status: 400 }); }
}
