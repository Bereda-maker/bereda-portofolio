import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { searchOpenLibraryBooks } from '@/lib/life-ai-books';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const requests: number[] = [];

function rateLimited() {
  const now = Date.now();
  while (requests.length && now - requests[0]! > 60_000) requests.shift();
  if (requests.length >= 10) return true;
  requests.push(now);
  return false;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  if (rateLimited()) return NextResponse.json({ error: 'Please wait before requesting more book results.' }, { status: 429, headers: { 'cache-control': 'no-store' } });
  const query = request.nextUrl.searchParams.get('query') ?? '';
  const pageText = request.nextUrl.searchParams.get('page') ?? '1';
  const page = /^\d{1,4}$/.test(pageText) ? Number(pageText) : 0;
  if (!page || page > 1000) return NextResponse.json({ error: 'Invalid book results page.' }, { status: 400, headers: { 'cache-control': 'no-store' } });
  const result = await searchOpenLibraryBooks(query, page);
  return NextResponse.json({ block: result.block }, { headers: { 'cache-control': 'private, no-store' } });
}
