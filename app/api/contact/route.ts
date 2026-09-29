import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ContactInput = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(200),
  message: z.string().trim().min(10, 'Please add a little more detail (10+ characters).').max(4000),
  needs: z.array(z.string().trim().min(1).max(60)).max(10).optional().default([]),
  budget: z.number().int().min(0).max(1_000_000).optional(),
});

// In-memory sliding-window rate limit: 3 requests per IP per 10 minutes.
// This resets whenever the server process restarts and is per-instance, not
// shared across multiple Railway replicas — good enough to blunt casual
// spam/abuse on a single-instance portfolio site, not a substitute for a
// shared store (Redis, etc.) if this ever runs with more than one instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many messages sent. Please try again in a few minutes.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = ContactInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const { name, email, message, needs, budget } = parsed.data;

  // The `messages` table only has a single free-text `message` column, so
  // the "I need" chips and budget picked in the form are folded into it
  // rather than dropped, the same way the old mailto draft included them.
  const composed = [
    message,
    '',
    `Need: ${needs.length ? needs.join(', ') : 'Not specified'}`,
    budget != null ? `Budget: $${budget.toLocaleString()}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');

  try {
    const { db } = await import('@/lib/db');
    const { messages } = await import('@/lib/schema');
    await db.insert(messages).values({ name, email, message: composed });
  } catch (err) {
    console.error('[contact] Failed to store message:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Something went wrong on our end. Please try again in a moment.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
