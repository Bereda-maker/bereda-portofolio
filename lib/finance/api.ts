import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { currencyExponent } from './money';

export async function financeAccess(request?: NextRequest, mutation = false): Promise<NextResponse | null> {
  try {
    if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Finance authorization is unavailable.' }, { status: 401 });
  }
  if (mutation && request && !isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

export async function financeDatabase() {
  const [{ db }, schema] = await Promise.all([import('@/lib/db'), import('@/lib/schema')]);
  return { db, schema };
}

export function financeError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 400 });
}

export function normalizedCurrency(value: string | null | undefined, fallback = 'ETB') {
  const currency = (value ?? fallback).trim().toUpperCase();
  currencyExponent(currency);
  return currency;
}

export function requestJson(request: NextRequest) {
  return request.json().catch(() => null);
}
