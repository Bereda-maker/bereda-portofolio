import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { disconnectGoogle } from '@/lib/calendar/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  await disconnectGoogle();
  return NextResponse.json({ ok: true });
}
