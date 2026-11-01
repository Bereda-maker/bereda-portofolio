import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdminRequest } from '@/lib/auth';
import { exchangeGoogleCode, saveGoogleConnection } from '@/lib/calendar/google';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminUrl(query = '') { return new URL(`/admin/appointments${query}`, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'); }

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = cookies().get('google_oauth_state')?.value;
  cookies().delete('google_oauth_state');
  if (!code || !state || !expectedState || state !== expectedState) return NextResponse.redirect(adminUrl('?calendar=error&reason=invalid_state'));
  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Disconnect the app in Google Account permissions and try again.');
    await saveGoogleConnection(tokens.refresh_token);
    return NextResponse.redirect(adminUrl('?calendar=connected'));
  } catch (error) {
    console.error('[calendar/google/callback]', error instanceof Error ? error.message : error);
    return NextResponse.redirect(adminUrl('?calendar=error&reason=connection_failed'));
  }
}
