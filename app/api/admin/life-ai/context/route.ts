import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { lifeAiContextSettings } from '@/lib/schema';
import { DEFAULT_CONTEXT, getContextSettings, LIFE_AI_OWNER } from '@/lib/life-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ContextInput = z.object(Object.fromEntries(Object.keys(DEFAULT_CONTEXT).map((key) => [key, z.boolean()])) as Record<keyof typeof DEFAULT_CONTEXT, z.ZodBoolean>);

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  return NextResponse.json({ context: await getContextSettings() });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = ContextInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid context settings.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const [context] = await db.insert(lifeAiContextSettings).values({ ownerKey: LIFE_AI_OWNER, ...parsed.data }).onConflictDoUpdate({ target: lifeAiContextSettings.ownerKey, set: { ...parsed.data, updatedAt: new Date() } }).returning();
  return NextResponse.json({ context });
}
