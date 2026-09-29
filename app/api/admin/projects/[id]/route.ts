import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

const ProjectPatch = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(200),
    category: z.string().trim().min(1, 'Category is required.').max(100),
    description: z.string().trim().min(1, 'Description is required.').max(2000),
    stack: z.array(z.string().trim().min(1)).min(1, 'Add at least one stack tag.').max(20),
    demo: z.string().trim().refine((v) => v === '#' || /^https?:\/\//i.test(v), 'Demo must be "#" or a full https:// URL.'),
    repo: z.string().trim().refine((v) => v === '#' || /^https?:\/\//i.test(v), 'Repo must be "#" or a full https:// URL.'),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update.' });

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }
  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const [row] = await db.select().from(projects).where(eq(projects.id, id));
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ project: row });
  } catch (err) {
    console.error('[admin/projects/[id] GET] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load project.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = ProjectPatch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const [row] = await db.update(projects).set(parsed.data).where(eq(projects.id, id)).returning();
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ project: row });
  } catch (err) {
    console.error('[admin/projects/[id] PATCH] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = parseId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const [row] = await db.delete(projects).where(eq(projects.id, id)).returning();
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/projects/[id] DELETE] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete project.' }, { status: 500 });
  }
}
