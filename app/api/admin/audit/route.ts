import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';
import { auditLogs } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const page = Math.max(1, Math.min(100_000, Number(request.nextUrl.searchParams.get('page')) || 1));
  const limit = Math.max(10, Math.min(100, Number(request.nextUrl.searchParams.get('limit')) || 25));
  const action = request.nextUrl.searchParams.get('action')?.trim().slice(0, 120);
  const entityType = request.nextUrl.searchParams.get('entityType')?.trim().slice(0, 100);
  const search = request.nextUrl.searchParams.get('q')?.trim().slice(0, 160);
  const filters = [];
  if (action) filters.push(eq(auditLogs.action, action));
  if (entityType) filters.push(eq(auditLogs.entityType, entityType));
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    filters.push(or(ilike(auditLogs.action, pattern), ilike(auditLogs.entityType, pattern), ilike(auditLogs.entityId, pattern), ilike(auditLogs.actorId, pattern))!);
  }
  try {
    const { db } = await import('@/lib/db');
    const where = filters.length ? and(...filters) : undefined;
    const [events, totalRows, facets] = await Promise.all([
      db.select({ id: auditLogs.id, actorType: auditLogs.actorType, actorId: auditLogs.actorId, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, before: auditLogs.before, after: auditLogs.after, requestId: auditLogs.requestId, createdAt: auditLogs.createdAt }).from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt), desc(auditLogs.id)).limit(limit).offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(where),
      db.selectDistinct({ action: auditLogs.action, entityType: auditLogs.entityType }).from(auditLogs).orderBy(auditLogs.entityType, auditLogs.action).limit(200),
    ]);
    const total = Number(totalRows[0]?.count || 0);
    return NextResponse.json({ events, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)), actions: [...new Set(facets.map((item) => item.action))], entityTypes: [...new Set(facets.map((item) => item.entityType))] });
  } catch (error) {
    console.error('[admin/audit] load failed', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not load audit events. Confirm the database connection and migrations.' }, { status: 503 });
  }
}
