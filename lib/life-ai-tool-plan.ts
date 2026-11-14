import { z } from 'zod';

const PlanSchema = z.object({
  action: z.enum(['none', 'search_books']),
  query: z.string().trim().max(120).optional(),
}).strict();

export type LifeAiToolPlan = { action: 'none' } | { action: 'search_books'; query: string };

export function parseLifeAiToolPlan(raw: string): LifeAiToolPlan | null {
  try {
    const source = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const parsed = PlanSchema.safeParse(JSON.parse(source) as unknown);
    if (!parsed.success || parsed.data.action === 'none') return parsed.success ? { action: 'none' } : null;
    const query = parsed.data.query?.replace(/\s+/g, ' ').trim();
    return query && query.length >= 2 ? { action: parsed.data.action, query } : null;
  } catch { return null; }
}
