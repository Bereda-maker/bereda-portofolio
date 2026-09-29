import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

const LoginInput = z.object({ password: z.string().min(1, 'Password is required.').max(500) });

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = LoginInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // Never echo which env var is missing beyond this generic message —
    // just enough for the admin to know setup is incomplete, nothing an
    // attacker can use.
    console.error('[auth/login] ADMIN_PASSWORD_HASH is not set.');
    return NextResponse.json({ error: 'Admin login is not configured yet.' }, { status: 500 });
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(parsed.data.password, hash);
  } catch (err) {
    console.error('[auth/login] bcrypt.compare failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  if (!ok) {
    // Same generic message whether the password is wrong or the account
    // "doesn't exist" — there's only one admin account, so distinguishing
    // would only help an attacker.
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  try {
    const session = await getSession();
    session.isAdmin = true;
    await session.save();
  } catch (err) {
    console.error('[auth/login] Failed to create session:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
