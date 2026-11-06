import { and, eq, gte, lt, ne } from 'drizzle-orm';
import { localDateTimeToUtc, localWeekday } from '@/lib/calendar/security';
import { getGoogleBusy, getGoogleConnection } from '@/lib/calendar/google';
import { validateAppointmentConflicts } from './appointments';

export async function getSlots(date: string, durationMinutes: number, timezone: string) {
  const { db } = await import('@/lib/db');
  const { appointments, availability, blockedTimes } = await import('@/lib/schema');
  const weekday = localWeekday(date);
  const configuredWindows = await db.select().from(availability).where(and(eq(availability.weekday, weekday), eq(availability.isActive, true)));
  // The admin Open availability board treats a day with no recurring windows as
  // open calendar time. Keep the public scheduler consistent with that view;
  // bookings, blocked times, and Google Calendar busy periods still remove slots.
  const windows = configuredWindows.length ? configuredWindows : [{ startMinute: 0, endMinute: 24 * 60, timezone }];
  const dayStart = localDateTimeToUtc(date, 0, timezone);
  const dayEnd = localDateTimeToUtc(date, 24 * 60, timezone);
  const existing = await db.select({ id: appointments.id, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status }).from(appointments).where(and(lt(appointments.startsAt, dayEnd), gte(appointments.endsAt, dayStart), ne(appointments.status, 'cancelled')));
  const blocked = await db.select({ id: blockedTimes.id, startsAt: blockedTimes.startsAt, endsAt: blockedTimes.endsAt }).from(blockedTimes).where(and(lt(blockedTimes.startsAt, dayEnd), gte(blockedTimes.endsAt, dayStart)));
  const connection = await getGoogleConnection().catch(() => null);
  const busy = connection ? await getGoogleBusy(connection.calendarId || 'primary', connection.refreshToken, dayStart, dayEnd).catch(() => []) : [];
  const result: Array<{ startsAt: string; endsAt: string; label: string }> = [];
  for (const window of windows) {
    for (let minute = window.startMinute; minute + durationMinutes <= window.endMinute; minute += 30) {
      const startsAt = localDateTimeToUtc(date, minute, window.timezone);
      const endsAt = localDateTimeToUtc(date, minute + durationMinutes, window.timezone);
      const conflict = validateAppointmentConflicts({ startsAt, endsAt }, existing, blocked);
      const calendarConflict = busy.some((item) => new Date(item.start).getTime() < endsAt.getTime() && startsAt.getTime() < new Date(item.end).getTime());
      if (conflict.ok && !calendarConflict) result.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), label: new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit' }).format(startsAt) });
    }
  }
  return result;
}

export async function hasConflicts(startsAt: Date, endsAt: Date) {
  const { db } = await import('@/lib/db');
  const { appointments, blockedTimes } = await import('@/lib/schema');
  const existing = await db.select({ id: appointments.id, startsAt: appointments.startsAt, endsAt: appointments.endsAt, status: appointments.status }).from(appointments).where(and(lt(appointments.startsAt, endsAt), gte(appointments.endsAt, startsAt), ne(appointments.status, 'cancelled')));
  const blocked = await db.select({ id: blockedTimes.id, startsAt: blockedTimes.startsAt, endsAt: blockedTimes.endsAt }).from(blockedTimes).where(and(lt(blockedTimes.startsAt, endsAt), gte(blockedTimes.endsAt, startsAt)));
  return validateAppointmentConflicts({ startsAt, endsAt }, existing, blocked);
}
