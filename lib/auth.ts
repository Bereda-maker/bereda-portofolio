import { cookies } from 'next/headers';
import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';

export interface SessionData {
  isAdmin?: boolean;
}

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

function requireSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // iron-session refuses passwords under 32 characters; fail loudly with a
    // clear message instead of a cryptic error deep inside the library.
    throw new Error('SESSION_SECRET is missing or too short (needs to be at least 32 characters). Copy .env.example to .env.local and set it.');
  }
  return secret;
}

function buildSessionOptions(): SessionOptions {
  return {
    password: requireSecret(),
    cookieName: 'portfolio_admin',
    ttl: SEVEN_DAYS_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

/** Reads (and lazily creates) the admin session for the current request. */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, buildSessionOptions());
}

/** True if the current request carries a valid, signed-in admin session. */
export async function isAdminRequest(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}
