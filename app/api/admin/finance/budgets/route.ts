import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { budgetAdjustmentInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = budgetAdjustmentInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid budget adjustment.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const [category] = await db.select().from(schema.financeCategories).where(eq(schema.financeCategories.key, parsed.data.categoryKey)).limit(1);
    if (!category || !category.isActive) return NextResponse.json({ error: 'Select an active financial category.' }, { status: 400 });
    const [adjustment] = await db.insert(schema.financeBudgetAdjustments).values(parsed.data).returning();
    return NextResponse.json({ adjustment }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not record the explained budget adjustment.' }, { status: 400 }); }
}
