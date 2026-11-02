import { and, desc, eq } from 'drizzle-orm';
import { decryptSecret, encryptSecret } from './security';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR = 'https://www.googleapis.com/calendar/v3';

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

export function googleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/calendar/google/callback`;
}

export function googleAuthorizationUrl(state: string) {
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || '', redirect_uri: googleRedirectUri(), response_type: 'code', access_type: 'offline', prompt: 'consent', scope: 'https://www.googleapis.com/auth/calendar', state });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

async function tokenRequest(body: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' });
  const data = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error || 'Google token request failed.');
  return data;
}

export async function exchangeGoogleCode(code: string) {
  return tokenRequest(new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', redirect_uri: googleRedirectUri(), grant_type: 'authorization_code' }));
}

async function getAccessToken(refreshToken: string) {
  const data = await tokenRequest(new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', refresh_token: refreshToken, grant_type: 'refresh_token' }));
  return data.access_token;
}

async function googleFetch(path: string, refreshToken: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken(refreshToken);
  const response = await fetch(`${GOOGLE_CALENDAR}${path}`, { ...init, headers: { ...(init.headers || {}), authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' }, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: { message?: string } }).error?.message || 'Google Calendar request failed.');
  return data;
}

export async function saveGoogleConnection(refreshToken: string, accountLabel = 'Google Calendar') {
  const { db } = await import('@/lib/db');
  const { calendarConnections } = await import('@/lib/schema');
  const calendarId = process.env.GOOGLE_CALENDAR_ID || process.env.CALENDAR_ID || 'primary';
  const existing = await db.select().from(calendarConnections).where(eq(calendarConnections.provider, 'google')).orderBy(desc(calendarConnections.updatedAt), desc(calendarConnections.id)).limit(1);
  if (existing[0]) {
    await db.update(calendarConnections).set({ accountLabel, encryptedRefreshToken: encryptSecret(refreshToken), calendarId, status: 'connected', lastError: null, updatedAt: new Date() }).where(eq(calendarConnections.id, existing[0].id));
    return existing[0].id;
  }
  const [created] = await db.insert(calendarConnections).values({ provider: 'google', accountLabel, encryptedRefreshToken: encryptSecret(refreshToken), calendarId, status: 'connected' }).returning({ id: calendarConnections.id });
  return created.id;
}

export async function getGoogleConnection() {
  const { db } = await import('@/lib/db');
  const { calendarConnections } = await import('@/lib/schema');
  const rows = await db.select().from(calendarConnections).where(and(eq(calendarConnections.provider, 'google'), eq(calendarConnections.status, 'connected'))).orderBy(desc(calendarConnections.updatedAt), desc(calendarConnections.id)).limit(1);
  const connection = rows[0];
  if (!connection?.encryptedRefreshToken) return null;
  return { ...connection, refreshToken: decryptSecret(connection.encryptedRefreshToken) };
}

export async function disconnectGoogle() {
  const { db } = await import('@/lib/db');
  const { calendarConnections } = await import('@/lib/schema');
  await db.update(calendarConnections).set({ status: 'disconnected', encryptedRefreshToken: null, lastError: null, updatedAt: new Date() }).where(eq(calendarConnections.provider, 'google'));
}

export async function getGoogleBusy(calendarId: string, refreshToken: string, startsAt: Date, endsAt: Date) {
  const data = await googleFetch('/freeBusy', refreshToken, { method: 'POST', body: JSON.stringify({ timeMin: startsAt.toISOString(), timeMax: endsAt.toISOString(), items: [{ id: calendarId }] }) }) as { calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }> };
  return data.calendars?.[calendarId]?.busy ?? [];
}

export async function listGoogleEvents(calendarId: string, refreshToken: string, startsAt: Date, endsAt: Date) {
  const params = new URLSearchParams({ timeMin: startsAt.toISOString(), timeMax: endsAt.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '50' });
  const data = await googleFetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, refreshToken) as { items?: Array<{ id: string; summary?: string; description?: string; htmlLink?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; status?: string }> };
  return (data.items || []).filter((event) => event.status !== 'cancelled').map((event) => ({ id: event.id, summary: event.summary || 'Untitled event', description: event.description || null, htmlLink: event.htmlLink || null, startsAt: event.start?.dateTime || event.start?.date || null, endsAt: event.end?.dateTime || event.end?.date || null }));
}

export async function createGoogleEvent(input: { refreshToken: string; calendarId: string; title: string; startsAt: Date; endsAt: Date; timezone: string; attendeeEmail: string; attendeeName: string; notes?: string }) {
  const data = await googleFetch(`/calendars/${encodeURIComponent(input.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, input.refreshToken, { method: 'POST', body: JSON.stringify({ summary: input.title, description: input.notes || undefined, start: { dateTime: input.startsAt.toISOString(), timeZone: input.timezone }, end: { dateTime: input.endsAt.toISOString(), timeZone: input.timezone }, attendees: [{ email: input.attendeeEmail, displayName: input.attendeeName }], conferenceData: { createRequest: { requestId: `bereda-${Date.now()}-${Math.random().toString(36).slice(2)}`, conferenceSolutionKey: { type: 'hangoutsMeet' } } } }) }) as { id: string; htmlLink?: string; hangoutLink?: string; conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> } };
  return { eventId: data.id, eventUrl: data.htmlLink, meetingUrl: data.hangoutLink || data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri };
}
