import { NextRequest, NextResponse } from 'next/server';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { categoryInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = categoryInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid category.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    const slug = parsed.data.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32);
    if (!slug) return NextResponse.json({ error: 'Provide a category name with letters or numbers.' }, { status: 400 });
    const key = `CUSTOM_${slug}`;
    const [category] = await db.insert(schema.financeCategories).values({ key, name: parsed.data.name, description: parsed.data.description ?? null, isDefault: false, sortOrder: 100 }).returning();
    return NextResponse.json({ category }, { status: 201 });
  } catch { return NextResponse.json({ error: 'That finance category already exists or could not be saved.' }, { status: 400 }); }
}
