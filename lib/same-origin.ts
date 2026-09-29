import type { NextRequest } from 'next/server';

/**
 * Rejects cross-origin requests to cookie-authenticated, state-changing
 * endpoints (login, logout, and every admin mutation). Browsers send an
 * `Origin` header on same-origin fetch/POST requests too, not just
 * cross-origin ones, so requiring it to be present and matching `Host` is a
 * reliable CSRF guard here — it is not merely a fallback.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
