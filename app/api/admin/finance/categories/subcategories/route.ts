import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { subcategoryInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = subcategoryInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid subcategory.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const [category] = await db.select().from(schema.financeCategories).where(eq(schema.financeCategories.key, parsed.data.categoryKey)).limit(1);
    if (!category || !category.isActive) return NextResponse.json({ error: 'Choose an active parent category.' }, { status: 400 });
    const [subcategory] = await db.insert(schema.financeSubcategories).values({ ...parsed.data, isDefault: false, sortOrder: 100 }).returning();
    return NextResponse.json({ subcategory }, { status: 201 });
  } catch { return NextResponse.json({ error: 'That subcategory already exists or could not be saved.' }, { status: 400 }); }
}
