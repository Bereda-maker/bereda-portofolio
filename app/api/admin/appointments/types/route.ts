import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const TypeInput = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/), description: z.string().trim().max(300).optional().default(''), durationMinutes: z.coerce.number().int().min(15).max(240), priceCents: z.coerce.number().int().min(0).max(10_000_000).default(0) });

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const { appointmentTypes } = await import('@/lib/schema');
  const parsed = TypeInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid appointment type.' }, { status: 400 });
  try { const [type] = await db.insert(appointmentTypes).values({ ...parsed.data, description: parsed.data.description || null }).returning(); return NextResponse.json({ type }, { status: 201 }); }
  catch { return NextResponse.json({ error: 'Could not create this appointment type. The slug may already exist.' }, { status: 409 }); }
}
