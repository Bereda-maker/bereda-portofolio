import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const AvailabilityInput = z.object({ weekday: z.coerce.number().int().min(0).max(6), startMinute: z.coerce.number().int().min(0).max(1439), endMinute: z.coerce.number().int().min(1).max(1440), timezone: z.string().min(1).max(80) }).refine((value) => value.endMinute > value.startMinute, { message: 'End time must be after start time.' });

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const { availability } = await import('@/lib/schema');
  const parsed = AvailabilityInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid availability.' }, { status: 400 });
  const [row] = await db.insert(availability).values(parsed.data).returning();
  return NextResponse.json({ availability: row }, { status: 201 });
}
