import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

const ProjectInput = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  category: z.string().trim().min(1, 'Category is required.').max(100),
  description: z.string().trim().min(1, 'Description is required.').max(2000),
  stack: z.array(z.string().trim().min(1)).min(1, 'Add at least one stack tag.').max(20),
  // Placeholder "#" is allowed (matches the seeded data); anything else must
  // look like an absolute URL.
  demo: z.string().trim().refine((v) => v === '#' || /^https?:\/\//i.test(v), 'Demo must be "#" or a full https:// URL.'),
  repo: z.string().trim().refine((v) => v === '#' || /^https?:\/\//i.test(v), 'Repo must be "#" or a full https:// URL.'),
});

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const rows = await db.select().from(projects).orderBy(projects.id);
    return NextResponse.json({ projects: rows });
  } catch (err) {
    console.error('[admin/projects GET] Failed to list projects:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load projects.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = ProjectInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  try {
    const { db } = await import('@/lib/db');
    const { projects } = await import('@/lib/schema');
    const [row] = await db.insert(projects).values(parsed.data).returning();
    return NextResponse.json({ project: row }, { status: 201 });
  } catch (err) {
    console.error('[admin/projects POST] Failed to create project:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}
