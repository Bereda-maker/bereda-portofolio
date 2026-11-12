import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { lifeAiConversations } from '@/lib/schema';
import { getConversation, LIFE_AI_OWNER } from '@/lib/life-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const RenameInput = z.object({ title: z.string().trim().min(1).max(120) });

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const conversation = await getConversation(Number(params.id));
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  return NextResponse.json({ conversation });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = RenameInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a conversation name between 1 and 120 characters.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const [conversation] = await db.update(lifeAiConversations).set({ title: parsed.data.title, updatedAt: new Date() }).where(eq(lifeAiConversations.id, Number(params.id))).returning({ id: lifeAiConversations.id, title: lifeAiConversations.title, updatedAt: lifeAiConversations.updatedAt });
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  return NextResponse.json({ conversation });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const { db } = await import('@/lib/db');
  await db.delete(lifeAiConversations).where(eq(lifeAiConversations.id, Number(params.id)));
  return NextResponse.json({ ok: true });
}
