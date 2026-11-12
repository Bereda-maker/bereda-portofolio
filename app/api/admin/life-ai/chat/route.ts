import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';
import { isSameOrigin } from '@/lib/same-origin';
import { aiProvider } from '@/lib/services/providers';
import { aiUsageLogs, lifeAiConversations, lifeAiMessages } from '@/lib/schema';
import { getCalendarContext, getContextSettings, getConversation, LIFE_AI_OWNER, LIFE_AI_SYSTEM } from '@/lib/life-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const Input = z.object({ conversationId: z.number().int().positive().optional(), content: z.string().trim().min(1).max(8000) });
const recentRequests = new Map<string, number[]>();

function allowed() { const now = Date.now(); const times = (recentRequests.get(LIFE_AI_OWNER) ?? []).filter((time) => now - time < 60_000); if (times.length >= 12) return false; times.push(now); recentRequests.set(LIFE_AI_OWNER, times); return true; }

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!allowed()) return NextResponse.json({ error: 'Please wait a moment before sending another message.' }, { status: 429 });
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid message.' }, { status: 400 });

  const { db } = await import('@/lib/db');
  let conversation = parsed.data.conversationId ? await getConversation(parsed.data.conversationId) : null;
  if (parsed.data.conversationId && !conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  if (!conversation) {
    const [created] = await db.insert(lifeAiConversations).values({ ownerKey: LIFE_AI_OWNER, title: parsed.data.content.slice(0, 60) }).returning();
    conversation = { ...created, messages: [] };
  }
  await db.insert(lifeAiMessages).values({ conversationId: conversation.id, role: 'user', content: parsed.data.content });

  const context = await getContextSettings();
  const history = [...conversation.messages, { role: 'user' as const, content: parsed.data.content }].slice(-20).map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));
  let contextText = `preferences=${context.preferences}, goals=${context.goals}, commitments=${context.commitments}, habits=${context.habits}, journal=${context.journal}, relationships=${context.relationships}, finances=${context.finances}, conversations=${context.conversations}`;
  if (context.commitments) {
    const tasks = await getCalendarContext();
    contextText += `\nRead-only upcoming planned tasks (do not invent or modify): ${JSON.stringify(tasks)}`;
  }
  const result = await aiProvider.chat({ messages: history, system: LIFE_AI_SYSTEM.replace('{{CONTEXT}}', contextText) });
  if (result.status !== 'ok') {
    await db.insert(aiUsageLogs).values({ provider: result.provider, model: process.env.AI_MODEL ?? null, operation: 'life_ai_chat', status: 'error' });
    return NextResponse.json({ error: result.message }, { status: 503 });
  }
  const assistant = result.data.text.trim();
  if (!assistant) return NextResponse.json({ error: 'The AI provider returned an empty response.' }, { status: 502 });
  await db.insert(lifeAiMessages).values({ conversationId: conversation.id, role: 'assistant', content: assistant });
  await db.update(lifeAiConversations).set({ updatedAt: new Date(), title: conversation.title === 'New conversation' ? parsed.data.content.slice(0, 60) : conversation.title }).where(and(eq(lifeAiConversations.id, conversation.id), eq(lifeAiConversations.ownerKey, LIFE_AI_OWNER)));
  await db.insert(aiUsageLogs).values({ provider: process.env.AI_PROVIDER ?? 'openai', model: process.env.AI_MODEL ?? null, operation: 'life_ai_chat', inputTokens: result.data.inputTokens ?? null, outputTokens: result.data.outputTokens ?? null, status: 'success' });
  return NextResponse.json({ conversationId: conversation.id, message: { role: 'assistant', content: assistant, createdAt: new Date().toISOString() } });
}
