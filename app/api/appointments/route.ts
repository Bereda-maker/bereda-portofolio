import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gte, lt, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createGoogleEvent, getGoogleBusy, getGoogleConnection } from '@/lib/calendar/google';
import { validateAppointmentConflicts } from '@/lib/services/appointments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const Booking = z.object({ typeId: z.coerce.number().int().positive(), name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(200), startsAt: z.string().datetime(), endsAt: z.string().datetime(), timezone: z.string().min(1).max(80), notes: z.string().trim().max(2000).optional().default('') });

export async function POST(request: NextRequest) {
  const parsed = Booking.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid booking details.' }, { status: 400 });
  const input = parsed.data;
  const { db } = await import('@/lib/db');
  const { appointmentTypes, appointments, blockedTimes } = await import('@/lib/schema');
  const type = (await db.select().from(appointmentTypes).where(and(eq(appointmentTypes.id, input.typeId), eq(appointmentTypes.isActive, true))).limit(1))[0];
  if (!type) return NextResponse.json({ error: 'Appointment type is not available.' }, { status: 404 });
  const startsAt = new Date(input.startsAt); const endsAt = new Date(input.endsAt);
  if (endsAt.getTime() - startsAt.getTime() !== type.durationMinutes * 60_000 || startsAt.getTime() < Date.now()) return NextResponse.json({ error: 'That time slot is no longer valid.' }, { status: 400 });
  const connection = await getGoogleConnection().catch(() => null);
  if (!connection) return NextResponse.json({ error: 'Calendar booking is not available yet. Please contact me directly.' }, { status: 503 });
  const busy = await getGoogleBusy(connection.calendarId || 'primary', connection.refreshToken, startsAt, endsAt).catch(() => null);
  if (busy === null || busy.some((item) => new Date(item.start).getTime() < endsAt.getTime() && startsAt.getTime() < new Date(item.end).getTime())) return NextResponse.json({ error: 'That time is no longer available on the calendar.' }, { status: 409 });
  const reservation = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${startsAt.toISOString()} || '|' || ${endsAt.toISOString()}))`);
    const existing = await tx.select({ id: appointments.id, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status }).from(appointments).where(and(lt(appointments.startsAt, endsAt), gte(appointments.endsAt, startsAt), ne(appointments.status, 'cancelled')));
    const blocked = await tx.select({ id: blockedTimes.id, startsAt: blockedTimes.startsAt, endsAt: blockedTimes.endsAt }).from(blockedTimes).where(and(lt(blockedTimes.startsAt, endsAt), gte(blockedTimes.endsAt, startsAt)));
    if (!validateAppointmentConflicts({ startsAt, endsAt }, existing, blocked).ok) return null;
    const [created] = await tx.insert(appointments).values({ appointmentTypeId: type.id, attendeeName: input.name, attendeeEmail: input.email, status: 'pending', startsAt, endsAt, timezone: input.timezone, notes: input.notes || null }).returning({ id: appointments.id });
    return created;
  });
  if (!reservation) return NextResponse.json({ error: 'That time has already been taken. Please choose another slot.' }, { status: 409 });
  try {
    const event = await createGoogleEvent({ refreshToken: connection.refreshToken, calendarId: connection.calendarId || 'primary', title: `${type.name} — ${input.name}`, startsAt, endsAt, timezone: input.timezone, attendeeEmail: input.email, attendeeName: input.name, organizerEmail: 'beriwako56@gmail.com', notes: input.notes });
    await db.update(appointments).set({ status: 'confirmed', providerEventId: event.eventId, updatedAt: new Date() }).where(eq(appointments.id, reservation.id));
    return NextResponse.json({ ok: true, appointmentId: reservation.id, meetingUrl: event.meetingUrl || null, eventUrl: event.eventUrl || null }, { status: 201 });
  } catch (error) {
    await db.update(appointments).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(appointments.id, reservation.id)).catch(() => undefined);
    console.error('[appointments] booking failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'We could not create the calendar event. Please try again.' }, { status: 502 });
  }
}
