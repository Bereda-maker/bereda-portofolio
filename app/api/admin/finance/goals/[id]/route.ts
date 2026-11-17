import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { dateOnly, positiveMinor } from '@/lib/finance/validation';

export const runtime = 'nodejs';
const goalUpdate = z.object({ title: z.string().trim().min(1).max(200).optional(), targetMinor: positiveMinor.optional(), deadline: dateOnly.nullable().optional(), notes: z.string().trim().max(2000).nullable().optional(), isActive: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const id = Number(params.id); const parsed = goalUpdate.safeParse(await requestJson(request));
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return NextResponse.json({ error: parsed.success ? 'Invalid goal id.' : parsed.error.issues[0]?.message ?? 'Invalid goal update.' }, { status: 400 });
  try { const { db, schema } = await financeDatabase(); const [goal] = await db.update(schema.financeGoals).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.financeGoals.id, id)).returning(); if (!goal) return NextResponse.json({ error: 'Savings goal not found.' }, { status: 404 }); return NextResponse.json({ goal }); }
  catch { return NextResponse.json({ error: 'Could not update the savings goal.' }, { status: 400 }); }
}
