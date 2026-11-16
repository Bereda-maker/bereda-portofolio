import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { LearningReflectionInput } from '@/lib/learning-validation';
import { learningExperiences, learningExperienceSkills, learningReflections, learningSkills } from '@/lib/schema';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await getSession()).isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const parsed = LearningReflectionInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid reflection.' }, { status: 400 });
  try {
    const { db } = await import('@/lib/db');
    const data = parsed.data;
    const [experience] = await db.select().from(learningExperiences).where(eq(learningExperiences.id, data.experienceId)).limit(1);
    if (!experience) return NextResponse.json({ error: 'Learning experience not found.' }, { status: 404 });
    if (experience.status !== 'COMPLETED') return NextResponse.json({ error: 'Reflections are available after participation is marked completed.' }, { status: 409 });

    const { experienceId, ...values } = data;
    const [reflection] = await db.insert(learningReflections).values({ ...values, experienceId, updatedAt: new Date() })
      .onConflictDoUpdate({ target: learningReflections.experienceId, set: { ...values, updatedAt: new Date() } }).returning();

    const names = [...new Set(`${data.technicalKnowledge},${data.softSkills}`.split(/[,;\n]/).map(name => name.trim()).filter(name => name.length > 1 && name.length <= 100))];
    for (const name of names) {
      const normalizedName = name.toLowerCase();
      await db.insert(learningSkills).values({ name, normalizedName }).onConflictDoNothing();
      const [skill] = await db.select().from(learningSkills).where(eq(learningSkills.normalizedName, normalizedName)).limit(1);
      if (skill) await db.insert(learningExperienceSkills).values({ experienceId, skillId: skill.id }).onConflictDoNothing();
    }
    return NextResponse.json({ reflection });
  } catch {
    return NextResponse.json({ error: 'Could not save reflection. Apply the Learning migration if needed.' }, { status: 500 });
  }
}
