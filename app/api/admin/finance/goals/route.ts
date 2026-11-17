import { NextRequest, NextResponse } from 'next/server';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { goalInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = goalInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid savings goal.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const [goal] = await db.insert(schema.financeGoals).values(parsed.data).returning();
    return NextResponse.json({ goal }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Could not create the savings goal. An emergency goal may already exist for this currency.' }, { status: 400 }); }
}
