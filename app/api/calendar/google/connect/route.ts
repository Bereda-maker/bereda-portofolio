import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { isAdminRequest } from '@/lib/auth';
import { googleAuthorizationUrl, googleConfigured } from '@/lib/calendar/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  if (!googleConfigured()) return NextResponse.json({ error: 'Google Calendar OAuth is not configured.' }, { status: 503 });
  const state = randomBytes(24).toString('base64url');
  cookies().set('google_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' });
  return NextResponse.redirect(googleAuthorizationUrl(state));
}
