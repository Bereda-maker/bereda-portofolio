import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { dateOnly, nonNegativeMinor } from '@/lib/finance/validation';

export const runtime = 'nodejs';
const investmentUpdate = z.object({ name: z.string().trim().min(1).max(200).optional(), investmentCategory: z.string().trim().min(1).max(120).optional(), currentValueMinor: nonNegativeMinor.nullable().optional(), valueAsOf: dateOnly.nullable().optional(), notes: z.string().trim().max(2000).nullable().optional(), isActive: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const id = Number(params.id); const parsed = investmentUpdate.safeParse(await requestJson(request));
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return NextResponse.json({ error: parsed.success ? 'Invalid investment id.' : parsed.error.issues[0]?.message ?? 'Invalid investment update.' }, { status: 400 });
  try { const { db, schema } = await financeDatabase(); const [investment] = await db.update(schema.financeInvestments).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.financeInvestments.id, id)).returning(); if (!investment) return NextResponse.json({ error: 'Investment record not found.' }, { status: 404 }); return NextResponse.json({ investment }); }
  catch { return NextResponse.json({ error: 'Could not update the manually tracked investment.' }, { status: 400 }); }
}
