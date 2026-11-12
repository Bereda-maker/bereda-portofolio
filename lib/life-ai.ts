import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { calendarTasks, lifeAiContextSettings, lifeAiConversations, lifeAiMessages } from '@/lib/schema';

async function getDb() { return (await import('@/lib/db')).db; }

export const LIFE_AI_OWNER = 'admin';

export const DEFAULT_CONTEXT = {
  preferences: true,
  goals: true,
  commitments: true,
  habits: false,
  journal: false,
  relationships: false,
  finances: false,
  conversations: true,
};

export const LIFE_AI_SYSTEM = `You are Your Life AI, one calm, practical assistant for the owner's personal life. You can support wellbeing, journaling, planning, habits, relationships, financial wellbeing, recreation, spiritual growth, learning, mentorship, work-life balance, and life decisions.

Be warm but not clinical. Ask a short clarifying question when needed. Never invent memories, commitments, finances, relationships, or facts. Clearly label assumptions as assumptions. Do not diagnose, provide regulated financial advice, or pretend to have completed an action. This foundation is read-only and suggestion-first: you may draft plans and recommendations, but ask for explicit approval before any consequential action. Respect the enabled context categories below and do not mention disabled categories unless the user brings them up.

Enabled context categories: {{CONTEXT}}

When discussing sensitive topics, encourage appropriate professional or emergency support where relevant. Keep answers useful and grounded in the user's actual message.`;

export async function getContextSettings() {
  const db = await getDb();
  const [row] = await db.select().from(lifeAiContextSettings).where(eq(lifeAiContextSettings.ownerKey, LIFE_AI_OWNER)).limit(1);
  return row ?? { ...DEFAULT_CONTEXT, ownerKey: LIFE_AI_OWNER };
}

export async function getConversation(id: number) {
  const db = await getDb();
  const [conversation] = await db.select().from(lifeAiConversations).where(and(eq(lifeAiConversations.id, id), eq(lifeAiConversations.ownerKey, LIFE_AI_OWNER))).limit(1);
  if (!conversation) return null;
  const messages = await db.select().from(lifeAiMessages).where(eq(lifeAiMessages.conversationId, id)).orderBy(asc(lifeAiMessages.createdAt));
  return { ...conversation, messages };
}

export async function getCalendarContext() {
  const db = await getDb();
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + 14);
  return db.select({ title: calendarTasks.title, startsAt: calendarTasks.startsAt, endsAt: calendarTasks.endsAt, status: calendarTasks.status, priority: calendarTasks.priority }).from(calendarTasks).where(and(eq(calendarTasks.status, 'planned'), gte(calendarTasks.startsAt, now), lte(calendarTasks.startsAt, until))).orderBy(asc(calendarTasks.startsAt)).limit(100);
}

export async function listConversations() {
  const db = await getDb();
  return db.select({ id: lifeAiConversations.id, title: lifeAiConversations.title, createdAt: lifeAiConversations.createdAt, updatedAt: lifeAiConversations.updatedAt }).from(lifeAiConversations).where(eq(lifeAiConversations.ownerKey, LIFE_AI_OWNER)).orderBy(desc(lifeAiConversations.updatedAt)).limit(100);
}
