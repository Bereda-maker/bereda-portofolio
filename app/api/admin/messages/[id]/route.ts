import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';

export const runtime = 'nodejs';

const MessagePatch = z.object({ read: z.boolean() });

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type Params = { params: { id: string } };

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

  const parsed = MessagePatch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  try {
    const { db } = await import('@/lib/db');
    const { messages } = await import('@/lib/schema');
    const [row] = await db.update(messages).set({ read: parsed.data.read }).where(eq(messages.id, id)).returning();
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ message: row });
  } catch (err) {
    console.error('[admin/messages/[id] PATCH] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to update message.' }, { status: 500 });
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
    const { messages } = await import('@/lib/schema');
    const [row] = await db.delete(messages).where(eq(messages.id, id)).returning();
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/messages/[id] DELETE] Failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to delete message.' }, { status: 500 });
  }
}
