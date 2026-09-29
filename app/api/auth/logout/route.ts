import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const session = await getSession();
    session.destroy();
  } catch (err) {
    console.error('[auth/logout] Failed to destroy session:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
