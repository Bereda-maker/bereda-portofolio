import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getGoogleConnection } from '@/lib/calendar/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const connection = await getGoogleConnection().catch(() => null);
  return NextResponse.json({ connected: Boolean(connection), calendarId: connection?.calendarId ?? null, accountLabel: connection?.accountLabel ?? null });
}
