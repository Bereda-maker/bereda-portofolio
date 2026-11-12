import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { lifeAiConversations } from '@/lib/schema';
import { getConversation, listConversations, LIFE_AI_OWNER } from '@/lib/life-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateConversation = z.object({ title: z.string().trim().min(1).max(120).optional() });

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try { return NextResponse.json({ conversations: await listConversations() }); }
  catch { return NextResponse.json({ error: 'Conversation history is unavailable.' }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const parsed = CreateConversation.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid conversation title.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  const [conversation] = await db.insert(lifeAiConversations).values({ ownerKey: LIFE_AI_OWNER, title: parsed.data.title ?? 'New conversation' }).returning();
  return NextResponse.json({ conversation: await getConversation(conversation.id) }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'A conversation id is required.' }, { status: 400 });
  const { db } = await import('@/lib/db');
  await db.delete(lifeAiConversations).where(eq(lifeAiConversations.id, id));
  return NextResponse.json({ ok: true });
}
