import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getGoogleConnection, listGoogleEvents } from '@/lib/calendar/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const connection = await getGoogleConnection().catch(() => null);
  if (!connection) return NextResponse.json({ connected: false, events: [] });
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
  try { return NextResponse.json({ connected: true, events: await listGoogleEvents(connection.calendarId || 'primary', connection.refreshToken, startsAt, endsAt) }); }
  catch (error) { console.error('[calendar/google/events]', error instanceof Error ? error.message : error); return NextResponse.json({ error: 'Could not load Google Calendar events.' }, { status: 502 }); }
}
