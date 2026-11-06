import { NextResponse } from 'next/server';
import { and, asc, eq, inArray } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { db } = await import('@/lib/db');
  const { appointmentTypes } = await import('@/lib/schema');
  const types = await db.select({ id: appointmentTypes.id, name: appointmentTypes.name, slug: appointmentTypes.slug, description: appointmentTypes.description, durationMinutes: appointmentTypes.durationMinutes }).from(appointmentTypes).where(and(eq(appointmentTypes.isActive, true), inArray(appointmentTypes.durationMinutes, [30, 60]))).orderBy(asc(appointmentTypes.durationMinutes), asc(appointmentTypes.id));
  return NextResponse.json({ types });
}
