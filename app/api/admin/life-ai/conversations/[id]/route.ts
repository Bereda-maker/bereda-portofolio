import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { lifeAiConversations } from '@/lib/schema';
import { getConversation } from '@/lib/life-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const conversation = await getConversation(Number(params.id));
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
