import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { LEARNING_STATUSES, LearningAttachmentInput, LearningExperienceUpdateInput } from '@/lib/learning-validation';
import { learningAttachments, learningExperiences, learningStatusHistory } from '@/lib/schema';

export const runtime = 'nodejs';
const Patch = z.object({ status: z.enum(LEARNING_STATUSES), note: z.string().trim().max(500).optional() }).strict();

type Context = { params: { id: string } };
function parseId(raw: string) { const id = Number(raw); return Number.isInteger(id) && id > 0 ? id : null; }

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid record.' }, { status: 400 });
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status change.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const [current] = await db.select().from(learningExperiences).where(eq(learningExperiences.id, id)).limit(1);
    if (!current) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (current.status !== parsed.data.status) {
      await db.transaction(async tx => {
        await tx.update(learningExperiences).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(learningExperiences.id, id));
        await tx.insert(learningStatusHistory).values({ experienceId: id, fromStatus: current.status, toStatus: parsed.data.status, note: parsed.data.note ?? null });
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not update status.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid record.' }, { status: 400 });
  const parsed = LearningAttachmentInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid attachment.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const [experience] = await db.select({ id: learningExperiences.id }).from(learningExperiences).where(eq(learningExperiences.id, id)).limit(1);
    if (!experience) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const [attachment] = await db.insert(learningAttachments).values({ ...parsed.data, experienceId: id }).returning();
    return NextResponse.json({ attachment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save supporting material.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid record.' }, { status: 400 });
  const parsed = LearningExperienceUpdateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid experience.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const [current] = await db.select().from(learningExperiences).where(eq(learningExperiences.id, id)).limit(1);
    if (!current) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const { attachments, status, ...data } = parsed.data;
    await db.transaction(async tx => {
      await tx.update(learningExperiences).set({
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
        status,
        updatedAt: new Date(),
      }).where(eq(learningExperiences.id, id));
      if (current.status !== status) await tx.insert(learningStatusHistory).values({ experienceId: id, fromStatus: current.status, toStatus: status, note: 'Updated from experience editor' });
      if (attachments.length) await tx.insert(learningAttachments).values(attachments.map(attachment => ({ ...attachment, experienceId: id })));
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not update the experience.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const id = parseId(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid record.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    await db.delete(learningExperiences).where(eq(learningExperiences.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not delete the record.' }, { status: 500 });
  }
}
