import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { dailyApplicationGoals } from '@/lib/schema';

export const runtime = 'nodejs';
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Input = z.object({ day: Day, action: z.enum(['set_goal', 'log_application']), target: z.number().int().min(1).max(100).optional() });

async function authorized(req?: NextRequest) {
  const session = await getSession();
  return Boolean(session.isAdmin && (!req || isSameOrigin(req)));
}

function databaseError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === '42P01') return NextResponse.json({ error: 'Application goal storage is not installed in this database yet. Run `npm run db:migrate` using this deployment’s DATABASE_URL.' }, { status: 503 });
  console.error('[admin/opportunities/tracker]', error);
  return NextResponse.json({ error: 'Could not access application goal storage. Check the database connection and migrations.' }, { status: 503 });
}

export async function GET(req: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const day = req.nextUrl.searchParams.get('day') ?? new Date().toISOString().slice(0, 10);
  if (!Day.safeParse(day).success) return NextResponse.json({ error: 'Invalid day.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const [row] = await db.select().from(dailyApplicationGoals).where(eq(dailyApplicationGoals.day, day)).limit(1);
    return NextResponse.json(row ?? { day, target: 5, applied: 0 });
  } catch (error) { return databaseError(error); }
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid tracker update.' }, { status: 400 });
  const { day, action, target } = parsed.data;
  if (action === 'set_goal' && target === undefined) return NextResponse.json({ error: 'Set a goal between 1 and 100.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const [row] = await db.insert(dailyApplicationGoals).values({ day, ...(action === 'set_goal' ? { target: target! } : {}) })
      .onConflictDoUpdate({ target: dailyApplicationGoals.day, set: action === 'set_goal' ? { target: target!, updatedAt: new Date() } : { applied: sql`${dailyApplicationGoals.applied} + 1`, updatedAt: new Date() } })
      .returning();
    return NextResponse.json(row);
  } catch (error) { return databaseError(error); }
}
