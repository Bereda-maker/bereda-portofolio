import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { searchYouTubeVideos } from '@/lib/life-ai-youtube';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const requests = new Map<string, number[]>();

function rateLimited() {
  const now = Date.now();
  const recent = (requests.get('admin') ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 10) return true;
  recent.push(now);
  requests.set('admin', recent);
  return false;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: { 'cache-control': 'no-store' } });
  if (rateLimited()) return NextResponse.json({ error: 'Please wait before requesting more videos.' }, { status: 429, headers: { 'cache-control': 'no-store' } });
  const params = request.nextUrl.searchParams;
  const query = params.get('query') ?? '';
  const pageToken = params.get('pageToken') ?? undefined;
  const result = await searchYouTubeVideos(query, pageToken);
  return NextResponse.json({ block: result.block }, { headers: { 'cache-control': 'private, no-store' } });
}
