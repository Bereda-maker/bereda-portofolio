import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestInput = z.object({
  period: z.enum(['day', 'week']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  existingTasks: z.array(z.object({ title: z.string(), startsAt: z.string(), endsAt: z.string(), status: z.string() })).max(200).default([]),
  preferences: z.string().max(2000).optional().default(''),
});

const Block = z.object({
  dayOffset: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  durationHours: z.number().int().min(1).max(12),
  title: z.string().trim().min(1).max(160),
  priority: z.enum(['low', 'normal', 'high']),
  rationale: z.string().trim().max(240),
});

const Draft = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(500),
  blocks: z.array(Block).min(1).max(48),
});

const PERSONALITY = `Bereda is an ambitious, curious, creative, practical, independent and persistent Ethiopian software engineer, product builder, entrepreneur and technology content creator. He wants to become an international product engineer and SaaS founder. He learns best through focused project work, prefers understanding concepts while building, and needs help protecting focus from too many simultaneous ideas and scope expansion. His highest-value priorities are finishing one strong foundation, improving engineering fundamentals, shipping visible evidence, building products, and creating useful technical content. The plan should be realistic, focused, and execution-oriented, not motivational filler.`;

function providerConfig() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || process.env.OPENAI_MODEL;
  return { apiKey, baseUrl, model };
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const parsed = RequestInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid AI planning request.' }, { status: 400 });
  const { apiKey, baseUrl, model } = providerConfig();
  if (!apiKey || !model) return NextResponse.json({ error: 'AI planning is not configured. Add AI_API_KEY and AI_MODEL to the Vercel project environment.' }, { status: 503 });

  const { period, startDate, existingTasks, preferences } = parsed.data;
  const days = period === 'day' ? 1 : 7;
  const prompt = `Create an editable ${period} plan beginning on ${startDate}. The plan must use local calendar time and return dayOffset 0-${days - 1}. For a daily plan, cover the full 24-hour day with sensible sleep, recovery, focus, administration and personal-brand blocks; do not schedule every minute, but ensure the timeline accounts for the whole day. For a weekly plan, distribute focused work across all seven days and protect recovery. Avoid overlapping blocks. Use whole-hour starts and durations. Prioritize one primary outcome, engineering depth, shipping, and a small amount of content/business work. Existing blocks are constraints; do not duplicate or overlap them. User preferences: ${preferences || 'No additional preferences.'}\n\nExisting blocks:\n${JSON.stringify(existingTasks)}\n\nReturn JSON only with this exact shape: {"title":"...","summary":"...","blocks":[{"dayOffset":0,"startHour":9,"durationHours":2,"title":"...","priority":"high|normal|low","rationale":"..."}]}. Include a concise rationale per block.\n\nPersonality context:\n${PERSONALITY}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 5000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a disciplined executive planning assistant. Return valid JSON only. Never invent appointments or claim work is complete.' },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const payload = await response.json().catch(() => null) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } } | null;
  if (!response.ok) return NextResponse.json({ error: payload?.error?.message || 'The AI provider could not create a plan.' }, { status: 502 });
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return NextResponse.json({ error: 'The AI provider returned an empty plan.' }, { status: 502 });
  let draft: unknown;
  try { draft = JSON.parse(content); } catch { return NextResponse.json({ error: 'The AI returned invalid plan JSON. Try again.' }, { status: 502 }); }
  const validated = Draft.safeParse(draft);
  if (!validated.success) return NextResponse.json({ error: 'The AI returned an invalid plan structure. Try again.' }, { status: 502 });
  const safeBlocks = validated.data.blocks.filter((block) => block.dayOffset < days);
  return NextResponse.json({ ...validated.data, blocks: safeBlocks });
}
