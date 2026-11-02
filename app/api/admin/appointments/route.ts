import { NextRequest, NextResponse } from 'next/server';
import { asc, desc, gte } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { getGoogleConnection } from '@/lib/calendar/google';
import { writeAuditEvent } from '@/lib/services/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const { appointmentTypes, appointments, availability, blockedTimes } = await import('@/lib/schema');
  const [types, hours, upcoming, blocks, connection] = await Promise.all([
    db.select().from(appointmentTypes).orderBy(asc(appointmentTypes.id)),
    db.select().from(availability).orderBy(asc(availability.weekday), asc(availability.startMinute)),
    db.select().from(appointments).where(gte(appointments.startsAt, new Date())).orderBy(asc(appointments.startsAt)).limit(50),
    db.select().from(blockedTimes).where(gte(blockedTimes.endsAt, new Date())).orderBy(asc(blockedTimes.startsAt)).limit(50),
    getGoogleConnection().catch(() => null),
  ]);
  return NextResponse.json({ types, availability: hours, appointments: upcoming, blockedTimes: blocks, calendar: connection ? { connected: true, accountLabel: connection.accountLabel, calendarId: connection.calendarId } : { connected: false } });
}

const AppointmentUpdate = z.object({ id: z.coerce.number().int().positive(), status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']) });
export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { db } = await import('@/lib/db');
  const { appointments } = await import('@/lib/schema');
  const parsed = AppointmentUpdate.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid appointment update.' }, { status: 400 });
  const { eq } = await import('drizzle-orm');
  const previous = (await db.select({ status: appointments.status }).from(appointments).where(eq(appointments.id, parsed.data.id)).limit(1))[0];
  if (!previous) return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  await db.update(appointments).set({ status: parsed.data.status, updatedAt: new Date() }).where((await import('drizzle-orm')).eq(appointments.id, parsed.data.id));
  await writeAuditEvent({ action: 'appointment_status_updated', entityType: 'appointment', entityId: parsed.data.id, before: { status: previous.status }, after: { status: parsed.data.status }, requestId: request.headers.get('x-request-id') });
  return NextResponse.json({ ok: true });
}
