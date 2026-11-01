import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin || !isSameOrigin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 500 });

  const client = postgres(url, { max: 1, prepare: false });
  try {
    await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
    return NextResponse.json({ ok: true, message: 'Database migrations applied.' });
  } catch (error) {
    console.error('[admin/migrate] Failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Migration failed.' }, { status: 500 });
  } finally {
    await client.end({ timeout: 5 });
  }
}
