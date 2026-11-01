import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSlots } from '@/lib/services/scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const Query = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), typeId: z.coerce.number().int().positive(), timezone: z.string().min(1).max(80).default('UTC') });

export async function GET(request: NextRequest) {
  const parsed = Query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid date, appointment type, and timezone.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const { appointmentTypes } = await import('@/lib/schema');
  const type = (await db.select({ durationMinutes: appointmentTypes.durationMinutes }).from(appointmentTypes).where(eq(appointmentTypes.id, parsed.data.typeId)).limit(1))[0];
  if (!type) return NextResponse.json({ error: 'Appointment type not found.' }, { status: 404 });
  try { return NextResponse.json({ slots: await getSlots(parsed.data.date, type.durationMinutes, parsed.data.timezone) }); }
  catch (error) { console.error('[appointments/availability]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Availability is temporarily unavailable.' }, { status: 503 }); }
}
