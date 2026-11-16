import { NextRequest, NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { LearningExperienceCreateInput } from '@/lib/learning-validation';
import { learningAttachments, learningExperiences, learningReflections, learningStatusHistory } from '@/lib/schema';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db } = await import('@/lib/db');
    const [experiences, reflections, attachments, history] = await Promise.all([
      db.select().from(learningExperiences).orderBy(asc(learningExperiences.startsAt)),
      db.select().from(learningReflections),
      db.select().from(learningAttachments),
      db.select().from(learningStatusHistory).orderBy(asc(learningStatusHistory.changedAt)),
    ]);
    return NextResponse.json({ experiences: experiences.map(experience => ({
      ...experience,
      reflection: reflections.find(reflection => reflection.experienceId === experience.id) ?? null,
      attachments: attachments.filter(attachment => attachment.experienceId === experience.id),
      statusHistory: history.filter(entry => entry.experienceId === experience.id),
    })) });
  } catch {
    return NextResponse.json({ error: 'Learning records could not be loaded. Apply the learning database migration if this is a fresh deployment.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const parsed = LearningExperienceCreateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid learning experience.' }, { status: 400 });

  try {
    const { db } = await import('@/lib/db');
    const { attachments, ...data } = parsed.data;
    const experience = await db.transaction(async tx => {
      const [created] = await tx.insert(learningExperiences).values({
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      }).returning();
      await tx.insert(learningStatusHistory).values({ experienceId: created.id, toStatus: created.status, note: 'Initial status' });
      if (attachments.length) await tx.insert(learningAttachments).values(attachments.map(attachment => ({ ...attachment, experienceId: created.id })));
      return created;
    });
    return NextResponse.json({ experience }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save the learning experience.' }, { status: 500 });
  }
}
