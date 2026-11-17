import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { allocationPlanInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = allocationPlanInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid allocation plan.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.data.effectiveDate < today) return NextResponse.json({ error: 'A new allocation plan cannot be effective in the past. Historical allocations remain unchanged.' }, { status: 400 });
    const [latest] = await db.select().from(schema.financeAllocationPlans).orderBy(desc(schema.financeAllocationPlans.effectiveDate)).limit(1);
    if (latest && parsed.data.effectiveDate <= latest.effectiveDate) return NextResponse.json({ error: `Choose an effective date later than the current plan (${latest.effectiveDate}). Historical plan versions cannot be replaced.` }, { status: 400 });
    const [plan] = await db.insert(schema.financeAllocationPlans).values(parsed.data).returning();
    return NextResponse.json({ plan }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not save the new allocation plan. Plan versions are never overwritten.' }, { status: 400 }); }
}
