import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import type { SessionData } from '@/lib/auth';

// This mirrors the cookie name/shape from lib/auth.ts. Middleware runs on
// the Edge runtime, which can't use next/headers' cookies() the way route
// handlers and pages do, so it reads the raw cookie and verifies it with
// iron-session's lower-level unsealData instead of the full getSession().
const COOKIE_NAME = 'portfolio_admin';

async function hasAdminSession(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;
  if (!cookie || !secret || secret.length < 32) return false;
  try {
    const data = await unsealData<SessionData>(cookie, { password: secret });
    return data.isAdmin === true;
  } catch {
    // Missing, expired, or tampered cookie — treat exactly like "not signed in".
    return false;
  }
}

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (await hasAdminSession(req)) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = '';
  return NextResponse.redirect(loginUrl);
}

// Scoped to /admin only, so this never runs on the public site, the API
// routes, or _next/static and other static assets.
export const config = {
  matcher: ['/admin/:path*'],
};
