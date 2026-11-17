import { NextRequest, NextResponse } from 'next/server';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { investmentInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = investmentInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid investment record.' }, { status: 400 });
  try { const { db, schema } = await financeDatabase(); const [investment] = await db.insert(schema.financeInvestments).values(parsed.data).returning(); return NextResponse.json({ investment }, { status: 201 }); }
  catch { return NextResponse.json({ error: 'Could not save the manually tracked investment.' }, { status: 400 }); }
}
