import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';

export const runtime = 'nodejs';
const subcategoryUpdate = z.object({ name: z.string().trim().min(1).max(100).optional(), isActive: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0);
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const id = Number(params.id); const parsed = subcategoryUpdate.safeParse(await requestJson(request));
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return NextResponse.json({ error: parsed.success ? 'Invalid subcategory id.' : parsed.error.issues[0]?.message ?? 'Invalid subcategory update.' }, { status: 400 });
  try { const { db, schema } = await financeDatabase(); const [row] = await db.update(schema.financeSubcategories).set(parsed.data).where(eq(schema.financeSubcategories.id, id)).returning(); if (!row) return NextResponse.json({ error: 'Subcategory not found.' }, { status: 404 }); return NextResponse.json({ subcategory: row }); }
  catch { return NextResponse.json({ error: 'Could not update subcategory.' }, { status: 400 }); }
}
