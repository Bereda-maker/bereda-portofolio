import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getProfileOverviewData } from '@/lib/life-ai-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const data = await getProfileOverviewData();
    return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="my-life-profile.json"',
        'cache-control': 'no-store, private',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Profile export is temporarily unavailable.' }, { status: 503 });
  }
}
