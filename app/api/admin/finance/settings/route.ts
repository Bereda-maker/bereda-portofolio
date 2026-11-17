import { NextRequest, NextResponse } from 'next/server';
import { financeAccess, financeDatabase, requestJson } from '@/lib/finance/api';
import { financeSettingsInput } from '@/lib/finance/validation';

export const runtime = 'nodejs';
export async function PATCH(request: NextRequest) {
  const denied = await financeAccess(request, true); if (denied) return denied;
  const parsed = financeSettingsInput.safeParse(await requestJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid settings.' }, { status: 400 });
  try {
    const { db, schema } = await financeDatabase();
    await db.insert(schema.financeSettings).values({ id: true }).onConflictDoNothing();
    const [settings] = await db.update(schema.financeSettings).set({ ...parsed.data, updatedAt: new Date() }).returning();
    return NextResponse.json({ settings });
  } catch { return NextResponse.json({ error: 'Could not save finance settings.' }, { status: 400 }); }
}
