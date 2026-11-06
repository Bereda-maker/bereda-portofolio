import { NextResponse } from 'next/server';
import { and, asc, eq, inArray } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { db } = await import('@/lib/db');
  const { appointmentTypes } = await import('@/lib/schema');
  await db.insert(appointmentTypes).values([
    { name: '30-minute conversation', slug: 'public-30-minute-conversation', description: 'A focused conversation for introductions, questions, and next steps.', durationMinutes: 30, priceCents: 0, isActive: true },
    { name: '1-hour conversation', slug: 'public-1-hour-conversation', description: 'A deeper working session for detailed context, planning, or technical discussion.', durationMinutes: 60, priceCents: 0, isActive: true },
  ]).onConflictDoNothing({ target: appointmentTypes.slug });
  const types = await db.select({ id: appointmentTypes.id, name: appointmentTypes.name, slug: appointmentTypes.slug, description: appointmentTypes.description, durationMinutes: appointmentTypes.durationMinutes }).from(appointmentTypes).where(and(eq(appointmentTypes.isActive, true), inArray(appointmentTypes.durationMinutes, [30, 60]))).orderBy(asc(appointmentTypes.durationMinutes), asc(appointmentTypes.id));
  return NextResponse.json({ types });
}
