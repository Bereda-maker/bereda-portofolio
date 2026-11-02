import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq, gt, gte, lt } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TaskInput = z.object({
  title: z.string().trim().min(1).max(160),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  notes: z.string().trim().max(1000).optional().default(''),
}).refine((value) => value.endsAt > value.startsAt, { message: 'End time must be after start time.' });

const PlanInput = z.object({
  period: z.enum(['week', 'month']),
  periodStart: z.coerce.date(),
  title: z.string().trim().min(1).max(160),
  targetMinutes: z.coerce.number().int().min(0).max(10080),
  targetLabel: z.string().trim().max(120).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
});

function range(request: NextRequest) {
  const url = new URL(request.url);
  const from = new Date(url.searchParams.get('from') || Date.now() - 7 * 86400000);
  const to = new Date(url.searchParams.get('to') || Date.now() + 42 * 86400000);
  return { from, to };
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { from, to } = range(request);
  const { db } = await import('@/lib/db');
  const { calendarTasks, calendarPlans } = await import('@/lib/schema');
  const [tasks, plans] = await Promise.all([
    db.select().from(calendarTasks).where(and(lt(calendarTasks.startsAt, to), gt(calendarTasks.endsAt, from))).orderBy(asc(calendarTasks.startsAt)),
    db.select().from(calendarPlans).where(and(gte(calendarPlans.periodStart, from), lt(calendarPlans.periodStart, to))).orderBy(asc(calendarPlans.periodStart)),
  ]);
  return NextResponse.json({ tasks, plans });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json().catch(() => null) as { kind?: string } | null;
  const { db } = await import('@/lib/db');
  const { calendarTasks, calendarPlans } = await import('@/lib/schema');
  if (body?.kind === 'plan') {
    const parsed = PlanInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid planning target.' }, { status: 400 });
    const [plan] = await db.insert(calendarPlans).values({ ...parsed.data, targetLabel: parsed.data.targetLabel || null, notes: parsed.data.notes || null }).onConflictDoUpdate({ target: [calendarPlans.period, calendarPlans.periodStart], set: { title: parsed.data.title, targetMinutes: parsed.data.targetMinutes, targetLabel: parsed.data.targetLabel || null, notes: parsed.data.notes || null, updatedAt: new Date() } }).returning();
    return NextResponse.json({ plan }, { status: 201 });
  }
  const parsed = TaskInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid planning block.' }, { status: 400 });
  const [task] = await db.insert(calendarTasks).values({ ...parsed.data, notes: parsed.data.notes || null }).returning();
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const parsed = z.object({ id: z.coerce.number().int().positive(), status: z.enum(['planned', 'in_progress', 'done', 'cancelled']).optional(), title: z.string().trim().min(1).max(160).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid planning update.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const { calendarTasks } = await import('@/lib/schema');
  const [task] = await db.update(calendarTasks).set({ ...(parsed.data.status ? { status: parsed.data.status } : {}), ...(parsed.data.title ? { title: parsed.data.title } : {}), updatedAt: new Date() }).where(eq(calendarTasks.id, parsed.data.id)).returning();
  if (!task) return NextResponse.json({ error: 'Planning block not found.' }, { status: 404 });
  return NextResponse.json({ task });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid planning block.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const { calendarTasks } = await import('@/lib/schema');
  await db.delete(calendarTasks).where(eq(calendarTasks.id, id));
  return NextResponse.json({ ok: true });
}
